"use client"

import { UserRound } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { PublicLanding } from "@/components/public-landing"
import { getSupabaseBrowserClient, isBrowserSupabaseReady, isDemoModeEnabled } from "@/lib/supabase-browser"
import { clearPersistedAuth, useAuthStore } from "@/lib/stores/auth-store"
import type { Session } from "@supabase/supabase-js"

/** 未登录可访问：封面、本地模式 `/?local=1`、登录、注册、隐私/条款/信任中心 */
function isPublicUnauthedRoute(pathname: string, tab: string | null, localMode: boolean) {
  if (pathname === "/" && localMode) return true
  const isPublicCover = pathname === "/" && tab !== "relations" && tab !== "mine"
  const isAuthEntry = pathname === "/login" || pathname === "/register"
  const isPublicInfo =
    pathname === "/privacy" || pathname === "/terms" || pathname === "/privacy-hub" || pathname.startsWith("/pricing")
  return isPublicCover || isAuthEntry || isPublicInfo
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicLegal =
    pathname === "/privacy" || pathname === "/terms" || pathname === "/privacy-hub" || pathname.startsWith("/pricing")
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const localParam = searchParams.get("local") === "1"
  const isPublicCover = pathname === "/" && tabParam !== "relations" && tabParam !== "mine"
  const routeRef = useRef({ pathname, tab: tabParam, local: localParam })
  routeRef.current = { pathname, tab: tabParam, local: localParam }
  const accessToken = useAuthStore((s) => s.accessToken)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [envError, setEnvError] = useState("")
  const [envHint, setEnvHint] = useState("")
  const [envMissing, setEnvMissing] = useState<string[]>([])
  const [copiedEnv, setCopiedEnv] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

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
      .then((data: { ok?: boolean; message?: string; missing?: string[] }) => {
        setEnvMissing(data.missing ?? [])
        if (!data.ok) setEnvHint(data.message || "")
        else setEnvHint("")
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!isBrowserSupabaseReady()) {
      if (isDemoModeEnabled()) {
        setEnvError("当前为演示模式：未连接 Supabase，登录与云端数据能力不可用。")
        setAuthed(true)
        useAuthStore.getState().clearAuth()
        return
      }
      setEnvError("未检测到 Supabase 配置，已停用演示模式。请先配置环境变量后登录。")
      setAuthed(false)
      clearPersistedAuth()
      const { pathname: p, tab, local } = routeRef.current
      if (!isPublicUnauthedRoute(p, tab, local)) router.replace("/login")
      return
    }

    const supabase = getSupabaseBrowserClient()

    function syncSession(session: Session | null) {
      if (session?.access_token && session.user) {
        useAuthStore.getState().setAuth({
          accessToken: session.access_token,
          userId: session.user.id,
        })
      } else {
        useAuthStore.getState().clearAuth()
      }
      setAuthed(Boolean(session))
      const at = session?.access_token
      if (at) void refreshUsage(at)
      const { pathname: p, tab, local } = routeRef.current
      if (!session && !isPublicUnauthedRoute(p, tab, local)) {
        router.replace("/login")
      }
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setEnvError(`Supabase 会话检测失败：${error.message}`)
      }
      syncSession(data.session ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session)
    })

    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    if (authed === false) {
      const allow = isPublicUnauthedRoute(pathname, tabParam, localParam)
      if (!allow) router.replace("/login")
    }
  }, [authed, pathname, tabParam, localParam, router])

  useEffect(() => {
    if (authed !== true) return
    const onCover = pathname === "/" && tabParam !== "relations" && tabParam !== "mine"
    const onAuthEntry = pathname === "/login" || pathname === "/register"
    if (onAuthEntry || onCover) {
      router.replace("/?tab=home")
    }
  }, [authed, pathname, tabParam, router])

  useEffect(() => {
    if (!accessToken) return
    const timer = setInterval(() => {
      void refreshUsage(accessToken)
    }, 15000)
    return () => clearInterval(timer)
  }, [accessToken])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      setShowUserMenu(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  if (pathname === "/login" || pathname === "/register" || isPublicLegal) return <>{children}</>
  if (authed === null) {
    return (
      <div className="mx-auto min-h-screen max-w-5xl p-ds-md md:p-ds-lg">
        <div className="space-y-ds-md animate-pulse">
          <div className="h-10 w-full rounded-ds bg-[#efe6d9]" />
          <div className="h-28 rounded-ds bg-[#f4ecdf]" />
          <div className="h-64 rounded-ds bg-[#f4ecdf]" />
        </div>
      </div>
    )
  }
  const localGuest = authed === false && pathname === "/" && localParam

  if (!authed && !localGuest) {
    if (isPublicCover) return <PublicLanding />
    return <div className="p-ds-lg text-ds-body text-soft">正在跳转登录页...</div>
  }

  const useLocalQs = Boolean(localParam && !authed)
  function tabHref(tabKey: "home" | "relations" | "mine") {
    if (!useLocalQs) {
      if (tabKey === "home") return "/"
      return `/?tab=${tabKey}`
    }
    if (tabKey === "home") return "/?local=1"
    return `/?tab=${tabKey}&local=1`
  }

  const onMainTabs = pathname === "/"
  const navHome = onMainTabs && tabParam !== "relations" && tabParam !== "mine"
  const navRelations = onMainTabs && tabParam === "relations"
  const navMine = onMainTabs && tabParam === "mine"

  const hasSupabaseMissing = envMissing.some((item) => item.includes("SUPABASE"))
  const hasAiMissing = envMissing.includes("AI_API_KEY")
  const envBannerText = hasSupabaseMissing
    ? "⚠️ Supabase 环境变量未配置完整，当前无法使用登录与云端数据。"
    : hasAiMissing
      ? "⚠️ AI_API_KEY 未配置，AI 功能暂不可用，基础记录功能可继续使用。"
      : envError || envHint

  /** 纯本地访客：不展示云端/部署类提示，顶栏保持极简 */
  const showEnvBanner = Boolean(envBannerText) && !useLocalQs

  return (
    <div className="min-h-screen bg-base text-ink">
      <header className="sticky top-0 z-40 border-b border-warm-base/80 bg-paper/85 backdrop-blur-md supports-[backdrop-filter]:bg-paper/75">
        <nav className="mx-auto flex max-w-5xl items-center gap-1 px-3 py-2 sm:gap-ds-xs sm:px-ds-md sm:py-ds-xs">
          <Link
            href={tabHref("home")}
            className={`rounded-[16px] px-4 py-2 text-ds-body font-semibold transition-all ${
              navHome ? "bg-[#eadfce] text-ink" : "text-soft hover:bg-[#f4ebdf]"
            }`}
          >
            晓观
          </Link>
          <Link
            href={tabHref("relations")}
            className={`rounded-btn-ds px-3 py-1.5 text-ds-body ${
              navRelations ? "bg-[#eadfce] text-ink" : "text-soft hover:bg-[#f4ebdf]"
            }`}
          >
            观系
          </Link>
          <Link
            href={tabHref("mine")}
            className={`rounded-btn-ds px-3 py-1.5 text-ds-body ${
              navMine ? "bg-[#eadfce] text-ink" : "text-soft hover:bg-[#f4ebdf]"
            }`}
          >
            我的
          </Link>
          <div className="ml-auto" />
          {!useLocalQs ? (
            <button
              className="mr-1 rounded-[16px] border border-[#b6905e] bg-[#7a5a2e] px-3 py-2 text-ds-body font-semibold text-white shadow-[0_4px_12px_rgba(122,90,46,0.26)] transition-all hover:-translate-y-0.5 hover:bg-[#694d27] hover:shadow-[0_8px_18px_rgba(122,90,46,0.28)] sm:mr-ds-xs sm:px-4"
              onClick={() => router.push("/pricing")}
            >
              <span className="sm:hidden">👑</span>
              <span className="hidden sm:inline">👑 升级 Pro</span>
            </button>
          ) : null}
          <div className="relative">
            <button
              type="button"
              title={useLocalQs ? "账户与同步" : "账户与登录"}
              aria-label={useLocalQs ? "账户与同步" : "账户与登录"}
              className={
                useLocalQs
                  ? "flex h-9 w-9 items-center justify-center rounded-full border border-warm-base/60 bg-paper/90 text-ink/80 transition-colors hover:border-warm-strong hover:bg-[#f8f1e7] hover:text-ink"
                  : "flex h-9 w-9 items-center justify-center rounded-full border border-warm-strong bg-paper text-ds-body font-semibold text-[#6d5433] hover:bg-[#f8f1e7]"
              }
              onClick={() => setShowUserMenu((prev) => !prev)}
            >
              <UserRound className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} aria-hidden />
            </button>
            {showUserMenu ? (
              <div className="absolute right-0 top-11 z-[90] w-52 rounded-ds border border-warm-base bg-surface-warm-soft p-1.5 shadow-lg">
                {localGuest ? (
                  <>
                    <Link
                      href="/login"
                      className="block w-full rounded-btn-ds px-3 py-2 text-left text-ds-body font-semibold text-ink hover:bg-[#f8f1e7]"
                      onClick={() => setShowUserMenu(false)}
                    >
                      登录
                    </Link>
                    <Link
                      href="/register"
                      className="block w-full rounded-btn-ds px-3 py-2 text-left text-ds-body font-semibold text-ink hover:bg-[#f8f1e7]"
                      onClick={() => setShowUserMenu(false)}
                    >
                      注册 · 多设备同步
                    </Link>
                    <Link
                      href="/privacy-hub"
                      className="block w-full rounded-btn-ds px-3 py-2 text-left text-ds-body text-soft hover:bg-[#f8f1e7]"
                      onClick={() => setShowUserMenu(false)}
                    >
                      隐私与信任
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/privacy-hub"
                      className="block w-full rounded-btn-ds px-3 py-2 text-left text-ds-body text-soft hover:bg-[#f8f1e7]"
                      onClick={() => setShowUserMenu(false)}
                    >
                      隐私与信任
                    </Link>
                    <button className="w-full rounded-btn-ds px-3 py-2 text-left text-ds-body text-soft hover:bg-[#f8f1e7]">
                      账户设置
                    </button>
                    <button
                      className="w-full rounded-btn-ds px-3 py-2 text-left text-ds-body text-soft hover:bg-[#f8f1e7]"
                      onClick={() => {
                        setShowUserMenu(false)
                        router.push("/pricing")
                      }}
                    >
                      订阅管理
                    </button>
                    <button
                      className="w-full rounded-btn-ds px-3 py-2 text-left text-ds-body text-soft hover:bg-[#f8f1e7]"
                      onClick={async () => {
                        setShowUserMenu(false)
                        if (isBrowserSupabaseReady()) {
                          const supabase = getSupabaseBrowserClient()
                          await supabase.auth.signOut()
                        }
                        clearPersistedAuth()
                        router.replace("/login")
                      }}
                    >
                      退出登录
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </nav>
      </header>
      {showEnvBanner ? (
        <div className="mx-auto mt-ds-xs flex max-w-5xl flex-wrap items-center gap-ds-xs rounded-ds border border-[#f0d7ad] bg-[#fff8ea] px-3 py-2 text-ds-caption text-[#8d6a3f]">
          <span>{envBannerText}</span>
          <a
            className="underline underline-offset-2 hover:text-[#6f4f2e]"
            href="https://vercel.com/docs/environment-variables"
            target="_blank"
            rel="noreferrer"
          >
            查看部署指南
          </a>
          <button
            className="ml-auto hidden rounded-btn-ds border border-[#e2cba4] bg-surface-warm-soft px-2.5 py-1 text-ds-caption hover:bg-[#fff4df] sm:inline-flex"
            onClick={() => void copyEnvExample()}
          >
            {copiedEnv ? "已复制" : "复制环境变量示例"}
          </button>
        </div>
      ) : null}
      <main className="mx-auto max-w-5xl p-ds-md pb-24 md:p-ds-lg md:pb-28">{children}</main>
    </div>
  )
}
