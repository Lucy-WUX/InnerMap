import { NextResponse } from "next/server"

import { structuredCoachPrompt, consumeDailyQuota, getAiClient, getRecentEntryContext } from "@/lib/ai"
import { getUserIdFromRequest } from "@/lib/api-auth"

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "未登录或鉴权失败" }, { status: 401 })
    const quota = await consumeDailyQuota(userId)
    if (!quota.allowed) return NextResponse.json({ error: "今日次数已用完" }, { status: 429 })

    const client = getAiClient()
    if (!client) return NextResponse.json({ error: "服务端未配置 AI_API_KEY" }, { status: 500 })

    const body = (await request.json()) as {
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
    const recentEntries = await getRecentEntryContext(userId)
    const mappedRelatedEntries =
      body.relatedEntries
        ?.slice(0, 15)
        .map((item) => {
          const t = "created_at" in item && item.created_at ? String(item.created_at).slice(0, 10) : ""
          const head = t ? `[${t}] ` : ""
          return `- ${head}${item.content}（${item.mood}）`
        })
        .join("\n") || "- 暂无相关日记"
    const prompt = `分析对象：${body.relationship?.name ?? ""}\n\n以下「与该对象相关的日记」按时间从新到旧列出（至多15条），是理解你们之间发生了什么的核心依据；回答用户问题时请主动串联其中的情节与情绪，不要忽略。\n\n关系信息：\n- 分组：${body.relationship?.group_type ?? ""}\n- 情绪标签：${body.relationship?.emotion_tag ?? ""}\n\n性格：\n${body.relationship?.personality ?? "暂无"}\n\n成长背景：\n${body.relationship?.background ?? "暂无"}\n\n备注：\n${body.relationship?.notes ?? "暂无"}\n\n与该对象相关的日记：\n${mappedRelatedEntries}\n\n用户其他近期记录（可能涉及他人）：\n${recentEntries}\n\n用户问题：\n${body.question ?? "请帮我看清这段关系。"}\n\n请按固定结构输出：\n【情绪识别】\n【关系模式】\n【可能的另一种视角】\n【风险提示】\n【建议方向】\n\n务必<=100字，不给绝对结论；建议须指向上述材料中的具体细节，无细节则说明线索不足。`

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.6,
      messages: [
        { role: "system", content: structuredCoachPrompt },
        { role: "user", content: prompt },
      ],
    })
    return NextResponse.json({
      reply: completion.choices[0]?.message?.content ?? "目前线索有限，建议先补充更多互动场景。",
      remaining: quota.remaining,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "请求失败" }, { status: 500 })
  }
}
