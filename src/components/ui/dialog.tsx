import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"

export function Dialog({
  open,
  title,
  description,
  children,
  onClose,
  maxWidthClassName,
  fullScreen = false,
}: {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  maxWidthClassName?: string
  fullScreen?: boolean
}) {
  if (!open) return null

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  return (
    <div
      className={`fixed inset-0 z-[150] flex overflow-y-auto bg-[#412f1f]/30 backdrop-blur-[8px] ${
        fullScreen ? "items-stretch justify-stretch p-0" : "items-start justify-center p-3 sm:items-center sm:p-6"
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full ${
          fullScreen
            ? "h-[100dvh] max-w-none max-h-none overflow-y-auto overscroll-contain rounded-none border-0 bg-paper p-4 pb-20 shadow-none sm:p-6 sm:pb-24"
            : `${maxWidthClassName ?? "max-w-[480px]"} max-h-[90vh] overflow-y-auto rounded-ds border border-[#e4d8cb] bg-paper p-4 shadow-ds-card sm:max-h-[88vh] sm:p-5`
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-warm-soft pb-ds-xs pt-1">
          <div>
          <h2 className="text-ds-title font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-1 text-sm text-[#907f6f]">{description}</p> : null}
          </div>
          <button
            className="rounded-md p-2 text-[#907f6f] hover:bg-[#f3eadf]"
            aria-label="关闭弹窗"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

