import type { RelationContact } from "../components/app/types"

/** 关系页环形图 / 列表：与「真朋友 / 需观察 / 表面关系」三分法一致，由真实联系人评分推导 */
export type RelationHealthBucket = {
  label: string
  count: number
  color: string
  /** 占全部联系人的百分比 0–100 */
  ratio: number
}

export function computeRelationHealthBuckets(contacts: RelationContact[]): RelationHealthBucket[] {
  const palette = [
    { label: "真朋友", color: "#66BB6A" },
    { label: "需观察", color: "#FFA726" },
    { label: "表面关系", color: "#BDBDBD" },
  ] as const
  if (contacts.length === 0) {
    return palette.map((p) => ({ ...p, count: 0, ratio: 0 }))
  }
  let highTrust = 0
  let surfaceLean = 0
  let observe = 0
  for (const c of contacts) {
    if (c.trueFriendScore >= 7.5) highTrust++
    else if (c.surfaceRelationScore >= 6) surfaceLean++
    else observe++
  }
  const counts = [highTrust, observe, surfaceLean]
  const n = contacts.length
  const ratios = counts.map((c) => Math.floor((100 * c) / n))
  const remainder = 100 - ratios.reduce((a, b) => a + b, 0)
  const frac = counts.map((c, i) => ({ i, rem: (100 * c) / n - ratios[i] }))
  frac.sort((a, b) => b.rem - a.rem)
  for (let k = 0; k < remainder; k++) {
    ratios[frac[k % frac.length].i]++
  }
  return palette.map((p, i) => ({
    label: p.label,
    color: p.color,
    count: counts[i],
    ratio: ratios[i],
  }))
}

export type ScoreHistoryPoint = {
  date: string
  trueFriend: number
  surface: number
}

export type InteractionLogLike = {
  contactId: string
  date: string
  type: string
  energy: number
  what: string
  meaningful?: boolean
}

export type WeeklyDigest = {
  weekLabel: string
  interactionCount: number
  topScoreMovers: { contactId: string; name: string; delta: string }[]
  topEnergyDrains: { contactId: string; name: string; sumEnergy: number; hint: string }[]
  focusNextWeek: { contactId: string; name: string; reason: string }[]
}

export type EnergyAlert = {
  contactId: string
  name: string
  reason: string
}

export type TrueFriendReport = {
  support: string[]
  against: string[]
  summary: string
}

export function clampScore(value: number) {
  return Math.min(10, Math.max(0, Math.round(value * 10) / 10))
}

/** 为每位联系人生成近 3 个月趋势锚点（确定性，无 random；仅在有联系人数据时使用） */
export function seedScoreHistory(contacts: RelationContact[]): Record<string, ScoreHistoryPoint[]> {
  const out: Record<string, ScoreHistoryPoint[]> = {}
  const now = new Date()
  for (const c of contacts) {
    const pts: ScoreHistoryPoint[] = []
    for (let m = 2; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 15)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-15`
      const drift = (2 - m) * 0.35
      pts.push({
        date: iso,
        trueFriend: clampScore(c.trueFriendScore - drift),
        surface: clampScore(c.surfaceRelationScore + drift * 0.45),
      })
    }
    pts.push({
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
      trueFriend: c.trueFriendScore,
      surface: c.surfaceRelationScore,
    })
    out[c.id] = pts
  }
  return out
}

export function buildPatternSummary(contactName: string, logs: InteractionLogLike[]): string {
  if (logs.length === 0) return `记录与 ${contactName} 的互动后，观系会为你总结相处模式。`
  const n = logs.length
  const neg = logs.filter((l) => l.energy < 0).length
  const strongNeg = logs.filter((l) => l.energy <= -2).length
  const pos = logs.filter((l) => l.energy > 0).length
  const avg = logs.reduce((s, l) => s + l.energy, 0) / n
  const conflictish = logs.filter((l) => /吵|冲突|争执/.test(l.type + l.what)).length
  const meetish = logs.filter((l) => /见面|吃饭/.test(l.type)).length

  if (strongNeg >= 3 && neg >= n * 0.6) {
    return `你和 ${contactName} 的相处模式偏「高消耗型」：近 ${n} 次里 ${neg} 次为负向能量，其中多次 ≤-2，需要优先照顾自己的情绪边界。`
  }
  if (avg < -0.5) {
    return `你和 ${contactName} 的相处模式偏「付出承压型」：平均能量 ${avg.toFixed(1)}，负向互动占比 ${Math.round((neg / n) * 100)}%。`
  }
  if (pos >= n * 0.65 && meetish >= 1) {
    return `你和 ${contactName} 的相处模式偏「线下高质量型」：正向互动多，且有见面/吃饭类深度场景。`
  }
  if (conflictish >= 2) {
    return `你和 ${contactName} 的相处模式偏「摩擦显性型」：记录里多次出现冲突/争执线索，适合练习更直接的表达与暂停策略。`
  }
  return `你和 ${contactName} 的相处模式整体「波动适中」：正向 ${pos} 次、负向 ${neg} 次，可继续观察能量走向。`
}

function parseLocalDate(d: string) {
  const [y, m, day] = d.split("-").map(Number)
  return new Date(y, m - 1, day)
}

/** 产品可调：连续负向次数阈值、时间窗口（天） */
const ENERGY_ALERT_CONSECUTIVE_NEG = 4
const ENERGY_ALERT_MAX_SPAN_DAYS = 60
const ENERGY_ALERT_THRESHOLD = -2

/** 红色预警（收紧）：连续多次强负向，且落在时间窗口内，避免陈旧记录误报 */
export function computeEnergyAlerts(
  contacts: RelationContact[],
  logs: InteractionLogLike[]
): EnergyAlert[] {
  const MS_PER_DAY = 86400000
  const byContact = new Map<string, InteractionLogLike[]>()
  for (const l of logs) {
    const arr = byContact.get(l.contactId) ?? []
    arr.push(l)
    byContact.set(l.contactId, arr)
  }
  const alerts: EnergyAlert[] = []
  for (const [cid, arr] of byContact) {
    const sorted = [...arr].sort((a, b) => b.date.localeCompare(a.date))
    const streak = sorted.slice(0, ENERGY_ALERT_CONSECUTIVE_NEG)
    if (
      streak.length < ENERGY_ALERT_CONSECUTIVE_NEG ||
      !streak.every((l) => l.energy <= ENERGY_ALERT_THRESHOLD)
    ) {
      continue
    }
    const tNew = parseLocalDate(streak[0].date).getTime()
    const tOld = parseLocalDate(streak[ENERGY_ALERT_CONSECUTIVE_NEG - 1].date).getTime()
    if (tNew - tOld > ENERGY_ALERT_MAX_SPAN_DAYS * MS_PER_DAY) continue
    const c = contacts.find((x) => x.id === cid)
    alerts.push({
      contactId: cid,
      name: c?.name ?? "该联系人",
      reason: `最近连续 ${ENERGY_ALERT_CONSECUTIVE_NEG} 次互动能量均 ≤${ENERGY_ALERT_THRESHOLD}（约 ${ENERGY_ALERT_MAX_SPAN_DAYS} 天内），持续消耗明显，建议减少非必要沟通并设定回复边界。`,
    })
  }
  return alerts
}

/**
 * 仅在每周一展示；统计区间为「上一完整自然周」上周一 00:00～上周日 24:00（避免周一当天周数据几乎为空）。
 * 非周一返回 null，首页不展示周报卡片。
 */
export function computeWeeklyDigest(
  contacts: RelationContact[],
  logs: InteractionLogLike[],
  now = new Date()
): WeeklyDigest | null {
  if (now.getDay() !== 1) return null

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const thisMonday = new Date(today)
  const lastMonday = new Date(thisMonday)
  lastMonday.setDate(thisMonday.getDate() - 7)
  lastMonday.setHours(0, 0, 0, 0)
  const lastSunday = new Date(lastMonday)
  lastSunday.setDate(lastMonday.getDate() + 6)
  lastSunday.setHours(23, 59, 59, 999)

  const weekLabel = `上周 ${lastMonday.getMonth() + 1}/${lastMonday.getDate()}–${lastSunday.getMonth() + 1}/${lastSunday.getDate()}`

  const weekLogs = logs.filter((l) => {
    const t = parseLocalDate(l.date).getTime()
    return t >= lastMonday.getTime() && t <= lastSunday.getTime()
  })

  const byContactEnergy = new Map<string, number>()
  for (const l of weekLogs) {
    byContactEnergy.set(l.contactId, (byContactEnergy.get(l.contactId) ?? 0) + l.energy)
  }
  const topEnergyDrains = [...byContactEnergy.entries()]
    .filter(([, sum]) => sum < 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([id, sumEnergy]) => {
      const c = contacts.find((x) => x.id === id)
      return {
        contactId: id,
        name: c?.name ?? id,
        sumEnergy,
        hint: sumEnergy <= -6 ? "消耗集中，建议本周做一次复盘" : "留意沟通节奏与期待管理",
      }
    })

  const scoreDelta = new Map<string, number>()
  for (const l of weekLogs) {
    const delta = l.energy * 0.12
    scoreDelta.set(l.contactId, (scoreDelta.get(l.contactId) ?? 0) + delta)
  }
  const topScoreMovers = [...scoreDelta.entries()]
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 3)
    .map(([id, d]) => {
      const c = contacts.find((x) => x.id === id)
      const sign = d >= 0 ? "+" : ""
      return { contactId: id, name: c?.name ?? id, delta: `${sign}${d.toFixed(1)}` }
    })

  const lastByContact = new Map<string, string>()
  for (const l of [...logs].sort((a, b) => b.date.localeCompare(a.date))) {
    if (!lastByContact.has(l.contactId)) lastByContact.set(l.contactId, l.date)
  }
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - 14)
  const focusNextWeek = contacts
    .filter((c) => {
      const last = lastByContact.get(c.id)
      if (!last) return true
      return parseLocalDate(last) < cutoff
    })
    .slice(0, 3)
    .map((c) => ({
      contactId: c.id,
      name: c.name,
      reason: lastByContact.has(c.id) ? "已超过 14 天无互动记录" : "尚未记录过互动，适合主动一次轻量问候",
    }))

  return {
    weekLabel,
    interactionCount: weekLogs.length,
    topScoreMovers,
    topEnergyDrains,
    focusNextWeek,
  }
}

export function buildTrueFriendReport(contact: RelationContact, logs: InteractionLogLike[]): TrueFriendReport {
  const support: string[] = []
  const against: string[] = []
  if (contact.trueFriendScore >= 7.5) support.push(`真朋友指数维持高位（${contact.trueFriendScore.toFixed(1)}/10），整体信任基础较好。`)
  if (logs.filter((l) => l.energy > 0).length >= logs.length * 0.5 && logs.length >= 2) {
    support.push("历史互动中正向能量占比过半，说明相处体验总体偏滋养。")
  }
  if (logs.some((l) => /帮助|被帮助|送礼/.test(l.type))) {
    support.push("存在互助/馈赠类互动，关系不止停留在表层寒暄。")
  }
  if (contact.surfaceRelationScore >= 6) against.push(`表面关系指数偏高（${contact.surfaceRelationScore.toFixed(1)}/10），事务性/礼貌性成分可能较多。`)
  if (logs.filter((l) => l.energy < 0).length >= 3) against.push("多次负向能量记录，需警惕长期情绪透支。")
  if (logs.filter((l) => /吵|冲突/.test(l.type + l.what)).length >= 2) against.push("冲突类互动重复出现，沟通模式可能需要升级。")
  if (support.length === 0) support.push("样本仍偏少：多记录几次互动后，证据链会更完整。")
  if (against.length === 0) against.push("暂未发现强风险信号：继续保持记录习惯即可。")
  const summary =
    contact.trueFriendScore >= contact.surfaceRelationScore + 3
      ? "综合判断：更像「有情感厚度」的关系，但请以你的感受为准。"
      : "综合判断：仍在「真朋友 vs 表面关系」之间摇摆，建议用 2–3 周的小实验验证。"
  return { support, against, summary }
}
