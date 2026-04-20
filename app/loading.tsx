export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base px-4 text-ink">
      <div
        className="relative h-12 w-12"
        aria-hidden
      >
        <div className="absolute inset-0 rounded-full border-2 border-[#e7dbc9] border-t-[#795548] animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-[#5d4037]/50 animate-spin [animation-direction:reverse] [animation-duration:900ms]" />
      </div>
      <p className="text-sm font-medium text-[#5c4d42]">InnerMap 加载中…</p>
    </div>
  )
}
