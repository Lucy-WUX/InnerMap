import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

/** 与产品文案「免费版每日 AI 次数」对齐（服务端配额） */
export const AI_LIMIT_DAILY = 15

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const aiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
const aiBaseUrl = process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL
const aiModel = process.env.AI_MODEL

function getAiSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY。请在 Vercel 项目环境变量中配置。"
    )
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export function getAiClient() {
  if (!aiKey) return null
  return new OpenAI({
    apiKey: aiKey,
    ...(aiBaseUrl ? { baseURL: aiBaseUrl } : {}),
  })
}

export function getAiModel(fallback = "gpt-4o-mini") {
  if (aiModel?.trim()) return aiModel.trim()
  if (aiBaseUrl?.toLowerCase().includes("deepseek")) return "deepseek-chat"
  return fallback
}

export function getAiRuntimeInfo() {
  const provider = aiBaseUrl?.toLowerCase().includes("deepseek") ? "deepseek" : "openai-compatible"
  return {
    provider,
    model: getAiModel(),
    hasApiKey: Boolean(aiKey),
    hasBaseUrl: Boolean(aiBaseUrl),
    baseUrlPreview: aiBaseUrl ? aiBaseUrl.replace(/\/+$/, "") : null,
  }
}

export function getMissingAiEnv() {
  const missing: string[] = []
  if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL")
  if (!supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  if (!aiKey) missing.push("AI_API_KEY")
  return missing
}

/** 身份、语气、情绪能量与上下文规则（不含固定段落标题，供画像等自由结构接口使用） */
export const coachCorePrompt = `你是「晓观」，一位以心理咨询视角工作的关系教练，聚焦人际关系与亲密关系分析。你的目标是：帮助用户理解情绪、识别互动模式、看见边界与需求，并给出可执行但不强迫的建议。

【角色原则】
- 共情优先：先接住感受，再讨论方法。
- 中立不评判：不贴标签，不道德审判，不替用户做人生决定。
- 去绝对化：避免“肯定/一定/必须”；优先使用“可能/倾向/可以考虑”。
- 具体化：建议必须对应用户提供的事件、对话、频率、情绪变化；不得空话。

【分析框架（优先用于人际/亲密关系）】
- 触发事件：这次冲突或失落由什么触发。
- 情绪与需求：情绪背后未被满足的需求（安全感、被看见、尊重、边界、承诺、稳定等）。
- 互动循环：识别常见循环（追-逃、冷战-爆发、讨好-压抑、控制-反抗、忽视-过度解释）。
- 关系信号：区分短期摩擦与长期模式；关注一致性、兑现度、情绪恢复速度。
- 行动建议：给出1-3步可执行动作（表达模板、边界句式、观察周期、止损条件）。

【亲密关系专用要求】
- 可结合依恋倾向做“假设性”解释（如焦虑/回避倾向），但不得下诊断结论。
- 给沟通建议时，优先使用非暴力沟通结构：观察-感受-需要-请求。
- 必要时提醒“关系边界”：例如减少高频拉扯、暂停争执、明确底线与不可接受行为。

【风险分级】
- 若出现长期贬低、羞辱、威胁、控制、经济限制、社交隔离、跟踪监控、肢体暴力等线索，需明确提醒风险并建议优先保障安全、寻求现实支持。
- 你不是医疗或法律诊断系统；涉及自伤、伤人、暴力威胁时，建议立即联系当地紧急援助与可信赖的现实支持系统。

【输出风格】
- 简洁、温和、专业，像一位克制的咨询师，而非鸡汤博主。
- 每次回答尽量给到“一个可马上执行的小步骤”。
- 信息不足时，明确说明“线索不足”，并提出1-2个高价值追问，不编造细节。

【上下文使用】
- 与用户消息一并提供的“相关日记”“与TA有关记录”“近期记录”是核心依据。
- 回答时需主动引用上下文中的关键细节（事件、时间、情绪、人物）以保持个性化一致性。`

/** 在五段式分析类接口中使用（聊天速览、关系分析、日记快评等） */
export const structuredCoachPrompt = `${coachCorePrompt}

输出必须包含以下五段标题（保持顺序）：【情绪识别】【关系模式】【可能的另一种视角】【风险提示】【建议方向】。总字数100字以内。`

/** @deprecated 使用 structuredCoachPrompt；保留导出以免外部引用断裂 */
export const basePrompt = structuredCoachPrompt

export async function consumeDailyQuota(userId: string) {
  const aiSupabase = getAiSupabase()
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await aiSupabase
    .from("ai_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    const { error: insertError } = await aiSupabase.from("ai_usage").insert({
      user_id: userId,
      count: 1,
      date: today,
    })
    if (insertError) throw insertError
    return { allowed: true, remaining: AI_LIMIT_DAILY - 1 }
  }

  if (data.count >= AI_LIMIT_DAILY) {
    return { allowed: false, remaining: 0 }
  }

  const { error: updateError } = await aiSupabase
    .from("ai_usage")
    .update({ count: data.count + 1 })
    .eq("id", data.id)
  if (updateError) throw updateError
  return { allowed: true, remaining: AI_LIMIT_DAILY - (data.count + 1) }
}

export async function getRecentEntryContext(userId: string) {
  const aiSupabase = getAiSupabase()
  const { data, error } = await aiSupabase
    .from("entries")
    .select("content,mood,people_tag,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5)
  if (error) throw error
  return (
    data
      ?.map((item) => `- ${item.content}（情绪:${item.mood}${item.people_tag ? ` 人物:${item.people_tag}` : ""}）`)
      .join("\n") || "- 暂无记录"
  )
}

export async function getTodayRemaining(userId: string) {
  const aiSupabase = getAiSupabase()
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await aiSupabase
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle()
  if (error) throw error
  const used = data?.count ?? 0
  return Math.max(0, AI_LIMIT_DAILY - used)
}
