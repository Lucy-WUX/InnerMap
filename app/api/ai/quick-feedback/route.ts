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
    const currentContent = body.content?.trim() || null
    const currentMood = body.mood?.trim() || null
    const currentPeopleTag = body.peopleTag?.trim() || null
    const feedbackPayload = {
      recent_entries: recent,
      current_input: {
        content: currentContent,
        mood: currentMood,
        people_tag: currentPeopleTag,
      },
    }
    const prompt = `请基于以下 JSON 上下文给出简短反馈；字段为 null 表示缺失，不得编造缺失信息。\n\n${JSON.stringify(
      feedbackPayload,
      null,
      2
    )}\n\n请按结构输出：\n【情绪识别】\n【关系模式】\n【可能的另一种视角】\n【风险提示】\n【建议方向】\n要求总字数<=100字，不给绝对结论；建议须结合 JSON 中的具体情节。`

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
        contentLen: currentContent?.length ?? 0,
        hasPeopleTag: Boolean(body.peopleTag?.trim()),
      },
    })

    const reply = completion.choices[0]?.message?.content?.trim() ?? ""
    if (!reply) {
      logAiRouteEvent("ai/quick-feedback", requestId, {
        userId,
        ok: false,
        meta: { reason: "empty_model_reply" },
      })
      return NextResponse.json({ error: "模型未返回有效内容", requestId }, { status: 502 })
    }

    return NextResponse.json({ reply, remaining: quota.remaining })
  } catch (error) {
    return aiJsonError(requestId, 500, "服务暂时不可用，请稍后再试", "ai/quick-feedback", error, userId)
  }
}
