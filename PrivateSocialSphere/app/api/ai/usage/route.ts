import { NextResponse } from "next/server"

import { AI_LIMIT_DAILY, getTodayRemaining } from "@/lib/ai"
import { getUserIdFromRequest } from "@/lib/api-auth"

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "未登录或鉴权失败" }, { status: 401 })
    const remaining = await getTodayRemaining(userId)
    return NextResponse.json({ remaining, dailyLimit: AI_LIMIT_DAILY })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "读取额度失败" }, { status: 500 })
  }
}
