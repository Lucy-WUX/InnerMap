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
          <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">看见关系模式，建立更稳定、更轻松的人际连接</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-soft">
            这不是普通日记，而是一个面向关系复盘的私密工具。你可以记录与每个人的互动、当下情绪和能量变化，系统会帮你长期观察关系趋势，
            识别哪些连接在滋养你、哪些正在消耗你。
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
            <p className="mt-1 text-sm text-soft">按联系人记录每次聊天、见面和冲突，形成可回看的关系时间线。</p>
          </article>
          <article className="rounded-ds border border-warm-base bg-paper p-4">
            <h2 className="text-sm font-semibold text-ink">情绪复盘</h2>
            <p className="mt-1 text-sm text-soft">结合日记内容与能量分值，定位反复出现的沟通模式和触发点。</p>
          </article>
          <article className="rounded-ds border border-warm-base bg-paper p-4">
            <h2 className="text-sm font-semibold text-ink">私密空间</h2>
            <p className="mt-1 text-sm text-soft">你的数据属于你自己，用于个人成长与决策，不公开给其他用户。</p>
          </article>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-ds border border-warm-base bg-paper p-4">
            <h2 className="text-sm font-semibold text-ink">1. 先添加联系人</h2>
            <p className="mt-1 text-sm text-soft">把你在意的人加入档案，建立关系观察的起点。</p>
          </article>
          <article className="rounded-ds border border-warm-base bg-paper p-4">
            <h2 className="text-sm font-semibold text-ink">2. 再记录互动和日记</h2>
            <p className="mt-1 text-sm text-soft">每次互动后写下事件和感受，系统会自动累计变化。</p>
          </article>
          <article className="rounded-ds border border-warm-base bg-paper p-4">
            <h2 className="text-sm font-semibold text-ink">3. 最后看趋势建议</h2>
            <p className="mt-1 text-sm text-soft">查看关系波动、能量预警和行动建议，帮助你更好选择边界。</p>
          </article>
        </section>

        <section className="rounded-ds border border-[#d7e7d9] bg-[#f3fbf4] p-4">
          <p className="text-sm font-semibold text-[#1f6a32]">🔒 隐私说明</p>
          <p className="mt-1 text-sm text-[#2f5b39]">
            InnerMap 设计目标是“私密关系认知空间”：只有你能访问自己的账号和内容。请勿在公共设备上保持登录。
          </p>
        </section>
      </main>
    </div>
  )
}
