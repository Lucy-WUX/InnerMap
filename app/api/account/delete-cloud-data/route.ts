import { NextResponse } from "next/server"

import { deleteAllUserDataRows } from "@/lib/account-data-wipe"
import { getUserIdFromRequest } from "@/lib/api-auth"
import { getSupabaseServiceRoleClient } from "@/lib/supabase-service"

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    return NextResponse.json({ error: "未授权，请先登录。" }, { status: 401 })
  }

  const admin = getSupabaseServiceRoleClient()
  if (!admin) {
    return NextResponse.json(
      { error: "服务端未配置 SUPABASE_SERVICE_ROLE_KEY，无法执行云端清理。" },
      { status: 503 },
    )
  }

  const wiped = await deleteAllUserDataRows(admin, userId)
  if (!wiped.ok) {
    return NextResponse.json({ error: wiped.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
