import { NextRequest, NextResponse } from "next/server"

import { generateRedeemCode, hashRedeemCode, maskRedeemCode } from "@/lib/billing-code-utils"
import { isBillingAdminRequest } from "@/lib/billing-admin-auth"
import { type PlanKey } from "@/lib/pricing-config"
import { getSupabaseServiceRoleClient } from "@/lib/supabase-service"

type Body = {
  plan?: PlanKey
  count?: number
  expiresAt?: string | null
  note?: string
  channel?: "wechat" | "alipay" | "stripe" | "manual"
}

function isPlanKey(plan: string): plan is PlanKey {
  return plan === "lifetime" || plan === "year" || plan === "quarter" || plan === "month"
}

export async function POST(req: NextRequest) {
  if (!isBillingAdminRequest(req)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as Body
  const plan = body.plan ?? "month"
  const count = Math.max(1, Math.min(500, Math.floor(body.count ?? 1)))
  const expiresAt = body.expiresAt ?? null
  const note = (body.note ?? "").trim() || null
  const channel = body.channel ?? "manual"

  if (!isPlanKey(plan)) {
    return NextResponse.json({ error: "plan 参数无效" }, { status: 400 })
  }

  const admin = getSupabaseServiceRoleClient()
  if (!admin) {
    return NextResponse.json({ error: "服务端未配置 SUPABASE_SERVICE_ROLE_KEY" }, { status: 503 })
  }

  const codes: string[] = []
  const rows = []
  for (let i = 0; i < count; i++) {
    const code = generateRedeemCode()
    codes.push(code)
    rows.push({
      plan_key: plan,
      code_hash: hashRedeemCode(code),
      code_mask: maskRedeemCode(code),
      expires_at: expiresAt,
      note,
      channel,
      issued_by: "api-admin",
    })
  }

  const { error } = await admin.from("billing_redeem_codes").insert(rows)
  if (error) {
    return NextResponse.json({ error: `创建兑换码失败：${error.message}` }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    plan,
    count,
    codes,
    warning: "请妥善保存明文兑换码；数据库仅保存哈希值，无法反查。",
  })
}
