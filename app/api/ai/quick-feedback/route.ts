import { NextResponse } from "next/server"

import { structuredCoachPrompt, consumeDailyQuota, getAiClient, getRecentEntryContext } from "@/lib/ai"
import { aiJsonError, logAiRouteEvent, newAiRequestId } from "@/lib/ai-route-helpers"
import { getUserIdFromRequest } from "@/lib/api-auth"

export async function POST(request: Request) {
  const requestId = newAiRequestId()
  let userId: string | null = null
  try {
    userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "未登录或鉴权失败" }, { status: 401 })

    const quota = await consumeDailyQuota(userId)
    if (!quota.allowed) {
      return NextResponse.json({ error: "今日次数已用完" }, { status: 429 })
    }

    const client = getAiClient()
    if (!client) {
      logAiRouteEvent("ai/quick-feedback", requestId, {
        userId,
        ok: false,
        meta: { reason: "missing_ai_client" },
      })
      return NextResponse.json({ error: "AI 服务暂时不可用", requestId }, { status: 503 })
    }

    let body: { content?: string; mood?: string; peopleTag?: string | null }
    try {
      body = (await request.json()) as typeof body
    } catch {
      return NextResponse.json({ error: "请求格式无效", requestId }, { status: 400 })
    }

    const recent = await getRecentEntryContext(userId)
    const prompt = `用户最近记录（请与当前输入串联理解，避免脱离上下文的通用建议）：\n${recent}\n\n当前输入：${body.content ?? ""}\n情绪：${body.mood ?? ""}\n人物：${body.peopleTag ?? "无"}\n请按结构输出：\n【情绪识别】\n【关系模式】\n【可能的另一种视角】\n【风险提示】\n【建议方向】\n要求总字数<=100字，不给绝对结论；建议须结合当前输入或最近记录中的具体情节。`

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: structuredCoachPrompt },
        { role: "user", content: prompt },
      ],
    })

    logAiRouteEvent("ai/quick-feedback", requestId, {
      userId,
      ok: true,
      meta: {
        contentLen: (body.content ?? "").length,
        hasPeopleTag: Boolean(body.peopleTag?.trim()),
      },
    })

    return NextResponse.json({
      reply: completion.choices[0]?.message?.content ?? "我看见你的感受了，我们可以慢慢理清。",
      remaining: quota.remaining,
    })
  } catch (error) {
    return aiJsonError(requestId, 500, "服务暂时不可用，请稍后再试", "ai/quick-feedback", error, userId)
  }
}
