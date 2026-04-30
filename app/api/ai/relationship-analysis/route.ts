import { NextResponse } from "next/server"

import { structuredCoachPrompt, consumeDailyQuota, getAiClient, getAiModel, getRecentEntryContext } from "@/lib/ai"
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
      logAiRouteEvent("ai/relationship-analysis", requestId, {
        userId,
        ok: false,
        meta: { reason: "missing_ai_client" },
      })
      return NextResponse.json({ error: "AI 服务暂时不可用", requestId }, { status: 503 })
    }

    let body: {
      relationship?: {
        name?: string
        group_type?: string
        emotion_tag?: string
        personality?: string | null
        background?: string | null
        notes?: string | null
      }
      relatedEntries?: Array<{ content: string; mood: string; created_at?: string }>
      question?: string | null
    }
    try {
      body = (await request.json()) as typeof body
    } catch {
      return NextResponse.json({ error: "请求格式无效", requestId }, { status: 400 })
    }

    const relatedCount = body.relatedEntries?.length ?? 0
    const relationshipName = body.relationship?.name?.trim() || null
    const relationshipGroup = body.relationship?.group_type?.trim() || null
    const relationshipEmotionTag = body.relationship?.emotion_tag?.trim() || null
    const relationshipPersonality = body.relationship?.personality?.trim() || null
    const relationshipBackground = body.relationship?.background?.trim() || null
    const relationshipNotes = body.relationship?.notes?.trim() || null
    const userQuestion = body.question?.trim() || null
    const recentEntries = await getRecentEntryContext(userId)
    const mappedRelatedEntries =
      body.relatedEntries
        ?.slice(0, 15)
        .map((item) => {
          const t = "created_at" in item && item.created_at ? String(item.created_at).slice(0, 10) : ""
          const head = t ? `[${t}] ` : ""
          return `- ${head}${item.content}（${item.mood}）`
        })
        .join("\n") || null
    const analysisPayload = {
      relationship: {
        name: relationshipName,
        group_type: relationshipGroup,
        emotion_tag: relationshipEmotionTag,
        personality: relationshipPersonality,
        background: relationshipBackground,
        notes: relationshipNotes,
      },
      related_entries: mappedRelatedEntries,
      recent_entries: recentEntries,
      user_question: userQuestion,
    }
    const prompt = `请基于以下 JSON 上下文分析关系；字段为 null 表示该项缺失，不得脑补缺失字段。\n\n${JSON.stringify(
      analysisPayload,
      null,
      2
    )}\n\n请按固定结构输出：\n【情绪识别】\n【关系模式】\n【可能的另一种视角】\n【风险提示】\n【建议方向】\n\n务必<=100字，不给绝对结论；建议须指向 JSON 中的具体细节，无细节则明确写“线索不足”。`

    const completion = await client.chat.completions.create({
      model: getAiModel("gpt-4.1-mini"),
      temperature: 0.6,
      messages: [
        { role: "system", content: structuredCoachPrompt },
        { role: "user", content: prompt },
      ],
    })

    logAiRouteEvent("ai/relationship-analysis", requestId, {
      userId,
      ok: true,
      meta: {
        relatedEntriesCount: relatedCount,
        questionLen: userQuestion?.length ?? 0,
        hasRelationshipPayload: Boolean(body.relationship?.name),
      },
    })

    const reply = completion.choices[0]?.message?.content?.trim() ?? ""
    if (!reply) {
      logAiRouteEvent("ai/relationship-analysis", requestId, {
        userId,
        ok: false,
        meta: { reason: "empty_model_reply" },
      })
      return NextResponse.json({ error: "模型未返回有效内容", requestId }, { status: 502 })
    }

    return NextResponse.json({ reply, remaining: quota.remaining })
  } catch (error) {
    return aiJsonError(requestId, 500, "服务暂时不可用，请稍后再试", "ai/relationship-analysis", error, userId)
  }
}
