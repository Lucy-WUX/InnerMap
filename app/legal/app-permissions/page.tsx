import Link from "next/link"

import { BackNavButton } from "@/components/back-nav-button"

export default function AppPermissionsPage() {
  return (
    <div className="min-h-screen bg-base px-4 py-10 text-ink sm:px-6">
      <div className="mx-auto max-w-2xl rounded-landing-card border border-land-border bg-white p-8 shadow-landing sm:p-10">
        <p className="text-sm font-medium text-[#6d5443]">InnerMap</p>
        <h1 className="mt-2 text-2xl font-bold text-[#5d4037]">应用权限说明</h1>
        <p className="mt-4 text-sm leading-7 text-soft">
          Web 端主要依赖浏览器能力（本地存储、网络请求等）。若你使用设备生物识别或系统密钥（WebAuthn），相关权限由浏览器与系统管理，我们不会单独申请「通讯录」等敏感权限。详见{" "}
          <Link href="/privacy" className="font-medium text-ink underline-offset-2 hover:underline">
            《隐私政策》
          </Link>
          。
        </p>
        <BackNavButton className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-[#d3c3b1] bg-white px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-[#f8f1e7]" />
      </div>
    </div>
  )
}
