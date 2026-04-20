import { NextResponse } from "next/server"

import { AI_LIMIT_DAILY, getTodayRemaining } from "@/lib/ai"
import { aiJsonError, newAiRequestId } from "@/lib/ai-route-helpers"
import { getUserIdFromRequest } from "@/lib/api-auth"

export async function GET(request: Request) {
  const requestId = newAiRequestId()
  let userId: string | null = null
  try {
    userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "未登录或鉴权失败" }, { status: 401 })
    const remaining = await getTodayRemaining(userId)
    return NextResponse.json({ remaining, dailyLimit: AI_LIMIT_DAILY })
  } catch (error) {
    return aiJsonError(requestId, 500, "读取额度失败，请稍后再试", "ai/usage", error, userId)
  }
}
