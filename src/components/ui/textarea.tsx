import { forwardRef, type TextareaHTMLAttributes } from "react"

import { cn } from "../../lib/utils"

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-32 w-full rounded-ds border border-[#d8c9b9] bg-paper p-ds-xs text-ds-body leading-6 text-[#795548] outline-none placeholder:text-soft transition-shadow focus:border-[#c3ae98] focus:shadow-[0_0_0_3px_rgba(121,85,72,0.12)] dark:border-stone-600 dark:bg-stone-900/90 dark:text-stone-200 dark:placeholder:text-stone-500 dark:focus:border-amber-800/80 dark:focus:shadow-[0_0_0_3px_rgba(180,83,9,0.15)]",
        className
      )}
      {...props}
    />
  )
})

