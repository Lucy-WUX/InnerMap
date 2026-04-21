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
        "min-h-32 w-full rounded-ds border border-[#d8c9b9] bg-paper p-ds-xs text-ds-body leading-6 text-[#795548] outline-none placeholder:text-soft focus:border-[#c3ae98]",
        className
      )}
      {...props}
    />
  )
})

