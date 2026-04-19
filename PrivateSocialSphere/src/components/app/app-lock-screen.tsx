"use client"

import { useState } from "react"

import type { LockSettings } from "../../lib/app-local-storage"
import { lockHasPassword, lockHasWebAuthn, setSessionUnlocked, verifyPin } from "../../lib/app-local-storage"
import { authenticateWebAuthn, isWebAuthnAvailable } from "../../lib/webauthn-lock"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

type AppLockScreenProps = {
  settings: LockSettings
  onUnlocked: () => void
}

export function AppLockScreen({ settings, onUnlocked }: AppLockScreenProps) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const hasPwd = lockHasPassword(settings)
  const hasW = lockHasWebAuthn(settings)
  const webUsable = isWebAuthnAvailable() && hasW

  async function submitPassword() {
    if (!hasPwd) return
    setError("")
    setBusy(true)
    try {
      const ok = await verifyPin(settings, pin)
      if (!ok) {
        setError("密码不正确")
        return
      }
      setSessionUnlocked(true)
      onUnlocked()
    } finally {
      setBusy(false)
    }
  }

  async function submitWebAuthn() {
    if (!settings.webauthnCredentialId) return
    setError("")
    setBusy(true)
    try {
      const ok = await authenticateWebAuthn(settings.webauthnCredentialId)
      if (!ok) {
        setError("验证失败或已取消")
        return
      }
      setSessionUnlocked(true)
      onUnlocked()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f172a] px-ds-md text-white">
      <div className="w-full max-w-sm rounded-ds border border-white/10 bg-white/5 p-ds-lg backdrop-blur-md">
        <p className="text-center text-2xl">🔒</p>
        <h1 className="mt-ds-xs text-center text-ds-title text-white">观系已锁定</h1>
        <p className="mt-1 text-center text-ds-caption text-white/70">
          {hasW && hasPwd
            ? "可使用系统指纹 / 面容 / 安全密钥，或输入密码解锁。"
            : hasW
              ? "使用本机已绑定的指纹、面容或系统 PIN（WebAuthn）解锁。"
              : "输入密码以继续。"}
        </p>

        {webUsable ? (
          <>
            <Button
              className="mt-ds-md w-full bg-[#0f766e] text-white hover:bg-[#0d5f58]"
              disabled={busy}
              onClick={() => void submitWebAuthn()}
            >
              {busy ? "验证中…" : "🔐 指纹 / 面容 / 系统验证"}
            </Button>
            {error && !hasPwd ? <p className="mt-ds-xs text-center text-ds-caption text-red-300">{error}</p> : null}
          </>
        ) : hasW && !isWebAuthnAvailable() ? (
          <p className="mt-ds-md text-center text-ds-caption text-amber-200/90">当前环境不支持 WebAuthn，请改用密码。</p>
        ) : null}

        {hasPwd ? (
          <>
            {hasW ? <p className="mt-ds-md text-center text-ds-caption text-white/50">或使用密码</p> : null}
            <Input
              type="password"
              autoComplete="current-password"
              className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-white/40"
              placeholder="密码"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submitPassword()}
            />
            {error ? <p className="mt-ds-xs text-ds-caption text-red-300">{error}</p> : null}
            <Button
              className="mt-ds-md w-full bg-[#c4a574] text-[#2d1f0f] hover:bg-[#b89564]"
              disabled={busy || !pin}
              onClick={() => void submitPassword()}
            >
              {busy ? "验证中…" : "密码解锁"}
            </Button>
          </>
        ) : !hasW && !hasPwd ? (
          <p className="mt-ds-md text-center text-ds-caption text-red-200">未配置有效解锁方式，请在「我的」关闭锁或重新绑定。</p>
        ) : null}
      </div>
    </div>
  )
}
