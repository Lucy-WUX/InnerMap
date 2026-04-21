"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"

import { LOCAL_MODE_HREF } from "@/lib/local-mode"
import { SITE_GITHUB_REPO_URL } from "@/lib/site"

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
            <p className="text-xs text-[#5c4d42]">安全、只属于你的关系树洞</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#features"
              className="mr-1 hidden text-xs font-medium text-soft underline-offset-4 transition-colors hover:text-ink hover:underline sm:inline"
            >
              了解更多
            </a>
            <a
              href="#trust"
              className="mr-1 hidden text-xs font-medium text-soft underline-offset-4 transition-colors hover:text-ink hover:underline sm:inline"
            >
              信任与隐私
            </a>
            <NavButtonSecondary href="/login">登录</NavButtonSecondary>
            <NavButtonPrimary href="/register">注册</NavButtonPrimary>
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
              <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-[#5d4037] sm:text-lg">
                一个只属于你的、安全的人际关系树洞
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5c4d42] sm:text-base">
                在这里，你可以诚实地面对自己和每一段关系
              </p>
              <p className="mt-6 rounded-ds border border-[#c8e6c9] bg-[#f1f8f2] px-4 py-3 text-sm font-medium leading-relaxed text-[#0f2918] sm:text-base">
                <span aria-hidden>✅</span> 无需注册，打开即用。所有数据默认存储在你的浏览器本地，不会上传任何服务器。
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <HeroButtonPrimary href={LOCAL_MODE_HREF}>进入应用</HeroButtonPrimary>
                <Link
                  href="/register"
                  className="rounded-full inline-flex min-h-11 items-center justify-center border-2 border-[#795548] bg-white px-6 py-2.5 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-[#f8f1e7]"
                >
                  注册账号同步
                </Link>
              </div>
              <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-soft sm:hidden">
                <a href="#features" className="underline-offset-4 hover:text-ink hover:underline">
                  了解更多
                </a>
                <a href="#trust" className="underline-offset-4 hover:text-ink hover:underline">
                  信任与隐私
                </a>
              </p>
            </div>
            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              <div className="overflow-hidden rounded-landing-card border border-land-border bg-white shadow-landing-hero-img">
                <Image
                  src="/landing-relations-screenshot.png"
                  alt="InnerMap 关系页：环形图与联系人卡片"
                  width={1200}
                  height={780}
                  className="h-auto w-full object-cover object-center"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="scroll-mt-28 border-t border-land-border/60 bg-[#fdfbf7] px-4 py-16 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">核心能力</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-[#5c4d42] sm:text-base">
              把「你的数据只属于你」放在第一位；云端同步为可选项，细节见{" "}
              <Link href="/privacy-hub" className="font-medium text-ink underline-offset-2 hover:underline">
                隐私与信任中心
              </Link>
              与
              <Link href="/privacy" className="mx-0.5 font-medium text-ink underline-offset-2 hover:underline">
                《隐私政策》
              </Link>
              。
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
              {[
                {
                  icon: "🔒",
                  title: "隐私第一设计",
                  body: (
                    <>
                      所有数据默认本地存储，我们永远看不到你的任何内容。
                      若你注册并开启同步，数据会经加密连接保存至你的账户，仅供你本人使用，不向其他用户公开。详见
                      <Link
                        href="/privacy"
                        className="font-semibold text-[#3e2723] underline decoration-[#6d5e54] underline-offset-2 hover:text-ink hover:decoration-ink"
                      >
                        《隐私政策》
                      </Link>
                      。
                    </>
                  ),
                },
                {
                  icon: "💎",
                  title: "关系真相识别",
                  body: "基于真实互动记录，自动计算真朋友指数和表面关系指数。",
                },
                {
                  icon: "🤖",
                  title: "专属 AI 顾问",
                  body: "点开谁，就能直接问 AI 关于谁的所有问题。",
                },
                {
                  icon: "⚡",
                  title: "能量消耗追踪",
                  body: "识别消耗型关系，保护你的情绪能量。",
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
                  <p className="mt-2 text-sm leading-7 text-[#3e2723]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="trust"
          className="scroll-mt-28 border-t border-land-border/60 bg-[#f7f4ef] px-4 py-16 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">隐私与信任</h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg font-semibold leading-relaxed text-[#4a3728] sm:text-xl sm:leading-snug">
              宁可少一个花哨功能，也不牺牲你的安全感。
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#3e2723] sm:text-base">
              你写下的不是普通笔记，而是人际关系里最锋利、最柔软、最不敢示人的部分。我们按「生死线」标准设计隐私：登录与同步、AI
              处理边界均在政策中写清，能力与话术保持一致。
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/privacy-hub"
                className="rounded-full inline-flex min-h-11 items-center justify-center bg-ink px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#6d4c41]"
              >
                查看完整隐私承诺
              </Link>
              <Link
                href="/privacy"
                className="rounded-full inline-flex min-h-11 items-center justify-center border border-[#d3c3b1] bg-white px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-[#f8f1e7]"
              >
                阅读《隐私政策》
              </Link>
            </div>
            <p className="mx-auto mt-10 max-w-2xl text-sm font-medium leading-relaxed text-[#2a1810] sm:text-base">
              <span aria-hidden>🚀</span> 现在就可以无需注册开始使用，你的第一个联系人、第一篇日记，都只会保存在你的设备里。
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="rounded-landing-card border border-[#c8e6c9] bg-[#f9fdf9] px-6 py-10 text-center shadow-landing sm:px-10 sm:py-12">
            <p className="mx-auto max-w-xl text-sm font-medium leading-relaxed text-[#2a1810] sm:text-base">
              <span aria-hidden>✅</span> 无需注册即可体验；需要换机或多端同步时再注册即可。
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <HeroButtonPrimary href={LOCAL_MODE_HREF}>进入应用（无需注册）</HeroButtonPrimary>
              <Link
                href="/register"
                className="rounded-full inline-flex min-h-11 items-center justify-center border-2 border-[#795548] bg-white px-6 py-2.5 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-[#f8f1e7]"
              >
                注册账号多设备同步
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
              href={SITE_GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-land-border bg-white text-ink shadow-sm transition-colors hover:border-[#c4b5a4] hover:bg-[#f8f1e7] hover:text-[#5d4037]"
              aria-label="在 GitHub 上打开 InnerMap 仓库"
            >
              <svg className="h-5 w-5" viewBox="0 0 98 96" aria-hidden xmlns="http://www.w3.org/2000/svg">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                />
              </svg>
            </a>
            <span className="text-land-border" aria-hidden>
              |
            </span>
            <a
              href="#trust"
              className="text-ink underline-offset-4 transition-colors hover:text-[#6d4c41] hover:underline"
            >
              信任与隐私
            </a>
            <span className="text-land-border" aria-hidden>
              |
            </span>
            <Link
              href="/privacy-hub"
              className="text-ink underline-offset-4 transition-colors hover:text-[#6d4c41] hover:underline"
            >
              信任中心
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
