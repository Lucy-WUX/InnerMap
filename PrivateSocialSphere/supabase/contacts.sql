create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  mood text not null check (mood in ('happy', 'sad', 'anxious', 'angry')),
  people_tag text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  group_type text not null check (group_type in ('family', 'friend', 'classmate', 'colleague', 'professional', 'intimate')),
  emotion_tag text not null check (emotion_tag in ('positive', 'negative', 'mixed')),
  personality text,
  background text,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.relationships add column if not exists group_type text;
alter table public.relationships add column if not exists personality text;
alter table public.relationships add column if not exists background text;
alter table public.relationships add column if not exists relation_type text;

update public.relationships
set group_type = case
  when group_type is not null then group_type
  when relation_type = 'family' then 'family'
  when relation_type = 'friend' then 'friend'
  when relation_type = 'colleague' then 'colleague'
  when relation_type = 'romantic' then 'intimate'
  else 'friend'
end;

alter table public.relationships alter column group_type set not null;

create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  count int not null default 0,
  date date not null default current_date
);

alter table public.users enable row level security;
alter table public.entries enable row level security;
alter table public.relationships enable row level security;
alter table public.ai_usage enable row level security;

drop policy if exists "users own row" on public.users;
create policy "users own row" on public.users for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "entries own rows" on public.entries;
create policy "entries own rows" on public.entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "relationships own rows" on public.relationships;
create policy "relationships own rows" on public.relationships for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ai usage own rows" on public.ai_usage;
create policy "ai usage own rows" on public.ai_usage for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

