import { NextResponse } from "next/server"

import { coachCorePrompt, getAiClient } from "@/lib/ai"

const MAX_MESSAGE_LEN = 8000
const MAX_CONTEXT_LEN = 12000

/**
 * 联系人「AI 顾问」：不依赖登录与 Supabase 配额，仅需服务端配置 AI_API_KEY / OPENAI_API_KEY。
 * 供本地模式等场景在配置密钥后获得真实模型回复；上下文由客户端传入（本地已保存的档案与互动）。
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
          content: `请基于以下 JSON 上下文回答；字段为 null 表示缺失，不得编造缺失信息。\n\n${JSON.stringify(
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
      return NextResponse.json({ error: "模型未返回有效内容" }, { status: 502 })
    }

    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ error: "调用模型失败，请稍后重试" }, { status: 502 })
  }
}
