import type { InputHTMLAttributes } from "react"

import { cn } from "../../lib/utils"

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-btn-ds border border-[#d8c9b9] bg-paper px-3 text-ds-body text-[#795548] outline-none ring-0 placeholder:text-soft focus:border-[#c3ae98]",
        className
      )}
      {...props}
    />
  )
}

