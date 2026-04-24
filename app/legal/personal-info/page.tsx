import Link from "next/link"

import { BackNavButton } from "@/components/back-nav-button"

const btnClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-[#d3c3b1] bg-white px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-[#f8f1e7]"

export default function PersonalInfoCollectionPage() {
  return (
    <div className="min-h-screen bg-base px-4 py-10 text-ink sm:px-6">
      <div className="mx-auto max-w-2xl rounded-landing-card border border-land-border bg-white p-8 shadow-landing sm:p-10">
        <p className="text-sm font-medium text-[#6d5443]">InnerMap</p>
        <h1 className="mt-2 text-2xl font-bold text-[#5d4037]">个人信息收集清单</h1>
        <p className="mt-4 text-sm leading-7 text-soft">
          我们收集的信息类型与用途（例如账户标识、同步内容、用量统计）详见{" "}
          <Link href="/privacy" className="font-medium text-ink underline-offset-2 hover:underline">
            《隐私政策》
          </Link>{" "}
          与{" "}
          <Link href="/privacy-hub" className="font-medium text-ink underline-offset-2 hover:underline">
            信任中心
          </Link>
          。本页为合规导航入口，随版本补充更细条目。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <BackNavButton className={btnClass} />
          <Link href="/privacy" className={btnClass}>
            阅读隐私政策
          </Link>
        </div>
      </div>
    </div>
  )
}
