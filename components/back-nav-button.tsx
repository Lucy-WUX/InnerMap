"use client"

import { useRouter } from "next/navigation"

type BackNavButtonProps = {
  className?: string
  children?: React.ReactNode
  /** 无可用历史记录时跳转的路径，默认 `/` */
  fallbackHref?: string
}

export function BackNavButton({
  className,
  children = "返回上一页",
  fallbackHref = "/",
}: BackNavButtonProps) {
  const router = useRouter()

  function handleClick() {
    if (typeof window === "undefined") return
    if (window.history.length > 1) {
      router.back()
      return
    }
    router.push(fallbackHref)
  }

  return (
    <button type="button" className={className} onClick={handleClick}>
      {children}
    </button>
  )
}
