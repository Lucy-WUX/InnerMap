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
      "AI 询问无限次，随时都能问",
      "永久查看推送：每日/每周/每月/每年关系复盘与日记复盘",
      "未来所有陪伴功能更新持续可用",
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
      "AI 询问无限次，随时都能问",
      "可查看推送：每日/每周/每月/每年关系复盘与日记复盘",
      "完整记录每段互动与情绪变化",
      "适合想系统体验全年复盘节奏的你",
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
      "AI 询问无限次，随时都能问",
      "可查看推送：每日/每周/每月关系复盘与日记复盘",
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
      "AI 询问无限次，随时都能问",
      "可查看推送：每日/每周关系复盘与日记复盘",
      "适合先试试晓观陪伴方式的你",
      "按月支持，灵活无负担",
      "不自动续费，到期自动结束",
    ],
  },
]

export const FEATURE_ROWS = [
  ["AI 询问无限次", "永久", "含", "含", "含"],
  ["关系/日记复盘推送：每日", "永久", "含", "含", "含"],
  ["关系/日记复盘推送：每周", "永久", "含", "含", "含"],
  ["关系/日记复盘推送：每月", "永久", "含", "含", "不含"],
  ["关系/日记复盘推送：每年", "永久", "含", "不含", "不含"],
  ["注册账号即可多设备同步", "免费可用", "免费可用", "免费可用", "免费可用"],
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
