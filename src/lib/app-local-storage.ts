import type { GroupKey, RelationContact } from "../components/app/types"
import type { ScoreHistoryPoint } from "./relationship-ai-demo"

export const PERSISTENCE_KEY = "pss-app-snapshot-v1"
export const ONBOARDING_KEY = "pss-onboarding-v1"
export const LOCK_STORAGE_KEY = "pss-app-lock-v1"

export type PersistedInteractionLog = {
  id: string
  contactId: string
  date: string
  type: string
  what: string
  reaction: string
  feel: string
  energy: number
  meaningful?: boolean
  aiInsight?: string
}

export type AppDataSnapshot = {
  version: 1
  exportedAt: string
  contacts: RelationContact[]
  interactionLogs: PersistedInteractionLog[]
  scoreHistory: Record<string, ScoreHistoryPoint[]>
  customGroups: GroupKey[]
  diaryRecords: Record<string, string>
  diaryEmotionRecords: Record<string, "愉悦" | "平静" | "低落" | "愤怒">
  diarySelectedDate: string
  diaryViewMonth: string
  selectedContactId: string
}

export type LockSettings = {
  enabled: boolean
  /** 密码锁；可与 WebAuthn 并存 */
  salt?: string
  hash?: string
  /** WebAuthn 凭证 rawId（base64url） */
  webauthnCredentialId?: string
}

const SESSION_UNLOCK = "pss-session-unlocked"

function scopedKey(baseKey: string, scope?: string) {
  if (!scope) return baseKey
  return `${baseKey}:${scope}`
}

export function isSessionUnlocked(scope?: string): boolean {
  if (typeof sessionStorage === "undefined") return true
  return sessionStorage.getItem(scopedKey(SESSION_UNLOCK, scope)) === "1"
}

export function setSessionUnlocked(value: boolean, scope?: string) {
  if (typeof sessionStorage === "undefined") return
  const key = scopedKey(SESSION_UNLOCK, scope)
  if (value) sessionStorage.setItem(key, "1")
  else sessionStorage.removeItem(key)
}

export function loadLockSettings(scope?: string): LockSettings | null {
  if (typeof localStorage === "undefined") return null
  try {
    const raw = localStorage.getItem(scopedKey(LOCK_STORAGE_KEY, scope))
    if (!raw) return null
    const o = JSON.parse(raw) as LockSettings & { salt?: string; hash?: string; webauthnCredentialId?: string }
    if (!o.enabled) return null
    const hasPwd = typeof o.salt === "string" && typeof o.hash === "string" && o.hash.length > 0
    const hasW = typeof o.webauthnCredentialId === "string" && o.webauthnCredentialId.length > 0
    if (!hasPwd && !hasW) return null
    return {
      enabled: true,
      salt: hasPwd ? o.salt : undefined,
      hash: hasPwd ? o.hash : undefined,
      webauthnCredentialId: hasW ? o.webauthnCredentialId : undefined,
    }
  } catch {
    return null
  }
}

export function saveLockSettings(settings: LockSettings | null, scope?: string) {
  if (typeof localStorage === "undefined") return
  const key = scopedKey(LOCK_STORAGE_KEY, scope)
  if (!settings) {
    localStorage.removeItem(key)
    return
  }
  localStorage.setItem(key, JSON.stringify(settings))
}

function randomSalt() {
  const a = new Uint8Array(16)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("")
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder().encode(`${salt}:${pin}`)
  const buf = await crypto.subtle.digest("SHA-256", enc)
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("")
}

export async function createLockFromPin(pin: string): Promise<LockSettings> {
  const salt = randomSalt()
  const hash = await hashPin(pin, salt)
  return { enabled: true, salt, hash }
}

/** 仅 WebAuthn、不设密码 */
export function createLockWebAuthnOnly(credentialIdB64url: string): LockSettings {
  return { enabled: true, webauthnCredentialId: credentialIdB64url }
}

export async function verifyPin(settings: LockSettings, pin: string): Promise<boolean> {
  if (!settings.salt || !settings.hash) return false
  const h = await hashPin(pin, settings.salt)
  return h === settings.hash
}

/** 是否具备至少一种解锁方式 */
export function lockHasPassword(settings: LockSettings): boolean {
  return Boolean(settings.hash && settings.salt)
}

export function lockHasWebAuthn(settings: LockSettings): boolean {
  return Boolean(settings.webauthnCredentialId)
}

export function loadSnapshot(scope?: string): AppDataSnapshot | null {
  if (typeof localStorage === "undefined") return null
  try {
    const raw = localStorage.getItem(scopedKey(PERSISTENCE_KEY, scope))
    if (!raw) return null
    const o = JSON.parse(raw) as AppDataSnapshot
    if (o.version !== 1 || !Array.isArray(o.contacts)) return null
    return o
  } catch {
    return null
  }
}

export function saveSnapshot(snapshot: Omit<AppDataSnapshot, "version" | "exportedAt">, scope?: string) {
  if (typeof localStorage === "undefined") return
  const full: AppDataSnapshot = {
    ...snapshot,
    version: 1,
    exportedAt: new Date().toISOString(),
  }
  localStorage.setItem(scopedKey(PERSISTENCE_KEY, scope), JSON.stringify(full))
}

export function parseImportFile(text: string): AppDataSnapshot | null {
  try {
    const o = JSON.parse(text) as AppDataSnapshot
    if (o.version !== 1 || !Array.isArray(o.contacts)) return null
    return o
  } catch {
    return null
  }
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function onboardingDone(scope?: string): boolean {
  if (typeof localStorage === "undefined") return true
  return localStorage.getItem(scopedKey(ONBOARDING_KEY, scope)) === "done"
}

export function setOnboardingDone(scope?: string) {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(scopedKey(ONBOARDING_KEY, scope), "done")
}

/** 引导仅在「完全空数据」时展示：无联系人、无互动、无日记 */
export function isAppDataEmpty(
  contactCount: number,
  interactionLogCount: number,
  diaryEntryCount: number
): boolean {
  return contactCount === 0 && interactionLogCount === 0 && diaryEntryCount === 0
}
