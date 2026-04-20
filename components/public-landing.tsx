"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"

const GITHUB_URL = "https://github.com/Lucy-WUX/InnerMap"

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

function HeroButtonSecondary({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full inline-flex min-h-11 items-center justify-center border border-[#d3c3b1] bg-white px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-[#f8f1e7]"
    >
      {children}
    </Link>
  )
}

export function PublicLanding() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-base text-ink">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300 ${
          scrolled
            ? "border-b border-land-border/80 bg-base/80 shadow-landing backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-base font-semibold text-[#6d5443]">InnerMap</p>
            <p className="text-xs text-soft">私密关系认知空间</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/privacy-hub"
              className="mr-1 hidden text-xs font-medium text-soft underline-offset-4 transition-colors hover:text-ink hover:underline sm:inline"
            >
              隐私与信任
            </Link>
            <NavButtonPrimary href="/login">登录</NavButtonPrimary>
            <NavButtonSecondary href="/register">注册</NavButtonSecondary>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <h1 className="text-3xl font-bold leading-tight text-[#5d4037] sm:text-4xl lg:text-[2.5rem] lg:leading-snug">
                绘制你的人际地图，导航每一段关系
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-soft sm:text-base sm:leading-8">
                AI 驱动的个人人际关系智能管理系统，帮你识别真朋友，远离消耗型关系
              </p>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-soft sm:text-sm">
                登录后安全同步：记录与账户经加密连接与托管云端保持一致，仅你本人可访问。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <HeroButtonPrimary href="/register">立即开始</HeroButtonPrimary>
                <HeroButtonSecondary href="#features">了解更多</HeroButtonSecondary>
                <HeroButtonSecondary href="#trust">信任与隐私</HeroButtonSecondary>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              <div className="overflow-hidden rounded-landing-card border border-land-border bg-white shadow-landing-hero-img">
                <Image
                  src="/landing-app-screenshot.png"
                  alt="InnerMap 产品界面整体预览"
                  width={1200}
                  height={780}
                  className="h-auto w-full object-cover object-top"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-28 border-t border-land-border/60 bg-[#fdfbf7] px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-bold text-[#5d4037] sm:text-3xl">为什么选择 InnerMap</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
              {[
                {
                  icon: "💎",
                  title: "关系真相识别",
                  body: "基于真实互动记录，自动计算真朋友指数和表面关系指数",
                },
                {
                  icon: "🤖",
                  title: "专属 AI 顾问",
                  body: "点开谁，就能直接问 AI 关于谁的所有问题",
                },
                {
                  icon: "⚡",
                  title: "能量消耗追踪",
                  body: "识别消耗型关系，保护你的情绪能量",
                },
                {
                  icon: "🔒",
                  title: "账户与云端安全同步",
                  body:
                    "使用 Supabase 登录后，联系人、日记与互动会与你的账户绑定，经加密连接同步至托管云端，仅你本人可访问，不向其他用户公开。完整说明见《隐私政策》。",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-landing-card border border-land-border bg-white p-6 shadow-landing transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-landing-hover"
                >
                  <p className="text-2xl" aria-hidden>
                    {item.icon}
                  </p>
                  <h3 className="mt-3 text-base font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-soft">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="trust"
          className="scroll-mt-28 border-t border-land-border/60 bg-[#f7f4ef] px-4 py-16 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-bold text-[#5d4037] sm:text-3xl">信任，是我们与你的契约</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-7 text-soft sm:text-base">
              你写下的不是普通笔记，而是人际关系里最锋利、最柔软、最不敢示人的部分。我们按「生死线」标准设计隐私：宁可少一个花哨功能，也不牺牲你的安全感。
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "默认只属于你",
                  body: "记录与账户绑定，经加密连接同步至托管后端；不向其他 InnerMap 用户公开你的内容。",
                },
                {
                  title: "说清再动手",
                  body: "登录、同步、AI 何时经服务端处理，均在《隐私政策》写明；营销话术与真实能力对齐。",
                },
                {
                  title: "自持与退出",
                  body: "应用内可导出 JSON 备份；退出登录降低公共设备风险；更多删除能力在路线图中透明预告。",
                },
                {
                  title: "持续收紧",
                  body: "技术侧持续缩小日志与泄露面（如避免记录日记正文与全量 AI 提示词），并文档化可核查。",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-landing-card border border-land-border bg-white p-5 shadow-landing transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-landing-hover"
                >
                  <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-soft sm:text-sm sm:leading-7">{item.body}</p>
                </article>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/privacy-hub"
                className="rounded-full inline-flex min-h-11 items-center justify-center bg-ink px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#6d4c41]"
              >
                进入隐私与信任中心
              </Link>
              <Link
                href="/privacy"
                className="rounded-full inline-flex min-h-11 items-center justify-center border border-[#d3c3b1] bg-white px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-[#f8f1e7]"
              >
                阅读隐私政策
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="rounded-landing-card border border-land-border bg-white px-6 py-12 text-center shadow-landing sm:px-10 sm:py-14">
            <p className="text-xl font-bold text-[#5d4037] sm:text-2xl">开始你的人际关系探索之旅</p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/register"
                className="rounded-full inline-flex min-h-11 items-center justify-center bg-ink px-8 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#6d4c41]"
              >
                免费注册使用
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-land-border bg-base px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-center text-xs text-soft sm:text-left">© 2026 InnerMap. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-soft">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="text-ink underline-offset-4 transition-colors hover:text-[#6d4c41] hover:underline"
            >
              GitHub
            </a>
            <span className="text-land-border" aria-hidden>
              |
            </span>
            <Link href="/privacy-hub" className="text-ink underline-offset-4 transition-colors hover:text-[#6d4c41] hover:underline">
              隐私与信任
            </Link>
            <span className="text-land-border" aria-hidden>
              |
            </span>
            <Link href="/privacy" className="text-ink underline-offset-4 transition-colors hover:text-[#6d4c41] hover:underline">
              隐私政策
            </Link>
            <span className="text-land-border" aria-hidden>
              |
            </span>
            <Link href="/terms" className="text-ink underline-offset-4 transition-colors hover:text-[#6d4c41] hover:underline">
              使用条款
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
