import { randomUUID } from "crypto"
import { NextResponse } from "next/server"

const REDACT = "[redacted]"

export function newAiRequestId(): string {
  return randomUUID()
}

function stripPotentialSecrets(message: string): string {
  return message
    .replace(/sk-[a-zA-Z0-9_-]{10,}/g, REDACT)
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, `Bearer ${REDACT}`)
    .replace(/api[_-]?key[=:]\s*[\w-]+/gi, `api_key=${REDACT}`)
}

function truncate(message: string, max: number): string {
  if (message.length <= max) return message
  return `${message.slice(0, max)}…`
}

export type AiRouteLogMeta = Record<string, string | number | boolean | undefined>

/**
 * 服务端诊断日志：不包含用户正文、日记、关系名、完整 prompt。
 * 生产环境仅对失败请求打一行 JSON；开发环境或 AI_ROUTE_LOG=1 时输出更完整（仍脱敏）。
 */
export function logAiRouteEvent(
  route: string,
  requestId: string,
  payload: {
    userId?: string | null
    ok: boolean
    error?: unknown
    meta?: AiRouteLogMeta
  },
) {
  const userRef =
    payload.userId && payload.userId.length >= 10 ? `${payload.userId.slice(0, 8)}…` : payload.userId ? "set" : null

  const base = {
    tag: "innermap-ai-api",
    route,
    requestId,
    user: userRef,
    ok: payload.ok,
    ...(payload.meta ?? {}),
  }

  if (!payload.ok) {
    const err = payload.error
    const name = err instanceof Error ? err.name : err ? "non-error" : "none"
    let message = err instanceof Error ? err.message : err ? String(err) : ""
    message = message ? truncate(stripPotentialSecrets(message), 280) : ""

    const verbose = process.env.NODE_ENV === "development" || process.env.AI_ROUTE_LOG === "1"

    if (verbose && message) {
      console.error(JSON.stringify({ ...base, errName: name, errMsg: message }))
    } else {
      console.error(JSON.stringify({ ...base, errName: name }))
    }
    return
  }

  if (process.env.AI_ROUTE_LOG === "1") {
    console.info(JSON.stringify(base))
  }
}

/** 对外统一错误体，不把上游/堆栈原文直接返回给客户端 */
export function aiJsonError(
  requestId: string,
  status: number,
  publicMessage: string,
  route: string,
  error?: unknown,
  userId?: string | null,
  meta?: AiRouteLogMeta,
) {
  logAiRouteEvent(route, requestId, { userId, ok: false, error, meta })
  return NextResponse.json({ error: publicMessage, requestId }, { status })
}
