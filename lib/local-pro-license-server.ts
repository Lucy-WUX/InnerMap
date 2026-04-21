import { createSign, createVerify } from "crypto"

import type { PlanKey } from "@/lib/pricing-config"

export type LocalProLicensePayload = {
  v: 1
  licenseId: string
  plan: PlanKey
  issuedAt: number
  expiresAt: number | null
  maxDevices: number
}

function toBase64Url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8")
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function fromBase64Url(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  return Buffer.from(padded, "base64")
}

function getPrivateKey() {
  return process.env.LOCAL_PRO_PRIVATE_KEY_PEM || ""
}

function getPublicKey() {
  return process.env.LOCAL_PRO_PUBLIC_KEY_PEM || process.env.NEXT_PUBLIC_LOCAL_PRO_PUBLIC_KEY_PEM || ""
}

export function signLocalProLicense(payload: LocalProLicensePayload) {
  const privateKey = getPrivateKey()
  if (!privateKey) throw new Error("LOCAL_PRO_PRIVATE_KEY_PEM 未配置")
  const data = toBase64Url(JSON.stringify(payload))
  const signer = createSign("SHA256")
  signer.update(data)
  signer.end()
  const sig = signer.sign(privateKey)
  return `IM1.${data}.${toBase64Url(sig)}`
}

export function verifyLocalProLicenseCode(code: string): { ok: true; payload: LocalProLicensePayload } | { ok: false; error: string } {
  const publicKey = getPublicKey()
  if (!publicKey) return { ok: false, error: "LOCAL_PRO_PUBLIC_KEY_PEM 未配置" }
  const parts = code.trim().split(".")
  if (parts.length !== 3 || parts[0] !== "IM1") return { ok: false, error: "兑换码格式无效" }
  const [, payloadB64, sigB64] = parts
  try {
    const payloadText = fromBase64Url(payloadB64).toString("utf8")
    const payload = JSON.parse(payloadText) as LocalProLicensePayload
    const verifier = createVerify("SHA256")
    verifier.update(payloadB64)
    verifier.end()
    const ok = verifier.verify(publicKey, fromBase64Url(sigB64))
    if (!ok) return { ok: false, error: "签名校验失败" }
    if (payload.v !== 1) return { ok: false, error: "兑换码版本无效" }
    if (payload.expiresAt && payload.expiresAt <= Date.now()) return { ok: false, error: "兑换码已过期" }
    return { ok: true, payload }
  } catch {
    return { ok: false, error: "兑换码解析失败" }
  }
}
