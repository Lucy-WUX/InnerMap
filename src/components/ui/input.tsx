import type { InputHTMLAttributes } from "react"

import { cn } from "../../lib/utils"

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-btn-ds border border-[#d8c9b9] bg-paper px-3 text-ds-body text-[#795548] outline-none ring-0 placeholder:text-soft transition-shadow focus:border-[#c3ae98] focus:shadow-[0_0_0_3px_rgba(121,85,72,0.12)] dark:border-stone-600 dark:bg-stone-900/90 dark:text-stone-200 dark:placeholder:text-stone-500 dark:focus:border-amber-800/80 dark:focus:shadow-[0_0_0_3px_rgba(180,83,9,0.15)]",
        className
      )}
      {...props}
    />
  )
}

