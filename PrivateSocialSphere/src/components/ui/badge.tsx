import type { HTMLAttributes } from "react"

import { cn } from "../../lib/utils"

type BadgeProps = HTMLAttributes<HTMLSpanElement>

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-btn-ds bg-[#f2eae1] px-2.5 py-1 text-ds-caption text-[#7a6a5d]",
        className
      )}
      {...props}
    />
  )
}

