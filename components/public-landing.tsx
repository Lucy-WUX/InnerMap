"use client"

import Link from "next/link"
import { type ReactNode } from "react"

import { LOCAL_MODE_HREF } from "@/lib/local-mode"

function NavButtonPrimary({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-btn-ds inline-flex min-h-11 items-center justify-center bg-ink px-4 py-2 text-sm font-medium text-[#5C4B3E] shadow-sm transition-colors hover:bg-[#6d4c41]"
    >
      {children}
    </Link>
  )
}

function NavButtonSecondary({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-btn-ds inline-flex min-h-11 items-center justify-center border border-[#d3c3b1] bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-[#f8f1e7]"
    >
      {children}
    </Link>
  )
}

function HeroButtonPrimary({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full inline-flex min-h-11 items-center justify-center bg-ink px-6 py-2.5 text-sm font-medium text-[#5C4B3E] shadow-sm transition-colors hover:bg-[#6d4c41]"
    >
      {children}
    </Link>
  )
}

export function PublicLanding() {
  return (
    <div className="min-h-screen bg-base text-ink">
      <header className="sticky inset-x-0 top-0 z-50 border-b border-land-border/80 bg-base/85 backdrop-blur-md">
        <nav className="mx-auto flex max-w-[1200px] items-center px-4 py-3 sm:px-6">
          <div>
            <p className="text-base font-semibold text-[#6d5443]">InnerMap</p>
            <p className="text-xs text-[#5c4d42]">Your Relationship Guardian</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NavButtonSecondary href="/register">注册</NavButtonSecondary>
            <NavButtonPrimary href="/login">登录</NavButtonPrimary>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-[1200px] px-4 pb-14 pt-12 sm:px-6">
          <h1 className="text-3xl font-bold leading-tight text-[#5d4037] sm:text-4xl">遇见更好的关系，遇见更从容的自己</h1>
          <p className="mt-3 text-lg font-semibold text-[#5C4B3E]">晓观・你的专属人际关系 AI 顾问</p>
          <p className="mt-2 max-w-2xl text-base font-medium leading-relaxed text-[#5C4B3E]">
            用 AI 看清关系本质，远离消耗，守住真心
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <HeroButtonPrimary href={LOCAL_MODE_HREF}>立即使用・晓观</HeroButtonPrimary>
            <Link
              href="/pricing"
              className="inline-flex min-h-11 items-center justify-center rounded-[16px] border border-[#795548] bg-white px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-[#f8f1e7]"
            >
              了解 Pro 版
            </Link>
          </div>
        </section>

        <section className="border-t border-land-border/60 bg-[#fdfbf7] px-4 py-14 sm:px-6">
          <div className="mx-auto grid max-w-[1200px] gap-4 md:grid-cols-3">
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
              <article key={item.title} className="rounded-[16px] border border-land-border bg-white p-6 shadow-landing">
                <p className="text-2xl">{item.icon}</p>
                <h3 className="mt-3 text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#3e2723]">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}
