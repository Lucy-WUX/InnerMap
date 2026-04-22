export const DIARY_MOOD_PRESETS = ["愉悦", "平静", "低落", "愤怒"] as const
export type DiaryMoodPreset = (typeof DIARY_MOOD_PRESETS)[number]

export const DIARY_CUSTOM_MOOD_MAX_LEN = 24

export function isPresetMood(value: string): value is DiaryMoodPreset {
  return (DIARY_MOOD_PRESETS as readonly string[]).includes(value)
}

/** 日历格底部：仅在有心情时显示图标（与编辑器预设一致；自定义心情用 ✨） */
export function diaryMoodCalendarIcon(mood: string | null | undefined): string | null {
  const m = mood?.trim() ?? ""
  if (!m) return null
  switch (m) {
    case "愉悦":
      return "😊"
    case "平静":
      return "😐"
    case "低落":
      return "😞"
    case "愤怒":
      return "😠"
    default:
      return "✨"
  }
}

export function normalizeCustomMoodInput(raw: string): string {
  const t = raw.trim().slice(0, DIARY_CUSTOM_MOOD_MAX_LEN)
  if (!t) return ""
  if (isPresetMood(t)) return t
  return t
}
