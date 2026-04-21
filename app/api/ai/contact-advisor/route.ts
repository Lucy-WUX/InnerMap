import { NextResponse } from "next/server"

import { coachCorePrompt, getAiClient } from "@/lib/ai"

const MAX_MESSAGE_LEN = 8000
const MAX_CONTEXT_LEN = 12000

/**
 * 晓观对话（联系人上下文）：与首页同一 Agent，不依赖登录与 Supabase 配额，仅需 AI_API_KEY / OPENAI_API_KEY。
 * 上下文由客户端传入该联系人的档案与互动摘要。
 */
export async function POST(request: Request) {
  const client = getAiClient()
  if (!client) {
    return NextResponse.json(
      { error: "未配置 AI：请在服务器环境变量中设置 AI_API_KEY 或 OPENAI_API_KEY。" },
      { status: 503 }
    )
  }

  let body: { message?: string; context?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 })
  }

  const message = (body.message ?? "").trim()
  if (!message) {
    return NextResponse.json({ error: "消息不能为空" }, { status: 400 })
  }
  if (message.length > MAX_MESSAGE_LEN) {
    return NextResponse.json({ error: "消息过长" }, { status: 400 })
  }

  let context = (body.context ?? "").trim()
  if (context.length > MAX_CONTEXT_LEN) {
    context = `${context.slice(0, MAX_CONTEXT_LEN)}\n…（上下文已截断）`
  }
  if (!context) {
    context = "null"
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
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

    const reply = completion.choices[0]?.message?.content?.trim() ?? ""
    if (!reply) {
      return NextResponse.json({ error: "晓观暂时无法回复，请稍后重试" }, { status: 502 })
    }

    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ error: "晓观暂时无法回复，请稍后重试" }, { status: 502 })
  }
}
