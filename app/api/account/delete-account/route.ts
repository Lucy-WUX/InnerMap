import { NextResponse } from "next/server"

import { ACCOUNT_DELETION_CONFIRM_PHRASE } from "@/lib/account-constants"
import { deleteAllUserDataRows } from "@/lib/account-data-wipe"
import { getUserIdFromRequest } from "@/lib/api-auth"
import { getSupabaseServiceRoleClient } from "@/lib/supabase-service"

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: "未授权，请先登录。" }, { status: 401 })
  }

  let confirmText = ""
  try {
    const body = (await request.json()) as { confirmText?: string }
    confirmText = typeof body.confirmText === "string" ? body.confirmText.trim() : ""
  } catch {
    /* ignore */
  }

  if (confirmText !== ACCOUNT_DELETION_CONFIRM_PHRASE) {
    return NextResponse.json(
      { error: `请输入「${ACCOUNT_DELETION_CONFIRM_PHRASE}」以确认注销。` },
      { status: 400 },
    )
  }

  const admin = getSupabaseServiceRoleClient()
  if (!admin) {
    return NextResponse.json(
      { error: "服务端未配置 SUPABASE_SERVICE_ROLE_KEY，无法完成账号注销。" },
      { status: 503 },
    )
  }

  const wiped = await deleteAllUserDataRows(admin, userId)
  if (!wiped.ok) {
    return NextResponse.json({ error: wiped.message }, { status: 500 })
  }

  const { error: authErr } = await admin.auth.admin.deleteUser(userId)
  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
