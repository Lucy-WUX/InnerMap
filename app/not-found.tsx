import Link from "next/link"

import { BackNavButton } from "@/components/back-nav-button"
import { LOCAL_MODE_HREF } from "@/lib/local-mode"
import { buttonVariants } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-4 py-16 text-center text-ink">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-soft">404</p>
      <h1 className="mt-2 text-2xl font-bold text-[#5d4037] sm:text-3xl">这里还没有一条路</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#5c4d42]">
        页面不存在或链接已失效。你可以返回上一页，若无历史记录将回到首页；也可直接进入本地模式继续记录。
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <BackNavButton
          className={cn(
            buttonVariants({ variant: "default" }),
            "inline-flex min-h-11 rounded-full px-6 py-2.5 text-sm shadow-sm"
          )}
        />
        <Link
          href={LOCAL_MODE_HREF}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d3c3b1] bg-white px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-[#f8f1e7]"
        >
          进入本地模式
        </Link>
      </div>
    </div>
  )
}
