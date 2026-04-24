import Link from "next/link"

import { BackNavButton } from "@/components/back-nav-button"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-base px-4 py-10 text-ink sm:px-6">
      <div className="mx-auto max-w-2xl rounded-landing-card border border-land-border bg-white p-8 shadow-landing sm:p-10">
        <p className="text-sm font-medium text-[#6d5443]">InnerMap</p>
        <h1 className="mt-2 text-2xl font-bold text-[#5d4037]">使用条款</h1>
        <p className="mt-4 text-sm leading-7 text-soft">
          InnerMap 为个人关系复盘与自我觉察辅助工具，不提供医疗、法律或心理咨询服务。以下为使用时的基本约定。
        </p>
        <ul className="mt-6 list-disc space-y-3 pl-5 text-sm leading-7 text-soft">
          <li>请合法、善意地使用产品，勿将生成内容作为对特定他人的公开指控或骚扰依据。</li>
          <li>AI 生成内容可能存在偏差，重要决定请结合现实情境自行判断。</li>
          <li>
            登录、账户与数据同步方式以{" "}
            <Link href="/privacy" className="font-medium text-ink underline-offset-2 hover:underline">
              《隐私政策》
            </Link>{" "}
            为准（含 Supabase 托管与云端同步说明）。
          </li>
          <li>产品形态与功能可能随版本迭代调整，恕不另行通知。</li>
        </ul>
        <BackNavButton className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-[#d3c3b1] bg-white px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-[#f8f1e7]" />
      </div>
    </div>
  )
}
