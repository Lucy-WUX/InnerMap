"use client"

import Link from "next/link"
import { useMemo, useRef, useState } from "react"

import { ACCOUNT_DELETION_CONFIRM_PHRASE } from "@/lib/account-constants"
import { clearPersistedAuth, useAuthStore } from "@/lib/stores/auth-store"
import { getSupabaseBrowserClient, isBrowserSupabaseReady } from "@/lib/supabase-browser"

import type { AppDataSnapshot, LockSettings } from "../../lib/app-local-storage"
import {
  buildExportCsv,
  clearAllScopedLocalData,
  createLockFromPin,
  createLockWebAuthnOnly,
  downloadCsv,
  downloadJson,
  lockHasWebAuthn,
  recordBackupExportComplete,
  setSessionUnlocked,
} from "../../lib/app-local-storage"
import { registerWebAuthnCredential, isWebAuthnAvailable } from "../../lib/webauthn-lock"
import { isLocalProActiveNow } from "../../lib/local-pro-license"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Input } from "../ui/input"

type MineSectionProps = {
  storageScope: string
  buildExportSnapshot: () => Omit<AppDataSnapshot, "version" | "exportedAt">
  onRestoreSnapshot: (snapshot: AppDataSnapshot) => void
  onLockSettingsChange: (settings: LockSettings | null) => void
  lockEnabled: boolean
  lockSettings: LockSettings | null
  localRecordCount: number
  /** 在「我的」成功导出 JSON/CSV 后调用（用于刷新顶栏备份提醒等） */
  onExportComplete?: () => void
}

export function MineSection({
  storageScope,
  buildExportSnapshot,
  onRestoreSnapshot,
  onLockSettingsChange,
  lockEnabled,
  lockSettings,
  localRecordCount,
  onExportComplete,
}: MineSectionProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const accessToken = useAuthStore((s) => s.accessToken)
  const authUserId = useAuthStore((s) => s.userId)
  const isLoggedIn = Boolean(accessToken && authUserId)

  const [importTip, setImportTip] = useState("")
  const [pinA, setPinA] = useState("")
  const [pinB, setPinB] = useState("")
  const [lockBusy, setLockBusy] = useState(false)
  const [dataActionBusy, setDataActionBusy] = useState(false)
  const [accountDeleteConfirm, setAccountDeleteConfirm] = useState("")
  const localProActive = useMemo(() => isLocalProActiveNow(), [])
  const shouldNudgeSyncByVolume = !isLoggedIn && localRecordCount >= 100

  function showTip(message: string, ms = 2800) {
    setImportTip(message)
    setTimeout(() => setImportTip(""), ms)
  }

  function handleExport() {
    const core = buildExportSnapshot()
    const payload: AppDataSnapshot = {
      ...core,
      version: 1,
      exportedAt: new Date().toISOString(),
    }
    downloadJson(`观系备份-${new Date().toISOString().slice(0, 10)}.json`, payload)
    recordBackupExportComplete()
    onExportComplete?.()
  }

  function handleExportCsv() {
    const core = buildExportSnapshot()
    const csv = buildExportCsv(core)
    downloadCsv(`观系备份-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    recordBackupExportComplete()
    onExportComplete?.()
  }

  function handleClearLocalData() {
    const ok = window.confirm(
      "将删除本设备上当前用户名下的本地数据（联系人、互动、日记、评分历史、草稿、引导与应用锁设置等）。登录状态会保留。此操作无法撤销，是否继续？",
    )
    if (!ok) return
    setSessionUnlocked(true, storageScope)
    onLockSettingsChange(null)
    clearAllScopedLocalData(storageScope)
    showTip("已清除本地数据，即将刷新…", 4000)
    window.setTimeout(() => window.location.reload(), 400)
  }

  async function handleClearCloudData() {
    if (!isLoggedIn || !accessToken) {
      showTip("请先登录后再清空云端数据。")
      return
    }
    if (!isBrowserSupabaseReady()) {
      showTip("当前环境未配置云端同步，无需清空。")
      return
    }
    const ok = window.confirm(
      "将永久删除服务器上与当前账户关联的同步数据（日记条目、关系记录、AI 用量统计）。不会影响您已下载到本机的 JSON/CSV 备份。此操作无法撤销，是否继续？",
    )
    if (!ok) return
    setDataActionBusy(true)
    try {
      const res = await fetch("/api/account/delete-cloud-data", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        showTip(body.error ?? "云端清理失败", 4000)
        return
      }
      showTip("云端数据已清空。")
    } finally {
      setDataActionBusy(false)
    }
  }

  async function handleDeleteAccount() {
    if (!isLoggedIn || !accessToken || !authUserId) {
      showTip("请先登录后再注销账号。")
      return
    }
    if (accountDeleteConfirm.trim() !== ACCOUNT_DELETION_CONFIRM_PHRASE) {
      showTip(`请在输入框中完整填写「${ACCOUNT_DELETION_CONFIRM_PHRASE}」。`)
      return
    }
    const ok = window.confirm(
      "最后确认：注销后您的账户将被立即永久删除，云端关联数据一并清除，且无法恢复。是否继续？",
    )
    if (!ok) return
    setDataActionBusy(true)
    try {
      const res = await fetch("/api/account/delete-account", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmText: accountDeleteConfirm.trim() }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        showTip(body.error ?? "注销失败", 5000)
        return
      }
      const scope = authUserId
      clearAllScopedLocalData(scope)
      clearPersistedAuth()
      try {
        const supabase = getSupabaseBrowserClient()
        await supabase.auth.signOut()
      } catch {
        /* 配置异常时仍跳转登录 */
      }
      window.location.href = "/login"
    } finally {
      setDataActionBusy(false)
    }
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
      setSessionUnlocked(true, storageScope)
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
    setSessionUnlocked(true, storageScope)
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
      setSessionUnlocked(true, storageScope)
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
        setSessionUnlocked(true, storageScope)
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
      <Card className="rounded-ds border border-[#d8c9b9] bg-[#fff8ee] p-ds-lg">
        <h3 className="text-ds-body font-semibold text-ink">云同步与账号（可选）</h3>
        <p className="mt-1 text-ds-caption leading-relaxed text-soft">
          注册登录不是必须的；仅在你需要多设备同步、云备份和 Pro 跨设备同步时再开启即可。
        </p>
        <div className="mt-ds-xs flex flex-wrap gap-2">
          {isLoggedIn ? (
            <Button type="button" variant="outline" disabled>
              已开启云同步
            </Button>
          ) : (
            <Link href="/register" className="inline-flex">
              <Button type="button">开启云同步</Button>
            </Link>
          )}
          {!isLoggedIn ? (
            <Link href="/login" className="inline-flex">
              <Button type="button" variant="outline">
                我已有账号，去登录
              </Button>
            </Link>
          ) : null}
        </div>
        {shouldNudgeSyncByVolume ? (
          <p className="mt-ds-xs text-ds-caption font-medium text-[#7a5a2e]">
            你当前本地记录已超过 100 条，建议注册账号开启云备份与多设备同步，降低浏览器数据丢失风险。
          </p>
        ) : null}
        {!isLoggedIn && localProActive ? (
          <p className="mt-ds-xs text-ds-caption font-medium text-[#7a5a2e]">
            你已激活本地 Pro。注册账号后，可将 Pro 状态同步到所有登录设备。
          </p>
        ) : null}
      </Card>
      <Card className="rounded-ds border border-[#2e7d32]/30 bg-[#f1f8f2] p-ds-lg">
        <h3 className="text-ds-body font-semibold text-[#1b5e20]">隐私与信任</h3>
        <p className="mt-2 text-ds-body font-semibold leading-relaxed text-[#1b5e20]">
          宁可少一个花哨功能，也不牺牲你的安全感。
        </p>
        <p className="mt-ds-xs text-ds-caption leading-relaxed text-[#1a2e22]">
          你在这里写下的内容，可能比银行密码更敏感。InnerMap 把隐私当作生死线：记录与账户绑定，经加密连接与托管云端同步，
          <strong className="font-medium text-[#1b5e20]">不向其他用户公开</strong>
          。你可随时导出 JSON/CSV 自备份，一键清理本机或云端数据；注销账号后相关数据将立即永久删除。更细的说明见信任中心。
        </p>
        <div className="mt-ds-xs flex flex-wrap gap-2">
          <Link
            href="/privacy-hub"
            className="inline-flex h-11 min-h-11 items-center justify-center rounded-btn-ds border border-[#2e7d32]/45 bg-white px-4 text-sm font-medium text-[#1b5e20] shadow-sm transition-colors hover:bg-[#e8f5e9]"
          >
            查看完整隐私承诺
          </Link>
          <Link
            href="/privacy"
            className="inline-flex h-11 min-h-11 items-center justify-center rounded-btn-ds border border-[#d8c9b9] bg-paper px-4 text-sm font-medium text-[#795548] transition-colors hover:bg-[#f3ece4]"
          >
            阅读《隐私政策》
          </Link>
        </div>
      </Card>
      <Card className="rounded-ds border border-warm-base p-ds-lg">
        <h3 className="text-ds-body font-semibold text-ink">数据备份与恢复</h3>
        <p className="mt-1 text-ds-caption text-soft">
          将所有联系人、互动记录、日记与评分历史导出为 JSON 或 CSV；换机或重装后可导入 JSON 还原。
        </p>
        <div className="mt-ds-xs flex flex-wrap gap-2">
          <Button type="button" onClick={handleExport}>
            导出全部数据 (JSON)
          </Button>
          <Button type="button" variant="outline" onClick={handleExportCsv}>
            导出全部数据 (CSV)
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
        <h3 className="text-ds-body font-semibold text-ink">数据控制权</h3>
        <p className="mt-1 text-ds-caption text-soft">
          由你决定数据留在本机、同步云端或彻底删除。清除本地仅影响此浏览器；清空云端与注销账号需登录，且依赖服务端配置 Service Role。
        </p>
        <div className="mt-ds-xs flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={dataActionBusy} onClick={handleClearLocalData}>
            清除本设备全部本地数据
          </Button>
          {isLoggedIn ? (
            <Button
              type="button"
              variant="outline"
              disabled={dataActionBusy || !isBrowserSupabaseReady()}
              onClick={() => void handleClearCloudData()}
            >
              清空云端同步数据
            </Button>
          ) : null}
        </div>
        {!isLoggedIn ? (
          <p className="mt-ds-xs text-ds-caption text-soft">登录后可清空与您账户绑定的云端数据或注销账号。</p>
        ) : !isBrowserSupabaseReady() ? (
          <p className="mt-ds-xs text-ds-caption text-soft">当前未连接 Supabase，云端相关按钮不可用。</p>
        ) : null}
        {isLoggedIn && isBrowserSupabaseReady() ? (
          <div className="mt-ds-md rounded-ds border border-red-200/80 bg-red-50/80 p-ds-md">
            <p className="text-ds-caption font-medium text-red-900">注销账号（不可恢复）</p>
            <p className="mt-1 text-ds-caption leading-relaxed text-red-800/90">
              提交后立即永久删除登录账户及数据库中与该账户关联的同步数据（与「清空云端」范围一致）。本机若仍有 JSON/CSV 导出文件，请自行处理。
            </p>
            <p className="mt-ds-xs text-ds-caption text-red-800/90">
              请输入「{ACCOUNT_DELETION_CONFIRM_PHRASE}」以确认：
            </p>
            <Input
              className="mt-ds-xs max-w-sm"
              value={accountDeleteConfirm}
              onChange={(e) => setAccountDeleteConfirm(e.target.value)}
              placeholder={ACCOUNT_DELETION_CONFIRM_PHRASE}
              autoComplete="off"
            />
            <Button
              type="button"
              className="mt-ds-xs"
              variant="danger"
              disabled={dataActionBusy}
              onClick={() => void handleDeleteAccount()}
            >
              永久注销账号
            </Button>
          </div>
        ) : null}
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
              <p className="text-ds-caption text-energy-positive">已绑定 WebAuthn 凭证</p>
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
    </section>
  )
}
