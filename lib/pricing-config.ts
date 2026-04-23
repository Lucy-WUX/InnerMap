export type PlanKey = "lifetime" | "year" | "quarter" | "month"
export type PayChannel = "wechat" | "alipay" | "stripe"

export type PricingPlan = {
  key: PlanKey
  title: string
  price: string
  originalPrice?: string
  saveText?: string
  subtitle: string
  quote: string
  bullets: string[]
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    key: "lifetime",
    title: "🥘 一席暖心家宴",
    price: "¥499",
    subtitle: "一生挚友",
    quote: "谢谢你愿意把我当成一辈子的同行人。",
    bullets: [
      "永久解锁全部专属陪伴功能",
      "未来所有陪伴功能更新持续可用",
      "多设备同步，长期稳定陪伴",
      "适合想长期安心使用、无后顾之忧的你",
    ],
  },
  {
    key: "year",
    title: "🌸 一整个四季的花束",
    price: "¥199",
    subtitle: "四季相伴",
    quote: "谢谢你愿意陪我走过一整个春夏秋冬。",
    bullets: [
      "解锁一整年的专属陪伴权限",
      "完整记录每段互动与情绪变化",
      "适合想系统体验全年关系复盘的你",
      "可后续升级为一生挚友档位",
    ],
  },
  {
    key: "quarter",
    title: "☕ 三杯手冲暖心咖啡",
    price: "¥59",
    subtitle: "一季同行",
    quote: "谢谢你愿意给我三个月时间，陪你走过需要梳理的日子。",
    bullets: [
      "解锁三个月专属陪伴权限",
      "适合短期集中复盘与情绪梳理",
      "轻量支持，降低决策压力",
      "可按需要继续升级更长档位",
    ],
  },
  {
    key: "month",
    title: "🌷 一支温柔小花",
    price: "¥25",
    subtitle: "一月同行",
    quote: "谢谢你的这一份小小心意，我会用一整个月认真陪伴来回馈。",
    bullets: [
      "解锁一个月专属陪伴功能",
      "适合先试试晓观陪伴方式的你",
      "按月支持，灵活无负担",
      "不自动续费，到期自动结束",
    ],
  },
]

export const FEATURE_ROWS = [
  ["我会一直在，接住你的关系困扰", "✅", "✅", "✅", "✅"],
  ["未来新陪伴功能第一时间可用", "✅", "-", "-", "-"],
  ["多设备同步，无论你在哪都能继续", "✅", "✅", "✅", "✅"],
  ["后续可升级到更长陪伴档位", "✅", "✅", "✅", "-"],
  ["优先支持与更快响应", "✅", "-", "-", "-"],
] as const

export const TRUST_PROMISES = [
  { title: "陪伴不绑架", desc: "你可以一直使用免费版；是否支持，永远由你自己决定。" },
  { title: "心事归你所有", desc: "你的关系记录属于你，随时可导出、备份与迁移。" },
  { title: "默认克制与安全", desc: "本地优先、按需同步，我会尽量减少打扰与负担。" },
  { title: "心意透明清楚", desc: "四档心意公开说明，不做强迫、不玩套路。" },
] as const

export const PLAN_TITLE_MAP: Record<PlanKey, string> = {
  lifetime: "一席暖心家宴",
  year: "一整个四季的花束",
  quarter: "三杯手冲暖心咖啡",
  month: "一支温柔小花",
}

export function getPlanByKey(plan: string) {
  return PRICING_PLANS.find((item) => item.key === plan)
}
