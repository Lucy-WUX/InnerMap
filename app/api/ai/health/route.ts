import { NextResponse } from "next/server"

import { getAiClient, getAiRuntimeInfo } from "@/lib/ai"
import { aiJsonError, logAiRouteEvent, newAiRequestId } from "@/lib/ai-route-helpers"

export async function GET() {
  const requestId = newAiRequestId()
  const runtime = getAiRuntimeInfo()
  const client = getAiClient()

  if (!client) {
    logAiRouteEvent("ai/health", requestId, {
      ok: false,
      meta: { reason: "missing_ai_client", provider: runtime.provider, model: runtime.model },
    })
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "AI 客户端未就绪，请检查 AI_API_KEY（DeepSeek 还需 AI_BASE_URL 与 AI_MODEL）。",
        runtime,
      },
      { status: 503 },
    )
  }

  try {
    const startedAt = Date.now()
    await client.chat.completions.create({
      model: runtime.model,
      temperature: 0,
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 8,
    })
    const latencyMs = Date.now() - startedAt

    logAiRouteEvent("ai/health", requestId, {
      ok: true,
      meta: { provider: runtime.provider, model: runtime.model, latencyMs },
    })

    return NextResponse.json({
      ok: true,
      requestId,
      message: "AI 接口连通正常。",
      runtime,
      probe: { reachable: true, latencyMs },
    })
  } catch (error) {
    return aiJsonError(requestId, 502, "AI 接口探测失败，请检查模型名、Base URL 或 Key。", "ai/health", error, null, {
      provider: runtime.provider,
      model: runtime.model,
    })
  }
}
