"use client"

import { useRef, useState } from "react"

import type { AppDataSnapshot, LockSettings } from "../../lib/app-local-storage"
import {
  createLockFromPin,
  createLockWebAuthnOnly,
  downloadJson,
  lockHasWebAuthn,
  setSessionUnlocked,
} from "../../lib/app-local-storage"
import { registerWebAuthnCredential, isWebAuthnAvailable } from "../../lib/webauthn-lock"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Input } from "../ui/input"

type MineSectionProps = {
  openAiPage: (seedText?: string) => void
  buildExportSnapshot: () => Omit<AppDataSnapshot, "version" | "exportedAt">
  onRestoreSnapshot: (snapshot: AppDataSnapshot) => void
  onLockSettingsChange: (settings: LockSettings | null) => void
  lockEnabled: boolean
  lockSettings: LockSettings | null
}

export function MineSection({
  openAiPage,
  buildExportSnapshot,
  onRestoreSnapshot,
  onLockSettingsChange,
  lockEnabled,
  lockSettings,
}: MineSectionProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importTip, setImportTip] = useState("")
  const [pinA, setPinA] = useState("")
  const [pinB, setPinB] = useState("")
  const [lockBusy, setLockBusy] = useState(false)
  function handleExport() {
    const core = buildExportSnapshot()
    const payload: AppDataSnapshot = {
      ...core,
      version: 1,
      exportedAt: new Date().toISOString(),
    }
    downloadJson(`观系备份-${new Date().toISOString().slice(0, 10)}.json`, payload)
  }

  async function handleEnableLock() {
    if (pinA.length < 4) {
      setImportTip("密码至少 4 位")
      setTimeout(() => setImportTip(""), 2000)
      return
    }
    if (pinA !== pinB) {
      setImportTip("两次密码不一致")
      setTimeout(() => setImportTip(""), 2000)
      return
    }
    setLockBusy(true)
    try {
      const settings = await createLockFromPin(pinA)
      setSessionUnlocked(true)
      onLockSettingsChange(settings)
      setPinA("")
      setPinB("")
      setImportTip("已开启应用锁")
      setTimeout(() => setImportTip(""), 2000)
    } finally {
      setLockBusy(false)
    }
  }

  function handleDisableLock() {
    setSessionUnlocked(true)
    onLockSettingsChange(null)
    setImportTip("已关闭应用锁")
    setTimeout(() => setImportTip(""), 2000)
  }

  async function handleWebAuthnOnlyLock() {
    if (!isWebAuthnAvailable()) {
      setImportTip("当前浏览器不支持 WebAuthn")
      setTimeout(() => setImportTip(""), 2500)
      return
    }
    setLockBusy(true)
    try {
      const id = await registerWebAuthnCredential()
      if (!id) {
        setImportTip("未创建凭证（已取消或不支持）")
        setTimeout(() => setImportTip(""), 2500)
        return
      }
      setSessionUnlocked(true)
      onLockSettingsChange(createLockWebAuthnOnly(id))
      setImportTip("已开启：仅指纹/系统密钥解锁")
      setTimeout(() => setImportTip(""), 2500)
    } finally {
      setLockBusy(false)
    }
  }

  async function handleBindWebAuthn() {
    if (!isWebAuthnAvailable()) {
      setImportTip("当前浏览器不支持 WebAuthn")
      setTimeout(() => setImportTip(""), 2500)
      return
    }
    setLockBusy(true)
    try {
      const id = await registerWebAuthnCredential()
      if (!id) {
        setImportTip("绑定失败或已取消")
        setTimeout(() => setImportTip(""), 2500)
        return
      }
      if (lockSettings) {
        onLockSettingsChange({ ...lockSettings, webauthnCredentialId: id })
        setImportTip("已绑定指纹/系统密钥，可与密码任选其一解锁")
      } else {
        setSessionUnlocked(true)
        onLockSettingsChange(createLockWebAuthnOnly(id))
        setImportTip("已开启：仅指纹/系统密钥解锁")
      }
      setTimeout(() => setImportTip(""), 2800)
    } finally {
      setLockBusy(false)
    }
  }

  return (
    <section className="space-y-ds-md pb-ds-md">
      <Card className="rounded-ds border border-warm-base p-ds-lg">
        <h2 className="text-ds-title">我的</h2>
        <p className="mt-1 text-ds-body text-soft">数据、安全与备份</p>
      </Card>
      <Card className="rounded-ds border border-warm-base p-ds-lg">
        <h3 className="text-ds-body font-semibold text-ink">数据备份与恢复</h3>
        <p className="mt-1 text-ds-caption text-soft">
          将所有联系人、互动记录、日记与评分历史导出为 JSON；换机或重装后可导入还原。
        </p>
        <div className="mt-ds-xs flex flex-wrap gap-2">
          <Button type="button" onClick={handleExport}>
            导出全部数据 (JSON)
          </Button>
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
            从文件恢复
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ""
              if (!f) return
              const reader = new FileReader()
              reader.onload = () => {
                try {
                  const text = String(reader.result ?? "")
                  const o = JSON.parse(text) as AppDataSnapshot
                  if (o.version !== 1 || !Array.isArray(o.contacts)) {
                    setImportTip("文件格式不正确")
                    return
                  }
                  onRestoreSnapshot(o)
                  setImportTip("已恢复数据")
                } catch {
                  setImportTip("无法读取文件")
                }
                setTimeout(() => setImportTip(""), 2200)
              }
              reader.readAsText(f, "utf-8")
            }}
          />
        </div>
        {importTip ? <p className="mt-ds-xs text-ds-caption text-[#7a5a2e]">{importTip}</p> : null}
        <p className="mt-ds-xs text-[11px] leading-relaxed text-soft">
          开发调试：在控制台执行 <code className="rounded bg-surface-warm-soft px-1">localStorage.setItem(&quot;pss-subscription&quot;,&quot;pro&quot;)</code>{" "}
          并刷新，可解除免费版 20 人上限。
        </p>
      </Card>
      <Card className="rounded-ds border border-warm-base p-ds-lg">
        <h3 className="text-ds-body font-semibold text-ink">应用锁（密码 / WebAuthn）</h3>
        <p className="mt-1 text-ds-caption text-soft">
          每次打开观系需验证。可使用密码，或使用本机指纹、面容、系统 PIN（Web 标准 WebAuthn，密钥保存在系统安全芯片/浏览器中）。
        </p>
        {lockEnabled ? (
          <div className="mt-ds-xs space-y-ds-xs">
            {lockSettings && !lockHasWebAuthn(lockSettings) && isWebAuthnAvailable() ? (
              <Button type="button" variant="outline" disabled={lockBusy} onClick={() => void handleBindWebAuthn()}>
                绑定指纹 / 系统密钥（可与密码二选一解锁）
              </Button>
            ) : null}
            {lockSettings && lockHasWebAuthn(lockSettings) ? (
              <p className="text-ds-caption text-[#0f766e]">已绑定 WebAuthn 凭证</p>
            ) : null}
            <Button type="button" variant="danger" onClick={handleDisableLock}>
              关闭应用锁
            </Button>
          </div>
        ) : (
          <div className="mt-ds-xs space-y-ds-xs">
            <Input type="password" placeholder="设置密码（至少 4 位）" value={pinA} onChange={(e) => setPinA(e.target.value)} />
            <Input type="password" placeholder="再次输入" value={pinB} onChange={(e) => setPinB(e.target.value)} />
            <Button type="button" disabled={lockBusy} onClick={() => void handleEnableLock()}>
              开启密码锁
            </Button>
            {isWebAuthnAvailable() ? (
              <Button type="button" variant="outline" disabled={lockBusy} onClick={() => void handleWebAuthnOnlyLock()}>
                不设密码，仅用指纹/系统密钥锁定
              </Button>
            ) : (
              <p className="text-ds-caption text-soft">当前环境不支持 WebAuthn，请使用密码锁。</p>
            )}
          </div>
        )}
      </Card>
      <Card className="rounded-ds border border-warm-base p-ds-lg">
        <p className="text-ds-body">本周关系维护完成度：72%</p>
        <p className="mt-1 text-ds-body">AI 使用次数：演示数据</p>
        <Button className="mt-ds-xs" onClick={() => openAiPage("总结我这周的人际模式并给出下周建议")}>
          打开 AI 分析页
        </Button>
      </Card>
    </section>
  )
}
