import { NextResponse } from "next/server"

import { coachCorePrompt, consumeDailyQuota, getAiClient, getRecentEntryContext } from "@/lib/ai"
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
      logAiRouteEvent("ai/relationship-portrait", requestId, {
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
    }
    try {
      body = (await request.json()) as typeof body
    } catch {
      return NextResponse.json({ error: "请求格式无效", requestId }, { status: 400 })
    }

    const relatedCount = body.relatedEntries?.length ?? 0
    const recentEntries = await getRecentEntryContext(userId)
    const relatedEntries =
      body.relatedEntries
        ?.slice(0, 15)
        .map((item) => {
          const t = item.created_at ? String(item.created_at).slice(0, 10) : ""
          const head = t ? `[${t}] ` : ""
          return `- ${head}${item.content}（${item.mood}）`
        })
        .join("\n") || "- 暂无"

    const prompt = `请生成关系画像卡，分析对象：${body.relationship?.name ?? ""}\n与该对象相关的日记（按时间从新到旧，至多15条）是核心依据，请串联其中的具体情节与情绪，避免空泛套话。\n关系信息：分组=${body.relationship?.group_type ?? ""}，情绪标签=${body.relationship?.emotion_tag ?? ""}\n性格：${body.relationship?.personality ?? "暂无"}\n成长背景：${body.relationship?.background ?? "暂无"}\n备注：${body.relationship?.notes ?? "暂无"}\n相关日记：\n${relatedEntries}\n用户其他近期记录：\n${recentEntries}\n\n按以下结构输出，<=100字：\n- 关系倾向\n- 情感支持度\n- 稳定性\n- 风险提示\n- 互动模式\n- 建议方向\n要求用「可能/倾向/可以考虑」，不替用户做决定；「建议方向」须指向日记中的具体事件，无细节则说明线索不足。`

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.6,
      messages: [
        { role: "system", content: coachCorePrompt },
        { role: "user", content: prompt },
      ],
    })

    logAiRouteEvent("ai/relationship-portrait", requestId, {
      userId,
      ok: true,
      meta: {
        relatedEntriesCount: relatedCount,
        hasRelationshipPayload: Boolean(body.relationship?.name),
      },
    })

    return NextResponse.json({
      reply: completion.choices[0]?.message?.content ?? "画像线索不足，建议补充更多互动场景。",
      remaining: quota.remaining,
    })
  } catch (error) {
    return aiJsonError(requestId, 500, "服务暂时不可用，请稍后再试", "ai/relationship-portrait", error, userId)
  }
}
