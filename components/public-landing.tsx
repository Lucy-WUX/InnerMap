"use client"

import Link from "next/link"
import { type ReactNode } from "react"

import { LOCAL_MODE_HREF } from "@/lib/local-mode"

function NavButtonPrimary({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-btn-ds inline-flex min-h-11 items-center justify-center bg-ink px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#6d4c41]"
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
      className="rounded-full inline-flex min-h-11 items-center justify-center bg-ink px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#6d4c41]"
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
          <div className="mx-auto">
            <Link
              href={LOCAL_MODE_HREF}
              className="inline-flex min-h-11 items-center justify-center rounded-[16px] bg-[#7a5a2e] px-5 py-2 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(122,90,46,0.24)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(122,90,46,0.3)]"
            >
              晓观
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <NavButtonSecondary href={LOCAL_MODE_HREF}>模式切换</NavButtonSecondary>
            <NavButtonSecondary href="/login">消息 / 通知</NavButtonSecondary>
            <NavButtonPrimary href="/register">我的</NavButtonPrimary>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-[1200px] px-4 pb-14 pt-12 sm:px-6">
          <h1 className="text-3xl font-bold leading-tight text-[#5d4037] sm:text-4xl">遇见更好的关系，遇见更从容的自己</h1>
          <p className="mt-3 text-lg font-semibold text-[#5d4037]">晓观・你的专属人际关系 AI 顾问</p>
          <p className="mt-2 max-w-2xl text-base text-[#3e2723]">用 AI 看清关系本质，远离消耗，守住真心</p>
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

        <section className="border-t border-land-border/60 bg-[#f7f4ef] px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-[1200px]">
            <h2 className="text-2xl font-bold text-ink">两种模式，随心选择</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[16px] border border-[#c8e6c9] bg-[#f1f8f2] p-5 shadow-landing">
                <p className="text-sm font-semibold text-[#1b5e20]">✅ 隐私优先</p>
                <h3 className="mt-2 text-lg font-semibold">本地模式（默认推荐）</h3>
                <p className="mt-2 text-sm leading-7 text-[#2f4a34]">数据本地存储，不上传云端，保护你的关系隐私</p>
                <Link href={LOCAL_MODE_HREF} className="mt-4 inline-flex rounded-[16px] bg-[#2e7d32] px-4 py-2 text-sm font-semibold text-white">
                  立即进入
                </Link>
              </div>
              <div className="rounded-[16px] border border-land-border bg-white p-5 shadow-landing">
                <p className="text-sm font-semibold text-[#546e7a]">☁️ 多设备同步</p>
                <h3 className="mt-2 text-lg font-semibold">登录模式</h3>
                <p className="mt-2 text-sm leading-7 text-[#3e2723]">注册账号，支持多设备同步数据，换设备也不中断</p>
                <Link href="/register" className="mt-4 inline-flex rounded-[16px] border border-[#795548] px-4 py-2 text-sm font-semibold text-[#795548]">
                  注册并同步
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
          <div className="rounded-[16px] border border-[#d8c9b9] bg-[#fffdf9] px-6 py-8 text-center shadow-landing">
            <p className="text-base font-semibold text-[#2a1810]">所有核心功能永久免费，无广告，无强制注册</p>
            <p className="mt-2 text-sm text-[#7a5a2e]">Pro 版为自愿支持，兑换码一经发放无法退款，请谨慎付费</p>
          </div>
        </section>
      </main>
    </div>
  )
}
