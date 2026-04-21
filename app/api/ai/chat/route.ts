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
    if (!quota.allowed) return NextResponse.json({ error: "今日次数已用完" }, { status: 429 })

    const client = getAiClient()
    if (!client) {
      logAiRouteEvent("ai/chat", requestId, {
        userId,
        ok: false,
        meta: { reason: "missing_ai_client" },
      })
      return NextResponse.json({ error: "AI 服务暂时不可用", requestId }, { status: 503 })
    }

    let body: { message?: string; history?: Array<{ role: "user" | "assistant"; content: string }> }
    try {
      body = (await request.json()) as typeof body
    } catch {
      return NextResponse.json({ error: "请求格式无效", requestId }, { status: 400 })
    }

    const recent = await getRecentEntryContext(userId)
    const userMessage = body.message?.trim() || null
    const history = (body.history ?? []).slice(-10).map((item) => ({
      role: item.role,
      content: item.content,
    }))

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: structuredCoachPrompt },
        {
          role: "system",
          content: `请使用以下 JSON 上下文回答；字段为 null 表示缺失，不得编造缺失信息。\n${JSON.stringify(
            { recent_entries: recent },
            null,
            2
          )}`,
        },
        ...history,
        {
          role: "user",
          content: `${JSON.stringify(
            { user_message: userMessage },
            null,
            2
          )}\n请按结构输出：【情绪识别】【关系模式】【可能的另一种视角】【风险提示】【建议方向】；总字数<=100字，语言简洁，不给绝对结论。`,
        },
      ],
    })

    logAiRouteEvent("ai/chat", requestId, {
      userId,
      ok: true,
      meta: {
        historyTurns: history.length,
        messageLen: userMessage?.length ?? 0,
      },
    })

    const reply = completion.choices[0]?.message?.content?.trim() ?? ""
    if (!reply) {
      logAiRouteEvent("ai/chat", requestId, {
        userId,
        ok: false,
        meta: { reason: "empty_model_reply" },
      })
      return NextResponse.json({ error: "模型未返回有效内容", requestId }, { status: 502 })
    }

    return NextResponse.json({ reply, remaining: quota.remaining })
  } catch (error) {
    return aiJsonError(requestId, 500, "服务暂时不可用，请稍后再试", "ai/chat", error, userId)
  }
}
