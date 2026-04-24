"use client"

import Link from "next/link"
import { type ReactNode } from "react"

import { LOCAL_MODE_HREF } from "@/lib/local-mode"

const ink = "text-[#6B3F2E]"
const inkMuted = "text-[#5C4B3E]"
const inkDeep = "text-[#5d4037]"

function NavButtonPrimary({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-btn-ds inline-flex min-h-11 items-center justify-center border border-[#8B5A42] bg-[#f4e9dd] px-4 py-2 text-sm font-semibold text-[#6B3F2E] shadow-[0_1px_2px_rgba(107,63,46,0.08)] transition-all hover:border-[#6d4c41] hover:bg-[#ead9c8] hover:text-[#4a2c20]"
    >
      {children}
    </Link>
  )
}

function NavButtonSecondary({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-btn-ds inline-flex min-h-11 items-center justify-center border border-[#d4bc9f] bg-[#fffdf9] px-4 py-2 text-sm font-semibold text-[#6B3F2E] transition-all hover:border-[#c4a882] hover:bg-[#faf3eb]"
    >
      {children}
    </Link>
  )
}

function HeroButtonPrimary({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#9a6b4d] bg-[#e8d4bc] px-7 py-2.5 text-sm font-semibold text-[#5c3d2e] shadow-[0_2px_8px_rgba(107,63,46,0.12)] transition-all hover:border-[#7a5238] hover:bg-[#dfc6a8] hover:text-[#4a2c20] hover:shadow-[0_4px_14px_rgba(107,63,46,0.16)]"
    >
      {children}
    </Link>
  )
}

export function PublicLanding() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#6B3F2E] [color-scheme:light] dark:bg-[#faf8f5] dark:text-[#6B3F2E]">
      <header className="sticky inset-x-0 top-0 z-50 border-b border-[#e5d9cc] bg-[#faf8f5]/90 shadow-[0_1px_0_rgba(107,63,46,0.06)] backdrop-blur-md dark:border-[#e5d9cc] dark:bg-[#faf8f5]/90">
        <nav className="mx-auto flex max-w-[1200px] items-center gap-4 px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <p className={`truncate text-base font-semibold tracking-tight ${inkDeep} dark:text-[#5d4037]`}>InnerMap</p>
            <p className={`text-xs font-medium ${inkMuted} dark:text-[#5C4B3E]`}>Your Relationship Guardian</p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <NavButtonSecondary href="/register">注册</NavButtonSecondary>
            <NavButtonPrimary href="/login">登录</NavButtonPrimary>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[#ebe3d9]/80 bg-gradient-to-b from-[#fffdfb] via-[#faf8f5] to-[#faf8f5] px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-16 dark:border-[#ebe3d9]/80 dark:from-[#fffdfb] dark:via-[#faf8f5] dark:to-[#faf8f5]">
          <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-[#e8d4bc]/35 blur-3xl dark:bg-[#e8d4bc]/35" aria-hidden />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-[#dcc9b4]/25 blur-2xl dark:bg-[#dcc9b4]/25" aria-hidden />
          <div className="relative mx-auto max-w-[1200px]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a7b62] dark:text-[#9a7b62]">晓观 · InnerMap</p>
            <h1 className={`mt-4 text-3xl font-bold leading-[1.2] sm:text-4xl md:text-[2.5rem] ${inkDeep} dark:text-[#5d4037]`}>
              遇见更好的关系，遇见更从容的自己
            </h1>
            <p className={`mt-4 text-lg font-semibold sm:text-xl ${inkMuted} dark:text-[#5C4B3E]`}>晓观・你的专属人际关系 AI 顾问</p>
            <p className={`mt-3 max-w-2xl text-base font-medium leading-relaxed sm:text-[17px] ${inkMuted} dark:text-[#5C4B3E]`}>
              用 AI 看清关系本质，远离消耗，守住真心
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <HeroButtonPrimary href={LOCAL_MODE_HREF}>立即使用・晓观</HeroButtonPrimary>
              <Link
                href="/pricing"
                className="inline-flex min-h-11 items-center justify-center rounded-[16px] border border-[#c4a882] bg-[#fffdf9] px-6 py-2.5 text-sm font-semibold text-[#6B3F2E] shadow-[0_1px_3px_rgba(107,63,46,0.06)] transition-all hover:border-[#b8956a] hover:bg-[#faf3eb] dark:border-[#c4a882] dark:bg-[#fffdf9] dark:text-[#6B3F2E]"
              >
                了解 Pro 版
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-[#e8dfd4] bg-[#fdfbf7] px-4 py-16 sm:px-6 sm:py-20 dark:border-[#e8dfd4] dark:bg-[#fdfbf7]">
          <div className="mx-auto max-w-[1200px]">
            <h2 className={`text-center text-2xl font-bold sm:text-[1.65rem] ${inkDeep} dark:text-[#5d4037]`}>为什么选择晓观</h2>
            <p className={`mx-auto mt-3 max-w-xl text-center text-sm font-medium leading-relaxed sm:text-base ${inkMuted} dark:text-[#5C4B3E]`}>
              把复杂的人际与情绪，拆成你能把握的一小步
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-3 md:gap-6">
              {[
                {
                  icon: "🔎",
                  title: "关系洞察",
                  desc: "AI 自动分析相处模式、情绪波动、关系趋势，让你一眼看懂谁在消耗你、谁值得珍惜。",
                },
                {
                  icon: "💗",
                  title: "情绪陪伴",
                  desc: "写不出来的心情、理不清的情绪，交给晓观，温柔拆解，给你可落地的情绪调节方案。",
                },
                {
                  icon: "📝",
                  title: "成长记录",
                  desc: "记录关系点滴，AI 帮你复盘成长轨迹，让每一次相遇都成为变更好的理由。",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="group rounded-[18px] border border-[#e5d9cc] bg-[#fffdf9] p-6 shadow-[0_4px_20px_rgba(95,73,53,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d4bc9f] hover:shadow-[0_12px_32px_rgba(95,73,53,0.1)] dark:border-[#e5d9cc] dark:bg-[#fffdf9]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4e9dd] text-2xl shadow-inner dark:bg-[#f4e9dd]">
                    {item.icon}
                  </div>
                  <h3 className={`mt-4 text-lg font-semibold ${ink} dark:text-[#6B3F2E]`}>{item.title}</h3>
                  <p className={`mt-2 text-sm leading-7 ${inkMuted} dark:text-[#5C4B3E]`}>{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-[#e8dfd4] bg-[#faf8f5] px-4 py-8 sm:px-6 dark:border-[#e8dfd4] dark:bg-[#faf8f5]">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-center text-xs font-medium text-[#9a7b62] dark:text-[#9a7b62]">InnerMap · 私密关系认知空间</p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold">
              <Link href="/privacy" className="text-[#6B3F2E] underline-offset-4 hover:underline dark:text-[#6B3F2E]">
                隐私政策
              </Link>
              <Link href="/terms" className="text-[#6B3F2E] underline-offset-4 hover:underline dark:text-[#6B3F2E]">
                服务条款
              </Link>
              <Link href="/pricing" className="text-[#6B3F2E] underline-offset-4 hover:underline dark:text-[#6B3F2E]">
                心意与支持
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
