import { NextRequest, NextResponse } from "next/server"

import { isBillingAdminRequest } from "@/lib/billing-admin-auth"
import { getSupabaseServiceRoleClient } from "@/lib/supabase-service"

export async function GET(req: NextRequest) {
  if (!isBillingAdminRequest(req)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }
  const admin = getSupabaseServiceRoleClient()
  if (!admin) {
    return NextResponse.json({ error: "服务端未配置 SUPABASE_SERVICE_ROLE_KEY" }, { status: 503 })
  }

  const params = req.nextUrl.searchParams
  const status = params.get("status")
  const plan = params.get("plan")
  const userId = params.get("userId")
  const orderRef = params.get("orderRef")
  const from = params.get("from")
  const to = params.get("to")
  const limit = Math.max(1, Math.min(200, Number(params.get("limit") ?? 50)))
  const offset = Math.max(0, Number(params.get("offset") ?? 0))

  let query = admin
    .from("billing_redeem_codes")
    .select("id,plan_key,code_mask,status,used_by,used_at,issued_at,expires_at,order_ref,channel,note,created_at,updated_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq("status", status)
  if (plan) query = query.eq("plan_key", plan)
  if (userId) query = query.eq("used_by", userId)
  if (orderRef) query = query.ilike("order_ref", `%${orderRef}%`)
  if (from) query = query.gte("created_at", from)
  if (to) query = query.lte("created_at", to)

  const { data, error, count } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, rows: data ?? [], count: count ?? 0, limit, offset })
}
