import { cva, type VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes } from "react"

import { cn } from "../../lib/utils"

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-btn-ds text-ds-body font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3ae98] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-[#8B5A42] bg-[#f4e9dd] text-[#6B3F2E] shadow-[0_1px_2px_rgba(107,63,46,0.08)] hover:bg-[#ead9c8] hover:text-[#4a2c20] dark:border-[var(--pss-border-mid)] dark:bg-[var(--pss-surface-muted)] dark:text-[var(--pss-text-primary)] dark:shadow-none dark:hover:bg-[#3a3530]",
        outline:
          "border border-[#d8c9b9] bg-paper text-soft hover:bg-[#f3ece4] dark:border-stone-600 dark:bg-stone-900/80 dark:text-stone-300 dark:hover:bg-stone-800",
        ghost: "text-soft hover:bg-[#f3ece4] dark:text-stone-400 dark:hover:bg-stone-800/80",
        danger: "bg-energy-alert text-[#fffdf9] hover:bg-[#9b1e14]",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-11 px-3",
        lg: "h-12 px-6",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

