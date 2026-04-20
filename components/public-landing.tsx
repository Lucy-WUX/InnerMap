"use client"

import Link from "next/link"

export function PublicLanding() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-ink">
      <header className="border-b border-warm-base bg-paper/90">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-base font-semibold text-[#6d5433]">InnerMap</p>
            <p className="text-xs text-soft">私密关系认知空间</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login?mode=signup"
              className="rounded-btn-ds border border-[#d3c3b1] px-3 py-2 text-sm text-soft hover:bg-[#f8f1e7]"
            >
              注册
            </Link>
            <Link href="/login" className="rounded-btn-ds bg-[#795548] px-3 py-2 text-sm text-white hover:bg-[#6d4c41]">
              登录
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <section className="rounded-ds border border-warm-base bg-paper p-6 sm:p-8">
          <p className="text-sm font-medium text-[#7a5a2e]">欢迎来到 InnerMap</p>
          <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">看见关系模式，建立更稳定的连接</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-soft">
            记录每天的人际互动与情绪体验，系统会帮助你发现关系趋势、能量变化和沟通模式。你可以按自己的节奏记录、复盘、调整。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/login?mode=signup"
              className="rounded-btn-ds bg-[#795548] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d4c41]"
            >
              立即注册开始
            </Link>
            <Link
              href="/login"
              className="rounded-btn-ds border border-[#d3c3b1] px-4 py-2 text-sm font-medium text-soft hover:bg-[#f8f1e7]"
            >
              我已有账号，去登录
            </Link>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-ds border border-warm-base bg-paper p-4">
            <h2 className="text-sm font-semibold text-ink">关系记录</h2>
            <p className="mt-1 text-sm text-soft">按联系人记录关键互动，积累属于你自己的关系脉络。</p>
          </article>
          <article className="rounded-ds border border-warm-base bg-paper p-4">
            <h2 className="text-sm font-semibold text-ink">情绪复盘</h2>
            <p className="mt-1 text-sm text-soft">结合日记和能量变化，识别消耗点与滋养点。</p>
          </article>
          <article className="rounded-ds border border-warm-base bg-paper p-4">
            <h2 className="text-sm font-semibold text-ink">私密空间</h2>
            <p className="mt-1 text-sm text-soft">数据仅用于你的个人复盘，帮助你更清晰地做出选择。</p>
          </article>
        </section>
      </main>
    </div>
  )
}
