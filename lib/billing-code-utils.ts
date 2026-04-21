import { createHash, randomBytes } from "crypto"

export function normalizeRedeemCode(raw: string) {
  return raw.trim().toUpperCase()
}

export function hashRedeemCode(code: string) {
  return createHash("sha256").update(normalizeRedeemCode(code)).digest("hex")
}

export function maskRedeemCode(code: string) {
  const normalized = normalizeRedeemCode(code)
  return `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}-****-${normalized.slice(-4)}`
}

export function generateRedeemCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let value = ""
  while (value.length < 16) {
    const bytes = randomBytes(16)
    for (const b of bytes) {
      value += chars[b % chars.length]
      if (value.length === 16) break
    }
  }
  return value
}
