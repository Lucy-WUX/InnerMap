import type { HTMLAttributes } from "react"

import { cn } from "../../lib/utils"

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-ds border border-[#e4d8cb] bg-paper text-ds-body shadow-ds-card transition-all duration-150 hover:shadow-ds-card-hover",
        className
      )}
      {...props}
    />
  )
}

