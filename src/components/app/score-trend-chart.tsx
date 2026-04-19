import type { ScoreHistoryPoint } from "../../lib/relationship-ai-demo"

type ScoreTrendChartProps = {
  data: ScoreHistoryPoint[]
  className?: string
}

/** 近 3 个月趋势：双折线 SVG（无第三方依赖） */
export function ScoreTrendChart({ data, className = "" }: ScoreTrendChartProps) {
  const pts = data.length >= 2 ? data : [...data, ...data]
  const w = 280
  const h = 120
  const pad = 8
  const max = 10
  const min = 0
  const n = pts.length
  const xAt = (i: number) => pad + (i / Math.max(1, n - 1)) * (w - pad * 2)
  const yAt = (v: number) => pad + (1 - (v - min) / (max - min)) * (h - pad * 2)

  const line = (key: "trueFriend" | "surface") =>
    pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(p[key]).toFixed(1)}`)
      .join(" ")

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[320px]" aria-hidden>
        <defs>
          <linearGradient id="tfGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#66BB6A" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#66BB6A" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 5, 10].map((tick) => (
          <line
            key={tick}
            x1={pad}
            x2={w - pad}
            y1={yAt(tick)}
            y2={yAt(tick)}
            stroke="#e9dfd0"
            strokeWidth="1"
          />
        ))}
        <path d={line("trueFriend")} fill="none" stroke="#66BB6A" strokeWidth="2" strokeLinecap="round" />
        <path d={line("surface")} fill="none" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
      </svg>
      <div className="mt-ds-xs flex flex-wrap gap-ds-xs text-ds-caption text-soft">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-4 rounded-sm bg-[#66BB6A]" />
          真朋友指数
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-0.5 w-4 border-t-2 border-dashed border-[#BDBDBD]" />
          表面关系指数
        </span>
      </div>
    </div>
  )
}
