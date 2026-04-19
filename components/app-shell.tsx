"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import { getSupabaseBrowserClient, isBrowserSupabaseReady } from "@/lib/supabase-browser"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [envError, setEnvError] = useState("")
  const [envHint, setEnvHint] = useState("")
  const [showProModal, setShowProModal] = useState(false)
  const [copiedEnv, setCopiedEnv] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showProNudge, setShowProNudge] = useState(false)
  const [proPlan, setProPlan] = useState<"month" | "year" | "lifetime">("lifetime")

  async function copyEnvExample() {
    const envExample = [
      "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key",
      "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key",
      "AI_API_KEY=your-ai-api-key",
    ].join("\n")
    await navigator.clipboard.writeText(envExample)
    setCopiedEnv(true)
    setTimeout(() => setCopiedEnv(false), 1500)
  }

  async function refreshUsage(accessToken: string) {
    const response = await fetch("/api/ai/usage", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) return
    await response.json()
  }

  useEffect(() => {
    fetch("/api/env-check")
      .then((res) => res.json())
      .then((data: { ok?: boolean; message?: string }) => {
        if (!data.ok) setEnvHint(data.message || "")
      })
      .catch(() => undefined)

    if (!isBrowserSupabaseReady()) {
      // 演示模式：未配置 Supabase 时也允许进入应用，不强制登录。
      setEnvError("当前为演示模式：未连接 Supabase，登录与云端数据能力不可用。")
      setAuthed(true)
      return
    }

    // 客户端校验会话，未登录则跳转到登录页
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(Boolean(data.session))
      const accessToken = data.session?.access_token ?? null
      setToken(accessToken)
      if (accessToken) {
        void refreshUsage(accessToken)
      }
      if (!data.session && pathname !== "/login") router.replace("/login")
    })
  }, [pathname, router])

  useEffect(() => {
    if (!token) return
    const timer = setInterval(() => {
      void refreshUsage(token)
    }, 15000)
    return () => clearInterval(timer)
  }, [token])

  function closeProModalWithNudge() {
    setShowProModal(false)
    setShowProNudge(true)
    setTimeout(() => setShowProNudge(false), 2600)
  }

  useEffect(() => {
    const openPro = () => setShowProModal(true)
    window.addEventListener("open-pro-modal", openPro)
    return () => window.removeEventListener("open-pro-modal", openPro)
  }, [])

  if (pathname === "/login") return <>{children}</>
  if (!authed) return <div className="p-ds-lg text-ds-body text-soft">正在检查登录状态...</div>

  const tabParam = searchParams.get("tab")
  const onMainTabs = pathname === "/"
  const navHome = onMainTabs && tabParam !== "relations" && tabParam !== "mine"
  const navRelations = onMainTabs && tabParam === "relations"
  const navMine = onMainTabs && tabParam === "mine"

  return (
    <div className="min-h-screen bg-base text-ink">
      <header className="border-b border-warm-base bg-paper/90">
        <nav className="mx-auto flex max-w-5xl items-center gap-ds-xs px-ds-md py-ds-xs">
          <Link
            href="/"
            className={`rounded-btn-ds px-3 py-1.5 text-ds-body ${
              navHome ? "bg-[#eadfce] text-ink" : "text-soft hover:bg-[#f4ebdf]"
            }`}
          >
            首页
          </Link>
          <Link
            href="/?tab=relations"
            className={`rounded-btn-ds px-3 py-1.5 text-ds-body ${
              navRelations ? "bg-[#eadfce] text-ink" : "text-soft hover:bg-[#f4ebdf]"
            }`}
          >
            关系
          </Link>
          <Link
            href="/?tab=mine"
            className={`rounded-btn-ds px-3 py-1.5 text-ds-body ${
              navMine ? "bg-[#eadfce] text-ink" : "text-soft hover:bg-[#f4ebdf]"
            }`}
          >
            我的
          </Link>
          <div className="ml-auto" />
          <button
            className="mr-ds-xs rounded-btn-ds border border-[#b6905e] bg-[#fff3dc] px-3.5 py-1.5 text-ds-body font-semibold text-[#7a5a2e] shadow-[0_2px_6px_rgba(122,90,46,0.18)] hover:bg-[#ffeac8]"
            onClick={() => setShowProModal(true)}
          >
            👑 升级 Pro
          </button>
          <div className="relative">
            <button
              type="button"
              title="账户与登录"
              aria-label="账户与登录"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-warm-strong bg-paper text-ds-body font-semibold text-[#6d5433] hover:bg-[#f8f1e7]"
              onClick={() => setShowUserMenu((prev) => !prev)}
            >
              👤
            </button>
            {showUserMenu ? (
              <div className="absolute right-0 top-11 z-20 w-40 rounded-ds border border-warm-base bg-surface-warm-soft p-1.5 shadow-lg">
                <button className="w-full rounded-btn-ds px-3 py-2 text-left text-ds-body text-soft hover:bg-[#f8f1e7]">
                  账户设置
                </button>
                <button
                  className="w-full rounded-btn-ds px-3 py-2 text-left text-ds-body text-soft hover:bg-[#f8f1e7]"
                  onClick={() => {
                    setShowUserMenu(false)
                    setShowProModal(true)
                  }}
                >
                  订阅管理
                </button>
                <button
                  className="w-full rounded-btn-ds px-3 py-2 text-left text-ds-body text-soft hover:bg-[#f8f1e7]"
                  onClick={async () => {
                    setShowUserMenu(false)
                    if (!isBrowserSupabaseReady()) return
                    const supabase = getSupabaseBrowserClient()
                    await supabase.auth.signOut()
                    router.replace("/login")
                  }}
                >
                  退出登录
                </button>
              </div>
            ) : null}
          </div>
        </nav>
      </header>
      {envError || envHint || !token ? (
        <div className="mx-auto mt-ds-xs flex max-w-5xl flex-wrap items-center gap-ds-xs rounded-ds border border-[#f0d7ad] bg-[#fff8ea] px-3 py-2 text-ds-caption text-[#8d6a3f]">
          <span>⚠️ 演示模式：未连接 Supabase 与 AI 服务</span>
          <a
            className="underline underline-offset-2 hover:text-[#6f4f2e]"
            href="https://vercel.com/docs/environment-variables"
            target="_blank"
            rel="noreferrer"
          >
            查看部署指南
          </a>
          <button
            className="ml-auto rounded-btn-ds border border-[#e2cba4] bg-surface-warm-soft px-2.5 py-1 text-ds-caption hover:bg-[#fff4df]"
            onClick={() => void copyEnvExample()}
          >
            {copiedEnv ? "已复制" : "复制环境变量示例"}
          </button>
        </div>
      ) : null}
      <main className="mx-auto max-w-5xl p-ds-md md:p-ds-lg">{children}</main>
      {showProNudge ? (
        <div className="fixed right-4 top-16 z-50 rounded-ds border border-warm-base bg-surface-warm-elevated px-3 py-2 text-ds-caption text-soft shadow-md">
          👋 没关系，你的 7天免费试用权益仍在。右上角随时可以找到我。
        </div>
      ) : null}
      {showProModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-ds-md backdrop-blur-[8px]"
          onClick={() => setShowProModal(false)}
        >
          <div
            className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-ds border border-warm-base bg-paper p-ds-lg shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-warm-soft pb-ds-xs pt-1">
              <div>
                <h2 className="text-xl font-bold text-ink">Pro 版 · 更深的关系洞察</h2>
                <p className="mt-1 text-ds-body text-soft">默认推荐终身 Pro+，一次付费长期陪伴</p>
              </div>
              <button
                className="rounded-btn-ds border border-warm-strong px-2 py-1 text-ds-caption text-soft"
                onClick={closeProModalWithNudge}
              >
                关闭
              </button>
            </div>

            <div className="mb-ds-md flex items-center gap-2 rounded-ds border border-[#0f766e]/30 bg-[#ecfdf5] px-ds-md py-ds-sm text-ds-body text-[#0f5132]">
              <span className="text-lg" aria-hidden>
                ✨
              </span>
              <span>
                <strong>已有 127 位用户</strong> 选择终身 Pro+ · 真实社交证明，长期主义更安心
              </span>
            </div>

            <div className="mb-ds-md rounded-ds border border-dashed border-warm-strong bg-[#fffdf7] px-ds-md py-ds-sm text-ds-caption text-[#6d5433]">
              <strong className="text-ink">免费版</strong>：最多 <strong>20</strong> 位联系人 · 每日{" "}
              <strong>15</strong> 次 AI 问答 · 关系评分需<strong>手动</strong>更新 —— 足够完整体验核心价值后再升级。
            </div>

            <div className="mb-ds-md grid gap-ds-xs sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setProPlan("lifetime")}
                className={`rounded-ds border-2 p-ds-sm text-left transition ${
                  proPlan === "lifetime"
                    ? "border-[#0f766e] bg-[#ecfdf5] shadow-md ring-2 ring-[#0f766e]/20"
                    : "border-warm-base bg-paper hover:bg-[#fffdf7]"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#0f766e]">默认选中</p>
                <p className="mt-0.5 text-ds-body font-bold text-ink">终身 Pro+</p>
                <p className="text-ds-title text-[#0f766e]">¥499</p>
                <p className="text-[11px] text-soft">一次付费 · 永久权益</p>
              </button>
              <button
                type="button"
                onClick={() => setProPlan("year")}
                className={`rounded-ds border p-ds-sm text-left ${
                  proPlan === "year" ? "border-[#7a5a2e] bg-[#fff8ea]" : "border-warm-base bg-paper"
                }`}
              >
                <p className="text-ds-body font-semibold text-ink">Pro 年付</p>
                <p className="text-ds-title text-[#7a5a2e]">¥553</p>
                <p className="text-[11px] text-soft">约 ¥46/月 · 省 33%</p>
              </button>
              <button
                type="button"
                onClick={() => setProPlan("month")}
                className={`rounded-ds border p-ds-sm text-left ${
                  proPlan === "month" ? "border-[#7a5a2e] bg-[#fff8ea]" : "border-warm-base bg-paper"
                }`}
              >
                <p className="text-ds-body font-semibold text-ink">Pro 月付</p>
                <p className="text-ds-title text-[#7a5a2e]">¥70</p>
                <p className="text-[11px] text-soft">按月灵活</p>
              </button>
            </div>

            <p className="mb-ds-md text-ds-body text-soft">解锁全部功能，让 AI 顾问真正成为你的私人关系参谋。</p>

            <div className="space-y-ds-xs text-ds-body leading-7 text-[#554638]">
              <div className="flex gap-ds-sm rounded-ds border border-warm-base bg-surface-warm-elevated px-ds-md py-ds-md">
                <span className="text-xl leading-none" aria-hidden>
                  👥
                </span>
                <div>
                  <p className="font-semibold text-ink">无限联系人，无限 AI 问答</p>
                  <p className="mt-1">
                    告别免费版 20 人与每日 15 次上限。社交圈再大、复盘再细，Pro 都装得下。
                  </p>
                </div>
              </div>
              <div className="flex gap-ds-sm rounded-ds border border-warm-base bg-surface-warm-elevated px-ds-md py-ds-md">
                <span className="text-xl leading-none" aria-hidden>
                  📈
                </span>
                <div>
                  <p className="font-semibold text-ink">自动更新的关系评分</p>
                  <p className="mt-1">
                    每次记录互动后自动重估「真朋友 / 表面关系」指数；无需像免费版那样依赖手动改分。
                  </p>
                </div>
              </div>
              <div className="flex gap-ds-sm rounded-ds border border-warm-base bg-surface-warm-elevated px-ds-md py-ds-md">
                <span className="text-xl leading-none" aria-hidden>
                  📄
                </span>
                <div>
                  <p className="font-semibold text-ink">可导出的完整分析报告</p>
                  <p className="mt-1">
                    一键生成 PDF 深度报告：趋势、相处模式与基于真实记录的个性化建议，可存档或与咨询师分享。
                  </p>
                </div>
              </div>
              <div className="flex gap-ds-sm rounded-ds border border-warm-base bg-surface-warm-elevated px-ds-md py-ds-md">
                <span className="text-xl leading-none" aria-hidden>
                  📔
                </span>
                <div>
                  <p className="font-semibold text-ink">日记关联分析</p>
                  <p className="mt-1">
                    日记里 @某人 时，AI 把情绪变化纳入关系分析——既听你说什么，也懂你的感受。
                  </p>
                </div>
              </div>
              <div className="flex gap-ds-sm rounded-ds border border-warm-base bg-surface-warm-elevated px-ds-md py-ds-md">
                <span className="text-xl leading-none" aria-hidden>
                  🔐
                </span>
                <div>
                  <p className="font-semibold text-ink">数据完全掌控</p>
                  <p className="mt-1">随时导出联系人与互动（CSV / JSON）。你的数据永远属于你。</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                className={`rounded-btn-ds px-ds-md py-2 text-ds-body font-semibold ${
                  proPlan === "lifetime"
                    ? "bg-[#0f766e] text-white hover:bg-[#0d5f58]"
                    : "border border-[#0f766e] bg-[#ecfdf5] text-[#0f5132] hover:bg-[#d1fae5]"
                }`}
                onClick={() => setProPlan("lifetime")}
              >
                升级终身 Pro+ ¥499{proPlan === "lifetime" ? "（已选）" : ""}
              </button>
              <button
                className="rounded-btn-ds border border-[#b6905e] bg-[#fff8ea] px-ds-md py-2 text-ds-body font-medium text-[#7a5a2e] hover:bg-[#fff1d8]"
                onClick={() => setProPlan("year")}
              >
                Pro 年付 ¥553
              </button>
              <button className="rounded-btn-ds bg-[#7a5a2e] px-ds-md py-2 text-ds-body font-medium text-white hover:bg-[#654923]">
                Pro 月付 ¥70
              </button>
            </div>
            <p className="mt-ds-xs text-ds-caption text-soft">
              已有 Pro 账户？
              <button className="ml-1 text-[#7a5a2e] underline underline-offset-2 hover:text-[#654923]">
                管理订阅
              </button>
            </p>
            <p className="mt-1 text-center text-[12px] font-medium text-[#0f5132]">
              🔥 已有 127 位用户选择终身 Pro+
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
