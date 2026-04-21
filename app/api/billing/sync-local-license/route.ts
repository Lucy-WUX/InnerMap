import { NextRequest, NextResponse } from "next/server"

import { getUserIdFromRequest } from "@/lib/api-auth"
import { verifyLocalProLicenseCode } from "@/lib/local-pro-license-server"
import { getSupabaseServiceRoleClient } from "@/lib/supabase-service"

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { code?: string }
  const code = (body.code ?? "").trim()
  if (!code) return NextResponse.json({ error: "缺少兑换码" }, { status: 400 })

  const verified = verifyLocalProLicenseCode(code)
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 })
  }

  const admin = getSupabaseServiceRoleClient()
  if (!admin) return NextResponse.json({ error: "服务端未配置 SUPABASE_SERVICE_ROLE_KEY" }, { status: 503 })

  const { error: upsertErr } = await admin.from("billing_user_entitlements").upsert(
    {
      user_id: userId,
      plan_key: verified.payload.plan,
      activated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )
  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  await admin.from("billing_redeem_audit_logs").insert({
    event_type: "sync_local_license",
    actor_user_id: userId,
    detail: { licenseId: verified.payload.licenseId, plan: verified.payload.plan, maxDevices: verified.payload.maxDevices },
  })

  return NextResponse.json({ ok: true, planKey: verified.payload.plan })
}
