-- Billing redeem production schema
create extension if not exists pgcrypto;

create table if not exists public.billing_redeem_codes (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null check (plan_key in ('lifetime', 'year', 'quarter', 'month')),
  code_hash text not null unique,
  code_mask text not null,
  status text not null default 'issued' check (status in ('issued', 'redeemed', 'disabled')),
  issued_by text,
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  used_by uuid references auth.users (id) on delete set null,
  used_at timestamptz,
  order_ref text,
  channel text check (channel in ('wechat', 'alipay', 'stripe', 'manual')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_redeem_used_fields_sync check (
    (used_by is null and used_at is null) or (used_by is not null and used_at is not null)
  )
);

create index if not exists billing_redeem_codes_plan_idx on public.billing_redeem_codes (plan_key);
create index if not exists billing_redeem_codes_used_by_idx on public.billing_redeem_codes (used_by);

create table if not exists public.billing_user_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan_key text not null check (plan_key in ('lifetime', 'year', 'quarter', 'month')),
  source_code_id uuid unique references public.billing_redeem_codes (id) on delete restrict,
  activated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_redeem_audit_logs (
  id bigserial primary key,
  code_id uuid references public.billing_redeem_codes (id) on delete set null,
  event_type text not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  request_id text,
  ip text,
  user_agent text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists billing_redeem_audit_code_idx on public.billing_redeem_audit_logs (code_id, created_at desc);
create index if not exists billing_redeem_audit_actor_idx on public.billing_redeem_audit_logs (actor_user_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_billing_redeem_codes_updated_at on public.billing_redeem_codes;
create trigger trg_billing_redeem_codes_updated_at
before update on public.billing_redeem_codes
for each row execute function public.touch_updated_at();

drop trigger if exists trg_billing_user_entitlements_updated_at on public.billing_user_entitlements;
create trigger trg_billing_user_entitlements_updated_at
before update on public.billing_user_entitlements
for each row execute function public.touch_updated_at();

create or replace function public.redeem_pro_code(
  p_code text,
  p_user_id uuid,
  p_request_id text default null,
  p_ip text default null,
  p_user_agent text default null
)
returns table (
  ok boolean,
  error_code text,
  error_message text,
  plan_key text,
  code_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_hash text;
  v_found public.billing_redeem_codes%rowtype;
  v_redeemed public.billing_redeem_codes%rowtype;
  v_next_plan text;
begin
  v_code := upper(trim(coalesce(p_code, '')));
  if v_code !~ '^[A-Z0-9]{16}$' then
    insert into public.billing_redeem_audit_logs (event_type, actor_user_id, request_id, ip, user_agent, detail)
    values ('redeem_invalid_format', p_user_id, p_request_id, p_ip, p_user_agent, jsonb_build_object('code_length', length(v_code)));
    return query select false, 'invalid_format', '兑换码格式无效，请输入 16 位字母数字组合。', null::text, null::uuid;
    return;
  end if;

  v_hash := encode(digest(v_code, 'sha256'), 'hex');

  update public.billing_redeem_codes
  set used_by = p_user_id,
      used_at = now(),
      status = 'redeemed'
  where code_hash = v_hash
    and status = 'issued'
    and used_at is null
    and (expires_at is null or expires_at > now())
  returning * into v_redeemed;

  if found then
    v_next_plan := v_redeemed.plan_key;
    insert into public.billing_user_entitlements (user_id, plan_key, source_code_id, activated_at)
    values (p_user_id, v_next_plan, v_redeemed.id, now())
    on conflict (user_id) do update
      set plan_key = excluded.plan_key,
          source_code_id = excluded.source_code_id,
          activated_at = excluded.activated_at;

    insert into public.billing_redeem_audit_logs (code_id, event_type, actor_user_id, request_id, ip, user_agent, detail)
    values (v_redeemed.id, 'redeem_success', p_user_id, p_request_id, p_ip, p_user_agent, jsonb_build_object('plan_key', v_next_plan));

    return query select true, null::text, null::text, v_next_plan, v_redeemed.id;
    return;
  end if;

  select * into v_found from public.billing_redeem_codes where code_hash = v_hash limit 1;
  if not found then
    insert into public.billing_redeem_audit_logs (event_type, actor_user_id, request_id, ip, user_agent, detail)
    values ('redeem_not_found', p_user_id, p_request_id, p_ip, p_user_agent, jsonb_build_object('code_hash_prefix', left(v_hash, 10)));
    return query select false, 'not_found', '兑换码不存在，请检查后重试。', null::text, null::uuid;
    return;
  end if;

  if v_found.status = 'disabled' then
    insert into public.billing_redeem_audit_logs (code_id, event_type, actor_user_id, request_id, ip, user_agent, detail)
    values (v_found.id, 'redeem_disabled', p_user_id, p_request_id, p_ip, p_user_agent, '{}'::jsonb);
    return query select false, 'disabled', '该兑换码已停用，请联系支持。', v_found.plan_key, v_found.id;
    return;
  end if;

  if v_found.expires_at is not null and v_found.expires_at <= now() then
    insert into public.billing_redeem_audit_logs (code_id, event_type, actor_user_id, request_id, ip, user_agent, detail)
    values (v_found.id, 'redeem_expired', p_user_id, p_request_id, p_ip, p_user_agent, jsonb_build_object('expires_at', v_found.expires_at));
    return query select false, 'expired', '该兑换码已过期，请联系支持。', v_found.plan_key, v_found.id;
    return;
  end if;

  if v_found.used_by = p_user_id then
    insert into public.billing_redeem_audit_logs (code_id, event_type, actor_user_id, request_id, ip, user_agent, detail)
    values (v_found.id, 'redeem_idempotent', p_user_id, p_request_id, p_ip, p_user_agent, jsonb_build_object('used_at', v_found.used_at));
    return query select true, null::text, null::text, v_found.plan_key, v_found.id;
    return;
  end if;

  insert into public.billing_redeem_audit_logs (code_id, event_type, actor_user_id, request_id, ip, user_agent, detail)
  values (v_found.id, 'redeem_replay_blocked', p_user_id, p_request_id, p_ip, p_user_agent, jsonb_build_object('used_by', v_found.used_by, 'used_at', v_found.used_at));
  return query select false, 'already_used', '该兑换码已被使用。', v_found.plan_key, v_found.id;
end;
$$;

revoke all on table public.billing_redeem_codes from anon, authenticated;
revoke all on table public.billing_user_entitlements from anon, authenticated;
revoke all on table public.billing_redeem_audit_logs from anon, authenticated;

alter table public.billing_redeem_codes enable row level security;
alter table public.billing_user_entitlements enable row level security;
alter table public.billing_redeem_audit_logs enable row level security;

create policy "billing_entitlements_owner_read"
on public.billing_user_entitlements
for select
to authenticated
using (auth.uid() = user_id);
