import { NextResponse } from "next/server"

import { coachCorePrompt, getAiClient, getAiModel } from "@/lib/ai"
import { aiJsonError, logAiRouteEvent, newAiRequestId } from "@/lib/ai-route-helpers"

const MAX_MESSAGE_LEN = 8000
const MAX_CONTEXT_LEN = 12000

async function requestAdvisorReply(params: {
  model: string
  message: string
  context: string
  client: NonNullable<ReturnType<typeof getAiClient>>
}) {
  const { model, message, context, client } = params
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.6,
    max_tokens: 280,
    messages: [
      { role: "system", content: coachCorePrompt },
      {
        role: "system",
        content: `你是晓观。用户正在就「某位联系人」向你提问；以下 JSON 中的 contact_context 是该联系人的档案与互动摘要。请基于这些材料个性化回答；字段为 null 表示缺失，不得编造缺失信息。\n\n${JSON.stringify(
          {
            contact_context: context === "null" ? null : context,
          },
          null,
          2
        )}`,
      },
      { role: "user", content: message },
    ],
  })

  return completion.choices[0]?.message?.content?.trim() ?? ""
}

/**
 * 晓观对话（联系人上下文）：与首页同一 Agent，不依赖登录与 Supabase 配额。
 * 支持 OpenAI 兼容接口（如 DeepSeek）：AI_API_KEY + AI_BASE_URL + AI_MODEL。
 * 上下文由客户端传入该联系人的档案与互动摘要。
 */
export async function POST(request: Request) {
  const requestId = newAiRequestId()
  const client = getAiClient()
  if (!client) {
    logAiRouteEvent("ai/contact-advisor", requestId, {
      ok: false,
      meta: { reason: "missing_ai_client" },
    })
    return NextResponse.json(
      { error: "未配置 AI：请设置 AI_API_KEY（兼容 DeepSeek/OpenAI）。", requestId },
      { status: 503 }
    )
  }

  let body: { message?: string; context?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: "请求格式无效", requestId }, { status: 400 })
  }

  const message = (body.message ?? "").trim()
  if (!message) {
    return NextResponse.json({ error: "消息不能为空", requestId }, { status: 400 })
  }
  if (message.length > MAX_MESSAGE_LEN) {
    return NextResponse.json({ error: "消息过长", requestId }, { status: 400 })
  }

  let context = (body.context ?? "").trim()
  if (context.length > MAX_CONTEXT_LEN) {
    context = `${context.slice(0, MAX_CONTEXT_LEN)}\n…（上下文已截断）`
  }
  if (!context) {
    context = "null"
  }

  const model = getAiModel("gpt-4o-mini")
  try {
    let reply = ""
    try {
      reply = await requestAdvisorReply({ model, message, context, client })
    } catch {
      // 上游偶发超时/抖动时，重试一次以减少前端失败提示
      reply = await requestAdvisorReply({ model, message, context, client })
    }

    if (!reply) {
      logAiRouteEvent("ai/contact-advisor", requestId, {
        ok: false,
        meta: { reason: "empty_model_reply", messageLen: message.length, hasContext: context !== "null" },
      })
      return NextResponse.json({ error: "晓观暂时无法回复，请稍后重试", requestId }, { status: 502 })
    }

    logAiRouteEvent("ai/contact-advisor", requestId, {
      ok: true,
      meta: { messageLen: message.length, hasContext: context !== "null", model },
    })
    return NextResponse.json({ reply, requestId })
  } catch (error) {
    return aiJsonError(requestId, 502, "晓观暂时无法回复，请稍后重试（可重发一次）", "ai/contact-advisor", error, null, {
      messageLen: message.length,
      hasContext: context !== "null",
      model,
    })
  }
}
