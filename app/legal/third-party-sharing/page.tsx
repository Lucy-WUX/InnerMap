import Link from "next/link"

export default function ThirdPartySharingPage() {
  return (
    <div className="min-h-screen bg-base px-4 py-10 text-ink sm:px-6">
      <div className="mx-auto max-w-2xl rounded-landing-card border border-land-border bg-white p-8 shadow-landing sm:p-10">
        <p className="text-sm font-medium text-[#6d5443]">InnerMap</p>
        <h1 className="mt-2 text-2xl font-bold text-[#5d4037]">第三方信息共享清单</h1>
        <p className="mt-4 text-sm leading-7 text-soft">
          为提供账户、同步与 AI 能力，我们可能使用经你同意的第三方服务（例如身份认证与数据托管）。具体清单与更新以{" "}
          <Link href="/privacy" className="font-medium text-ink underline-offset-2 hover:underline">
            《隐私政策》
          </Link>{" "}
          与信任中心说明为准。
        </p>
        <Link
          href="/privacy-hub"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-[#d3c3b1] bg-white px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-[#f8f1e7]"
        >
          前往信任中心
        </Link>
      </div>
    </div>
  )
}
