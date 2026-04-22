"use client"

import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { ACCOUNT_DELETION_CONFIRM_PHRASE } from "@/lib/account-constants"
import {
  applyFontScale,
  applyTheme,
  getStoredDataOptimize,
  getStoredFontScale,
  getStoredLang,
  getStoredTheme,
  type AppLang,
  setStoredDataOptimize,
  setStoredFontScale,
  setStoredLang,
  setStoredTheme,
  type ThemePreference,
} from "@/lib/app-preferences"
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
import { Dialog } from "../ui/dialog"
import { Input } from "../ui/input"

type MineSectionProps = {
  storageScope: string
  buildExportSnapshot: () => Omit<AppDataSnapshot, "version" | "exportedAt">
  onRestoreSnapshot: (snapshot: AppDataSnapshot) => void
  onLockSettingsChange: (settings: LockSettings | null) => void
  lockEnabled: boolean
  lockSettings: LockSettings | null
  localRecordCount: number
  onExportComplete?: () => void
}

function ExpandRow({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string
  subtitle?: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <Card className="p-ds-md">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={onToggle}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="text-ds-body font-semibold text-ink dark:text-stone-100">{title}</div>
          {subtitle ? <p className="mt-0.5 text-ds-caption text-soft dark:text-stone-400">{subtitle}</p> : null}
        </div>
        <ChevronDown
          className={`mt-0.5 h-5 w-5 shrink-0 text-soft transition-transform dark:text-stone-400 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? <div className="mt-ds-md border-t border-warm-base pt-ds-md dark:border-stone-700">{children}</div> : null}
    </Card>
  )
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
  const router = useRouter()
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

  const [openAccount, setOpenAccount] = useState(false)
  const [openData, setOpenData] = useState(false)
  const [openLegal, setOpenLegal] = useState(false)
  const [openHelp, setOpenHelp] = useState(false)
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false)

  const [theme, setTheme] = useState<ThemePreference>("system")
  const [fontScale, setFontScale] = useState(1)
  const [lang, setLang] = useState<AppLang>("zh-CN")
  const [dataOptimize, setDataOptimize] = useState(false)

  const [profile, setProfile] = useState<{ email: string | null; phone: string | null }>({
    email: null,
    phone: null,
  })

  useEffect(() => {
    setTheme(getStoredTheme())
    setFontScale(getStoredFontScale())
    setLang(getStoredLang())
    setDataOptimize(getStoredDataOptimize())
  }, [])

  useEffect(() => {
    if (!isLoggedIn) {
      setProfile({ email: null, phone: null })
      return
    }
    const supabase = getSupabaseBrowserClient()
    void supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      const meta = u?.user_metadata as Record<string, unknown> | undefined
      const phoneFromMeta =
        typeof meta?.phone === "string"
          ? meta.phone
          : typeof meta?.phone_number === "string"
            ? meta.phone_number
            : null
      setProfile({
        email: u?.email ?? null,
        phone: u?.phone ?? phoneFromMeta,
      })
    })
  }, [isLoggedIn])

  function showTip(message: string, ms = 2800) {
    setImportTip(message)
    setTimeout(() => setImportTip(""), ms)
  }

  async function handleLogout() {
    try {
      if (isBrowserSupabaseReady()) {
        const supabase = getSupabaseBrowserClient()
        await supabase.auth.signOut()
      }
    } catch {
      /* 忽略 */
    }
    clearPersistedAuth()
    router.replace("/login")
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

  function setThemeAndPersist(next: ThemePreference) {
    setTheme(next)
    setStoredTheme(next)
    applyTheme(next)
  }

  function setFontAndPersist(next: number) {
    setFontScale(next)
    setStoredFontScale(next)
    applyFontScale(next)
  }

  const isLocalMode = !isLoggedIn

  return (
    <section className="space-y-ds-md pb-ds-lg">
      <div>
        <h1 className="text-ds-title text-ink dark:text-stone-100">系统</h1>
        <p className="mt-1 text-ds-body text-soft dark:text-stone-400">账户、应用与关于</p>
      </div>

      <p className="text-ds-caption font-semibold tracking-wide text-soft dark:text-stone-500">账户</p>

      <ExpandRow
        title="账号管理"
        subtitle="云同步、登录设备与安全相关操作"
        open={openAccount}
        onToggle={() => setOpenAccount((o) => !o)}
      >
        {isLocalMode ? (
          <div className="space-y-ds-md">
            <div className="rounded-ds border border-[#d8c9b9] bg-[#fff8ee] p-ds-md dark:border-stone-600 dark:bg-stone-800/60">
              <p className="text-ds-body font-semibold text-ink dark:text-stone-100">本地模式</p>
              <p className="mt-1 text-ds-caption leading-relaxed text-soft dark:text-stone-300">
                注册登录不是必须的；仅在你需要多设备同步、云备份和 Pro 跨设备同步时再开启即可。
              </p>
              <div className="mt-ds-xs flex flex-wrap gap-2">
                <Link href="/register" className="inline-flex">
                  <Button type="button">开启云同步</Button>
                </Link>
                <Link href="/login" className="inline-flex">
                  <Button type="button" variant="outline">
                    我已有账号，去登录
                  </Button>
                </Link>
              </div>
              {shouldNudgeSyncByVolume ? (
                <p className="mt-ds-xs text-ds-caption font-medium text-[#7a5a2e] dark:text-amber-200/90">
                  你当前本地记录已超过 100 条，建议注册账号开启云备份与多设备同步，降低浏览器数据丢失风险。
                </p>
              ) : null}
              {!isLoggedIn && localProActive ? (
                <p className="mt-ds-xs text-ds-caption font-medium text-[#7a5a2e] dark:text-amber-200/90">
                  你已激活本地 Pro。注册账号后，可将 Pro 状态同步到所有登录设备。
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-ds-md">
            <div className="space-y-1 text-ds-body text-ink dark:text-stone-100">
              {profile.email ? (
                <p>
                  <span className="text-soft dark:text-stone-400">邮箱：</span>
                  {profile.email}
                </p>
              ) : null}
              {profile.phone ? (
                <p>
                  <span className="text-soft dark:text-stone-400">手机：</span>
                  {profile.phone}
                </p>
              ) : null}
              {!profile.email && !profile.phone ? (
                <p className="text-ds-caption text-soft">当前账户未展示邮箱或手机号（可能为第三方登录）。</p>
              ) : null}
            </div>
            <Button type="button" variant="outline" onClick={() => setDeviceDialogOpen(true)}>
              登录设备管理
            </Button>
            {isLoggedIn && isBrowserSupabaseReady() ? (
              <div className="rounded-ds border border-red-200/80 bg-red-50/80 p-ds-md dark:border-red-900/50 dark:bg-red-950/40">
                <p className="text-ds-caption font-medium text-red-900 dark:text-red-200">删除账号（不可恢复）</p>
                <p className="mt-1 text-ds-caption leading-relaxed text-red-800/90 dark:text-red-200/90">
                  提交后立即永久删除登录账户及数据库中与该账户关联的同步数据（与「清空云端」范围一致）。本机若仍有 JSON/CSV 导出文件，请自行处理。
                </p>
                <p className="mt-ds-xs text-ds-caption text-red-800/90 dark:text-red-200/90">
                  请输入「{ACCOUNT_DELETION_CONFIRM_PHRASE}」以确认：
                </p>
                <Input
                  className="mt-ds-xs max-w-sm dark:border-stone-600 dark:bg-stone-900"
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
          </div>
        )}
      </ExpandRow>

      <ExpandRow
        title="数据管理"
        subtitle="体验优化、备份恢复与数据控制权"
        open={openData}
        onToggle={() => setOpenData((o) => !o)}
      >
        <div className="space-y-ds-md">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-ds-body font-medium text-ink dark:text-stone-100">数据用于优化体验</p>
              <p className="mt-1 text-ds-caption leading-relaxed text-soft dark:text-stone-400">
                允许我们将你的对话内容用于优化晓观的使用体验。我们保障你的数据隐私安全；本地模式下默认关闭。
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={dataOptimize}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                dataOptimize ? "bg-[#8B5A42] dark:bg-amber-700" : "bg-warm-strong dark:bg-stone-600"
              }`}
              onClick={() => {
                const next = !dataOptimize
                setDataOptimize(next)
                setStoredDataOptimize(next)
              }}
            >
              <span
                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  dataOptimize ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="rounded-ds border border-[#2e7d32]/30 bg-[#f1f8f2] p-ds-md dark:border-emerald-900/40 dark:bg-emerald-950/30">
            <p className="text-ds-body font-semibold text-[#1b5e20] dark:text-emerald-300">宁可少一个花哨功能，也不牺牲你的安全感。</p>
            <p className="mt-2 text-ds-caption leading-relaxed text-[#1a2e22] dark:text-emerald-100/85">
              你在这里写下的内容，可能比银行密码更敏感。InnerMap 把隐私当作生死线：记录与账户绑定，经加密连接与托管云端同步，
              <strong className="font-medium text-[#1b5e20] dark:text-emerald-300">不向其他用户公开</strong>
              。你可随时导出 JSON/CSV 自备份，一键清理本机或云端数据；注销账号后相关数据将立即永久删除。更细的说明见信任中心。
            </p>
            <div className="mt-ds-xs flex flex-wrap gap-2">
              <Link
                href="/privacy-hub"
                className="inline-flex h-11 min-h-11 items-center justify-center rounded-btn-ds border border-[#2e7d32]/45 bg-white px-4 text-sm font-medium text-[#1b5e20] shadow-sm transition-colors hover:bg-[#e8f5e9] dark:border-emerald-700 dark:bg-stone-900 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
              >
                查看完整隐私承诺
              </Link>
              <Link
                href="/privacy"
                className="inline-flex h-11 min-h-11 items-center justify-center rounded-btn-ds border border-[#d8c9b9] bg-paper px-4 text-sm font-medium text-[#795548] transition-colors hover:bg-[#f3ece4] dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                阅读《隐私政策》
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-ds-body font-semibold text-ink dark:text-stone-100">数据备份与恢复</h3>
            <p className="mt-1 text-ds-caption text-soft dark:text-stone-400">
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
            {importTip ? <p className="mt-ds-xs text-ds-caption text-[#7a5a2e] dark:text-amber-200/90">{importTip}</p> : null}
            <p className="mt-ds-xs text-[11px] leading-relaxed text-soft dark:text-stone-500">
              开发调试：在控制台执行 <code className="rounded bg-surface-warm-soft px-1 dark:bg-stone-800">localStorage.setItem(&quot;pss-subscription&quot;,&quot;pro&quot;)</code>{" "}
              并刷新，可解除免费版 20 人上限。
            </p>
          </div>

          <div>
            <h3 className="text-ds-body font-semibold text-ink dark:text-stone-100">数据控制权</h3>
            <p className="mt-1 text-ds-caption text-soft dark:text-stone-400">
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
              <p className="mt-ds-xs text-ds-caption text-soft dark:text-stone-500">登录后可清空与您账户绑定的云端数据或注销账号。</p>
            ) : !isBrowserSupabaseReady() ? (
              <p className="mt-ds-xs text-ds-caption text-soft dark:text-stone-500">当前未连接 Supabase，云端相关按钮不可用。</p>
            ) : null}
          </div>
        </div>
      </ExpandRow>

      <p className="pt-ds-xs text-ds-caption font-semibold tracking-wide text-soft dark:text-stone-500">应用</p>

      <Card className="space-y-ds-md p-ds-md">
        <div>
          <p className="text-ds-body font-semibold text-ink dark:text-stone-100">语言</p>
          <p className="mt-0.5 text-ds-caption text-soft dark:text-stone-400">界面语言（更多语言将陆续支持）</p>
          <select
            className="mt-ds-xs w-full max-w-xs rounded-btn-ds border border-land-input-border bg-paper px-3 py-2 text-ds-body text-ink dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            value={lang}
            onChange={(e) => {
              const v = e.target.value as AppLang
              setLang(v)
              setStoredLang(v)
            }}
          >
            <option value="zh-CN">简体中文</option>
          </select>
        </div>

        <div>
          <p className="text-ds-body font-semibold text-ink dark:text-stone-100">外观</p>
          <div className="mt-ds-xs flex flex-wrap gap-2">
            {(
              [
                { key: "system" as const, label: "系统" },
                { key: "light" as const, label: "浅色" },
                { key: "dark" as const, label: "深色" },
              ] as const
            ).map(({ key, label }) => (
              <Button
                key={key}
                type="button"
                variant={theme === key ? "default" : "outline"}
                size="sm"
                onClick={() => setThemeAndPersist(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-ds-body font-semibold text-ink dark:text-stone-100">字号</p>
            <span className="text-ds-caption text-soft dark:text-stone-400">{Math.round(fontScale * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.85}
            max={1.35}
            step={0.05}
            value={fontScale}
            className="mt-ds-xs w-full max-w-md accent-[#8B5A42] dark:accent-amber-600"
            onChange={(e) => setFontAndPersist(parseFloat(e.target.value))}
          />
          <p className="mt-1 text-ds-caption text-soft dark:text-stone-500">从小到大拖动；仅影响正文字号比例。</p>
        </div>
      </Card>

      <Card className="p-ds-md">
        <h3 className="text-ds-body font-semibold text-ink dark:text-stone-100">应用锁（密码 / WebAuthn）</h3>
        <p className="mt-1 text-ds-caption text-soft dark:text-stone-400">
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
              <p className="text-ds-caption text-energy-positive dark:text-emerald-400">已绑定 WebAuthn 凭证</p>
            ) : null}
            <Button type="button" variant="danger" onClick={handleDisableLock}>
              关闭应用锁
            </Button>
          </div>
        ) : (
          <div className="mt-ds-xs space-y-ds-xs">
            <Input
              type="password"
              placeholder="设置密码（至少 4 位）"
              value={pinA}
              onChange={(e) => setPinA(e.target.value)}
              className="dark:border-stone-600 dark:bg-stone-900"
            />
            <Input
              type="password"
              placeholder="再次输入"
              value={pinB}
              onChange={(e) => setPinB(e.target.value)}
              className="dark:border-stone-600 dark:bg-stone-900"
            />
            <Button type="button" disabled={lockBusy} onClick={() => void handleEnableLock()}>
              开启密码锁
            </Button>
            {isWebAuthnAvailable() ? (
              <Button type="button" variant="outline" disabled={lockBusy} onClick={() => void handleWebAuthnOnlyLock()}>
                不设密码，仅用指纹/系统密钥锁定
              </Button>
            ) : (
              <p className="text-ds-caption text-soft dark:text-stone-500">当前环境不支持 WebAuthn，请使用密码锁。</p>
            )}
          </div>
        )}
      </Card>

      <p className="pt-ds-xs text-ds-caption font-semibold tracking-wide text-soft dark:text-stone-500">关于</p>

      <ExpandRow
        title="服务协议"
        subtitle="法律与透明度文档"
        open={openLegal}
        onToggle={() => setOpenLegal((o) => !o)}
      >
        <ul className="space-y-2 text-ds-body">
          <li>
            <Link href="/terms" className="font-medium text-[#8B5A42] underline-offset-2 hover:underline dark:text-amber-500">
              用户协议（使用条款）
            </Link>
          </li>
          <li>
            <Link href="/privacy" className="font-medium text-[#8B5A42] underline-offset-2 hover:underline dark:text-amber-500">
              隐私政策
            </Link>
          </li>
          <li>
            <Link
              href="/legal/third-party-sharing"
              className="font-medium text-[#8B5A42] underline-offset-2 hover:underline dark:text-amber-500"
            >
              第三方信息共享清单
            </Link>
          </li>
          <li>
            <Link
              href="/legal/personal-info"
              className="font-medium text-[#8B5A42] underline-offset-2 hover:underline dark:text-amber-500"
            >
              个人信息收集清单
            </Link>
          </li>
          <li>
            <Link
              href="/legal/app-permissions"
              className="font-medium text-[#8B5A42] underline-offset-2 hover:underline dark:text-amber-500"
            >
              应用权限
            </Link>
          </li>
          <li>
            <Link
              href="/legal/usage-policy"
              className="font-medium text-[#8B5A42] underline-offset-2 hover:underline dark:text-amber-500"
            >
              使用政策
            </Link>
          </li>
        </ul>
      </ExpandRow>

      <ExpandRow
        title="帮助与反馈"
        subtitle="告诉我们你的想法，帮助晓观变得更好"
        open={openHelp}
        onToggle={() => setOpenHelp((o) => !o)}
      >
        <p className="text-ds-caption leading-relaxed text-soft dark:text-stone-400">
          我们重视你的建议与体验反馈。若你在使用中遇到困惑、有功能想法或希望优化某处流程，欢迎通过邮件联系我们；后续版本也将逐步提供应用内反馈入口。
        </p>
        <a
          href="mailto:support@innermap.app?subject=%E6%99%93%E8%A7%82%E5%8F%8D%E9%A6%88"
          className="mt-ds-xs inline-flex min-h-11 items-center justify-center rounded-btn-ds border border-[#d8c9b9] bg-paper px-4 text-ds-body font-medium text-ink transition-colors hover:bg-[#f3ece4] dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
        >
          发送邮件反馈
        </a>
      </ExpandRow>

      <div className="pt-ds-md">
        {isLoggedIn ? (
          <Button type="button" variant="danger" className="w-full" onClick={() => void handleLogout()}>
            退出登录
          </Button>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/login" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                登录
              </Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button type="button" className="w-full">
                注册
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Dialog
        open={deviceDialogOpen}
        title="登录设备管理"
        description="各浏览器与设备会单独建立会话。若你怀疑他人使用你的账号，可修改密码并重新登录；更细说明见信任中心。"
        onClose={() => setDeviceDialogOpen(false)}
      >
        <p className="text-ds-caption leading-relaxed text-soft dark:text-stone-400">
          当前版本暂未提供逐设备下线列表；后续将随账户安全能力升级补充。你可前往{" "}
          <Link href="/privacy-hub" className="font-medium text-ink underline-offset-2 hover:underline dark:text-stone-200">
            信任中心
          </Link>{" "}
          了解数据与账号相关说明。
        </p>
        <Button type="button" className="mt-ds-md w-full sm:w-auto" onClick={() => setDeviceDialogOpen(false)}>
          知道了
        </Button>
      </Dialog>
    </section>
  )
}
