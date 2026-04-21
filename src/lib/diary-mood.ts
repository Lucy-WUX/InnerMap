export const DIARY_MOOD_PRESETS = ["愉悦", "平静", "低落", "愤怒"] as const
export type DiaryMoodPreset = (typeof DIARY_MOOD_PRESETS)[number]

export const DIARY_CUSTOM_MOOD_MAX_LEN = 24

export function isPresetMood(value: string): value is DiaryMoodPreset {
  return (DIARY_MOOD_PRESETS as readonly string[]).includes(value)
}

/** 日历圆点颜色：预设四色 + 自定义紫色 + 无心情浅灰 */
export function diaryMoodDotClass(mood: string | null | undefined): string {
  const m = mood?.trim() ?? ""
  if (!m) return "bg-[#94A3B8]"
  switch (m) {
    case "愉悦":
      return "bg-[#66BB6A]"
    case "平静":
      return "bg-[#BDBDBD]"
    case "低落":
      return "bg-[#60A5FA]"
    case "愤怒":
      return "bg-[#EF5350]"
    default:
      return "bg-[#A78BFA]"
  }
}

export function normalizeCustomMoodInput(raw: string): string {
  const t = raw.trim().slice(0, DIARY_CUSTOM_MOOD_MAX_LEN)
  if (!t) return ""
  if (isPresetMood(t)) return t
  return t
}
