import type { HTMLAttributes } from "react"

import { cn } from "../../lib/utils"

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[16px] border border-[#e4d8cb] bg-paper text-ds-body shadow-[0_2px_12px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.65)] transition-all duration-150 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.45)]",
        className
      )}
      {...props}
    />
  )
}

