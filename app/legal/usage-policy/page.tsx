import Link from "next/link"

export default function UsagePolicyPage() {
  return (
    <div className="min-h-screen bg-base px-4 py-10 text-ink sm:px-6">
      <div className="mx-auto max-w-2xl rounded-landing-card border border-land-border bg-white p-8 shadow-landing sm:p-10">
        <p className="text-sm font-medium text-[#6d5443]">InnerMap</p>
        <h1 className="mt-2 text-2xl font-bold text-[#5d4037]">使用政策</h1>
        <p className="mt-4 text-sm leading-7 text-soft">
          「使用政策」与产品基础约定、合理使用范围与免责说明，与{" "}
          <Link href="/terms" className="font-medium text-ink underline-offset-2 hover:underline">
            《使用条款》
          </Link>{" "}
          一致。若两处表述有差异，以最新版本页面为准。
        </p>
        <Link
          href="/terms"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-[#d3c3b1] bg-white px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-[#f8f1e7]"
        >
          阅读使用条款
        </Link>
      </div>
    </div>
  )
}
