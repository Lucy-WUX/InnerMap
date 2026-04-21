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
    title: "🔥 终身 Pro+",
    price: "¥499",
    originalPrice: "¥999",
    saveText: "省 50%",
    subtitle: "【最推荐】一次付费，终身陪伴，永久更新",
    quote: "适合打算长期使用，想要一次买断无任何后顾之忧的用户",
    bullets: [
      "解锁所有 Pro 版功能",
      "永久免费获得未来所有新增高级功能",
      "永久免费多设备云同步",
      "优先体验内测新功能",
      "专属客服支持",
    ],
  },
  {
    key: "year",
    title: "📅 年付 Pro",
    price: "¥199",
    originalPrice: "¥299",
    saveText: "省 33%",
    subtitle: "约 ¥16.5 / 月，性价比之选",
    quote: "适合想要先体验一年，再决定是否终身的用户",
    bullets: ["解锁所有 Pro 版功能", "有效期内免费更新", "包含多设备云同步", "支持随时升级为终身版，补差价即可"],
  },
  {
    key: "quarter",
    title: "🌿 季付 Pro",
    price: "¥59",
    subtitle: "灵活付费，无压力",
    quote: "适合短期内有大量关系复盘需求的用户",
    bullets: ["解锁所有 Pro 版功能", "有效期内免费更新", "包含多设备云同步", "支持随时升级为年付 / 终身版"],
  },
  {
    key: "month",
    title: "🌟 月付 Pro",
    price: "¥25",
    subtitle: "按月付费，随时取消",
    quote: "适合想要先试用一个月，体验 Pro 版功能的用户",
    bullets: ["解锁所有 Pro 版功能", "有效期内免费更新", "包含多设备云同步", "无自动续费，到期自动失效"],
  },
]

export const FEATURE_ROWS = [
  ["解锁所有 Pro 版功能", "✅", "✅", "✅", "✅"],
  ["未来新增高级功能", "✅", "-", "-", "-"],
  ["多设备云同步", "✅", "✅", "✅", "✅"],
  ["支持升级到更高档方案", "✅", "✅", "✅", "-"],
  ["专属客服支持", "✅", "-", "-", "-"],
] as const

export const TRUST_PROMISES = [
  { title: "永久免费可用", desc: "你可以长期使用免费版，不会被强制付费。" },
  { title: "数据属于用户", desc: "你的关系记录归你所有，可随时导出与迁移。" },
  { title: "本地优先存储", desc: "默认本地保存，使用体验清晰可控。" },
  { title: "价格透明清楚", desc: "四档方案公开说明，不做隐性营销设计。" },
] as const

export const PLAN_TITLE_MAP: Record<PlanKey, string> = {
  lifetime: "终身 Pro+",
  year: "年付 Pro",
  quarter: "季付 Pro",
  month: "月付 Pro",
}

export function getPlanByKey(plan: string) {
  return PRICING_PLANS.find((item) => item.key === plan)
}
