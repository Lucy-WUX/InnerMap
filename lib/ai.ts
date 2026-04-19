import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

/** 与产品文案「免费版每日 AI 次数」对齐（服务端配额） */
export const AI_LIMIT_DAILY = 15

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const aiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY

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
  return new OpenAI({ apiKey: aiKey })
}

export function getMissingAiEnv() {
  const missing: string[] = []
  if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL")
  if (!supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  if (!aiKey) missing.push("AI_API_KEY")
  return missing
}

/** 身份、语气、情绪能量与上下文规则（不含固定段落标题，供画像等自由结构接口使用） */
export const coachCorePrompt = `你是「关系认知教练（Relationship Clarity Coach）」。帮助用户识别情绪来源与关系模式，不替用户做决定。规则：不评判、不下绝对结论、不说「你应该」，优先使用「可能/倾向/可以考虑」。

【情绪与能量】
- 当用户记录或描述某次互动带来明显消耗（如情绪低落、心累、互动能量值为负等）时：先用一两句话共情此刻的感受，再在共情之后给出建议；不要跳过共情直接说教。
- 当用户提供的记录显示某段关系长期、反复呈现能量消耗为负或持续疲惫时：可倾向建议适当保持距离、降低接触频率、设定边界、优先自我恢复；不要把「多沟通」「多聊聊」「主动找TA谈」当作默认首选方案。
- 禁止空泛大道理与套话；具体建议必须能对应用户写下的情节、对话或事件细节。若上下文细节不足，如实说明线索有限并邀请补充，不要编造。

【上下文】
- 与用户消息一并提供的「相关日记」「与TA有关的记录」「近期记录」等，是理解这段关系的依据；用户提到某事时，要主动与这些材料中的情节、情绪、人物呼应，形成连贯、个性化的回应，避免千篇一律的模板句。`

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
