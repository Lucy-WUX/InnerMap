import { NextRequest, NextResponse } from "next/server"

import { getUserIdFromRequest } from "@/lib/api-auth"
import { getSupabaseServiceRoleClient } from "@/lib/supabase-service"

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { code?: string }
  const code = (body.code ?? "").trim().toUpperCase()
  const userId = await getUserIdFromRequest(req)

  if (!userId) {
    return NextResponse.json({ error: "请先登录后再激活兑换码。" }, { status: 401 })
  }

  if (!/^[A-Z0-9]{16}$/.test(code)) {
    return NextResponse.json({ error: "兑换码格式无效，请输入 16 位字母数字组合。" }, { status: 400 })
  }

  const admin = getSupabaseServiceRoleClient()
  if (!admin) {
    return NextResponse.json({ error: "服务端未配置 SUPABASE_SERVICE_ROLE_KEY，暂不可激活。" }, { status: 503 })
  }

  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID()
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? ""
  const ua = req.headers.get("user-agent") ?? ""

  const { data, error } = await admin.rpc("redeem_pro_code", {
    p_code: code,
    p_user_id: userId,
    p_request_id: requestId,
    p_ip: ip,
    p_user_agent: ua,
  })

  if (error) {
    return NextResponse.json({ error: `核销失败：${error.message}` }, { status: 500 })
  }

  const result = Array.isArray(data) ? data[0] : null
  if (!result) {
    return NextResponse.json({ error: "核销结果异常，请稍后重试。" }, { status: 500 })
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error_message ?? "兑换失败", code: result.error_code ?? "redeem_failed" },
      { status: result.error_code === "already_used" ? 409 : 400 }
    )
  }

  return NextResponse.json({
    ok: true,
    planKey: result.plan_key,
    codeId: result.code_id,
    message: "兑换成功，Pro 权益已绑定到当前账号。",
  })
}
