import { cva, type VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes } from "react"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-btn-ds text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3ae98] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#795548] text-white hover:bg-[#6D4C41]",
        outline: "border border-[#d8c9b9] bg-paper text-[#795548] hover:bg-[#f3ece4]",
        ghost: "text-[#795548] hover:bg-[#f3ece4]",
        danger: "bg-[#b75247] text-white hover:bg-[#9f463c]",
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

