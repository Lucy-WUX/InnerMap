import { NextRequest, NextResponse } from "next/server"

import { isBillingAdminRequest } from "@/lib/billing-admin-auth"
import { getSupabaseServiceRoleClient } from "@/lib/supabase-service"

type Body = {
  action?: "disable" | "enable"
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isBillingAdminRequest(req)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }
  const admin = getSupabaseServiceRoleClient()
  if (!admin) {
    return NextResponse.json({ error: "服务端未配置 SUPABASE_SERVICE_ROLE_KEY" }, { status: 503 })
  }

  const { action } = (await req.json().catch(() => ({}))) as Body
  if (!action || (action !== "disable" && action !== "enable")) {
    return NextResponse.json({ error: "action 参数无效" }, { status: 400 })
  }

  const { id } = await context.params
  const { data: current, error: currentErr } = await admin
    .from("billing_redeem_codes")
    .select("id,status,used_by,used_at")
    .eq("id", id)
    .single()
  if (currentErr || !current) {
    return NextResponse.json({ error: "兑换码不存在" }, { status: 404 })
  }

  if (action === "enable" && current.status === "redeemed") {
    return NextResponse.json({ error: "已核销兑换码不可重新启用为未使用状态" }, { status: 409 })
  }

  const nextStatus = action === "disable" ? "disabled" : "issued"
  const { error } = await admin.from("billing_redeem_codes").update({ status: nextStatus }).eq("id", id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await admin.from("billing_redeem_audit_logs").insert({
    code_id: id,
    event_type: action === "disable" ? "admin_disabled" : "admin_enabled",
    detail: {},
  })

  return NextResponse.json({ ok: true, id, status: nextStatus })
}
