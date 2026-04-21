import type { PlanKey } from "@/lib/pricing-config"

const LOCAL_LICENSE_STORAGE_KEY = "innermap-local-pro-license-v1"
const LOCAL_DEVICE_ID_KEY = "innermap-local-device-id-v1"

type LocalProLicensePayload = {
  v: 1
  licenseId: string
  plan: PlanKey
  issuedAt: number
  expiresAt: number | null
  maxDevices: number
}

type StoredLocalLicense = {
  code: string
  payload: LocalProLicensePayload
  activatedAt: number
  deviceId: string
}

function fromBase64UrlBytes(data: string) {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function fromBase64UrlToBytes(data: string) {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

function pemToArrayBuffer(pem: string) {
  const body = pem.replace(/-----BEGIN PUBLIC KEY-----/g, "").replace(/-----END PUBLIC KEY-----/g, "").replace(/\s+/g, "")
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function getPublicKeyPem() {
  return process.env.NEXT_PUBLIC_LOCAL_PRO_PUBLIC_KEY_PEM ?? ""
}

export function getOrCreateLocalDeviceId() {
  if (typeof localStorage === "undefined") return "device-unknown"
  const existing = localStorage.getItem(LOCAL_DEVICE_ID_KEY)
  if (existing) return existing
  const next = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `dev-${Date.now()}`
  localStorage.setItem(LOCAL_DEVICE_ID_KEY, next)
  return next
}

export function readStoredLocalProLicense(): StoredLocalLicense | null {
  if (typeof localStorage === "undefined") return null
  try {
    const raw = localStorage.getItem(LOCAL_LICENSE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredLocalLicense
    if (!parsed?.payload?.licenseId) return null
    return parsed
  } catch {
    return null
  }
}

export function isLocalProActiveNow() {
  const lic = readStoredLocalProLicense()
  if (!lic) return false
  if (lic.payload.expiresAt && lic.payload.expiresAt <= Date.now()) return false
  return true
}

export async function verifyOfflineCode(code: string): Promise<{ ok: true; payload: LocalProLicensePayload } | { ok: false; error: string }> {
  const parts = code.trim().split(".")
  if (parts.length !== 3 || parts[0] !== "IM1") return { ok: false, error: "兑换码格式无效" }
  const pem = getPublicKeyPem()
  if (!pem) return { ok: false, error: "未配置本地校验公钥，无法离线激活" }
  const [, payloadB64, sigB64] = parts
  try {
    const payloadText = fromBase64UrlBytes(payloadB64)
    const payload = JSON.parse(payloadText) as LocalProLicensePayload
    const key = await crypto.subtle.importKey(
      "spki",
      pemToArrayBuffer(pem),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    )
    const sigRaw = fromBase64UrlToBytes(sigB64)
    const ok = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      sigRaw,
      new TextEncoder().encode(payloadB64)
    )
    if (!ok) return { ok: false, error: "兑换码签名校验失败" }
    if (payload.expiresAt && payload.expiresAt <= Date.now()) return { ok: false, error: "兑换码已过期" }
    if (payload.v !== 1) return { ok: false, error: "兑换码版本不支持" }
    return { ok: true, payload }
  } catch {
    return { ok: false, error: "兑换码解析失败" }
  }
}

export async function activateLocalProOffline(code: string): Promise<{ ok: true; payload: LocalProLicensePayload } | { ok: false; error: string }> {
  const verified = await verifyOfflineCode(code)
  if (!verified.ok) return verified
  const deviceId = getOrCreateLocalDeviceId()
  const stored: StoredLocalLicense = {
    code: code.trim(),
    payload: verified.payload,
    activatedAt: Date.now(),
    deviceId,
  }
  localStorage.setItem(LOCAL_LICENSE_STORAGE_KEY, JSON.stringify(stored))
  return { ok: true, payload: verified.payload }
}

export function markLocalProSynced(userId: string) {
  if (typeof localStorage === "undefined") return
  const key = "innermap-local-pro-synced-users"
  const prev = JSON.parse(localStorage.getItem(key) ?? "[]") as string[]
  if (prev.includes(userId)) return
  localStorage.setItem(key, JSON.stringify([...prev, userId]))
}

export function hasLocalProSynced(userId: string) {
  if (typeof localStorage === "undefined") return false
  const key = "innermap-local-pro-synced-users"
  const prev = JSON.parse(localStorage.getItem(key) ?? "[]") as string[]
  return prev.includes(userId)
}
