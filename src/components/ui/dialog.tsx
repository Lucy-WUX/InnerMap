import type { ReactNode } from "react"
import { X } from "lucide-react"

export function Dialog({
  open,
  title,
  description,
  children,
  onClose,
  maxWidthClassName,
}: {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  maxWidthClassName?: string
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#412f1f]/30 p-4 backdrop-blur-[8px] sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidthClassName ?? "max-w-[480px]"} max-h-[88vh] overflow-y-auto rounded-ds border border-[#e4d8cb] bg-paper p-5 shadow-ds-card`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-warm-soft pb-ds-xs pt-1">
          <div>
          <h2 className="text-ds-title font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-1 text-sm text-[#907f6f]">{description}</p> : null}
          </div>
          <button className="rounded-md p-1 text-[#907f6f] hover:bg-[#f3eadf]" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

