import Link from "next/link"
import { CalendarDays, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react"

import type { EnergyAlert, WeeklyDigest } from "../../lib/relationship-ai-demo"
import { isProSubscriber } from "../../lib/product-limits"
import {
  DIARY_CUSTOM_MOOD_MAX_LEN,
  diaryMoodCalendarIcon,
  isPresetMood,
  normalizeCustomMoodInput,
} from "../../lib/diary-mood"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Textarea } from "../ui/textarea"
import type { RelationContact } from "./types"

type CalendarCell = {
  day: number
  dateValue: string
  hasRecord: boolean
  isToday: boolean
  emotion: string | null
} | null

type HomeSectionProps = {
  monthLabel: string
  viewYear: number
  viewMonth: number
  formatMonthValue: (date: Date) => string
  setDiaryViewMonth: (value: string) => void
  setDiarySelectedDate: (value: string) => void
  calendarFadeIn: boolean
  calendarCells: CalendarCell[]
  diarySelectedDate: string
  monthTimeline: [string, string][]
  diaryViewMode: "calendar" | "list"
  setDiaryViewMode: Dispatch<SetStateAction<"calendar" | "list">>
  diarySearchQuery: string
  setDiarySearchQuery: Dispatch<SetStateAction<string>>
  diarySearchResults: [string, string][]
  totalDiaryCount: number
  diaryEmotion: string
  setDiaryEmotion: (value: string) => void
  diaryEditorText: string
  setDiaryEditorText: (value: string) => void
  mentionKeyword: string | null
  mentionSuggestions: RelationContact[]
  mentionActiveIndex: number
  setMentionActiveIndex: Dispatch<SetStateAction<number>>
  insertDiaryMention: (name: string) => void
  linkedContacts: string[]
  linkedContactItems: RelationContact[]
  contacts: RelationContact[]
  onJumpToContact: (contactId: string) => void
  onOpenAiPage: () => void
  diarySaveTip: string
  diarySaving: boolean
  handleSaveDiary: () => void
  handleDeleteDiary: (dateKey: string) => void
  weeklyDigest: WeeklyDigest | null
  energyAlerts: EnergyAlert[]
  storageScope?: string
}

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

const DAILY_LIMIT = 15

function usageStorageKey(scope: string) {
  return `xiaoguan-usage:${scope}`
}

function chatStorageKey(scope: string) {
  return `xiaoguan-chat:${scope}`
}

function todayToken() {
  return new Date().toISOString().slice(0, 10)
}

export function HomeSection(props: HomeSectionProps) {
  const {
    monthLabel,
    viewYear,
    viewMonth,
    formatMonthValue,
    setDiaryViewMonth,
    setDiarySelectedDate,
    calendarFadeIn,
    calendarCells,
    diarySelectedDate,
    monthTimeline,
    diaryViewMode,
    setDiaryViewMode,
    diarySearchQuery,
    setDiarySearchQuery,
    diarySearchResults,
    totalDiaryCount,
    contacts,
    energyAlerts,
    linkedContactItems,
    linkedContacts,
    onJumpToContact,
    onOpenAiPage,
    diaryEmotion,
    setDiaryEmotion,
    diaryEditorText,
    setDiaryEditorText,
    diarySaveTip,
    diarySaving,
    handleSaveDiary,
    handleDeleteDiary,
    mentionKeyword,
    mentionSuggestions,
    mentionActiveIndex,
    setMentionActiveIndex,
    insertDiaryMention,
    storageScope = "guest",
    weeklyDigest,
  } = props

  const diaryTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [customMoodDraft, setCustomMoodDraft] = useState("")
  const [showMentionPicker, setShowMentionPicker] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState("")
  const [freeUsed, setFreeUsed] = useState(0)
  const [showDiaryModal, setShowDiaryModal] = useState(false)

  const pickerSuggestions = useMemo(
    () => contacts.filter((c) => c.name.includes(mentionSearch.trim())).slice(0, 8),
    [contacts, mentionSearch]
  )
  const monthDiaryCount = monthTimeline.length
  const monthMentionedContactCount = useMemo(() => {
    const ids = new Set<string>()
    for (const [, content] of monthTimeline) {
      for (const c of contacts) {
        if (content.includes(`@${c.name}`)) ids.add(c.id)
      }
    }
    return ids.size
  }, [monthTimeline, contacts])

  const isPro = isProSubscriber()
  const freeLeft = Math.max(0, DAILY_LIMIT - freeUsed)
  const hitLimit = !isPro && freeLeft <= 0

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!showDiaryModal) return
      const isSave = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s"
      if (!isSave) return
      event.preventDefault()
      handleSaveDiary()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleSaveDiary, showDiaryModal])

  useEffect(() => {
    if (!showDiaryModal) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      event.preventDefault()
      setShowDiaryModal(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [showDiaryModal])

  useEffect(() => {
    if (!showDiaryModal) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [showDiaryModal])

  useEffect(() => {
    if (diaryEmotion && !isPresetMood(diaryEmotion)) setCustomMoodDraft(diaryEmotion)
    else setCustomMoodDraft("")
  }, [diaryEmotion, diarySelectedDate])

  function insertAtTrigger() {
    const el = diaryTextareaRef.current
    const start = el?.selectionStart ?? diaryEditorText.length
    const end = el?.selectionEnd ?? diaryEditorText.length
    const before = diaryEditorText.slice(0, start)
    const after = diaryEditorText.slice(end)
    const needLeadingSpace = before.length > 0 && !/\s$/.test(before)
    const next = `${before}${needLeadingSpace ? " " : ""}@${after}`
    const caret = before.length + (needLeadingSpace ? 1 : 0) + 1
    setDiaryEditorText(next)
    setShowMentionPicker(true)
    setMentionSearch("")
    requestAnimationFrame(() => {
      const target = diaryTextareaRef.current
      if (!target) return
      target.focus()
      target.setSelectionRange(caret, caret)
    })
  }

  useEffect(() => {
    if (typeof localStorage === "undefined") return
    const historyRaw = localStorage.getItem(chatStorageKey(storageScope))
    if (historyRaw) {
      try {
        setChatMessages(JSON.parse(historyRaw) as ChatMessage[])
      } catch {
        setChatMessages([])
      }
    } else {
      setChatMessages([])
    }
    const usageRaw = localStorage.getItem(usageStorageKey(storageScope))
    if (usageRaw) {
      try {
        const usage = JSON.parse(usageRaw) as { day: string; count: number }
        setFreeUsed(usage.day === todayToken() ? usage.count : 0)
      } catch {
        setFreeUsed(0)
      }
    } else {
      setFreeUsed(0)
    }
  }, [storageScope])

  useEffect(() => {
    if (typeof localStorage === "undefined") return
    localStorage.setItem(chatStorageKey(storageScope), JSON.stringify(chatMessages.slice(-80)))
  }, [chatMessages, storageScope])

  useEffect(() => {
    if (typeof localStorage === "undefined") return
    localStorage.setItem(usageStorageKey(storageScope), JSON.stringify({ day: todayToken(), count: freeUsed }))
  }, [freeUsed, storageScope])

  async function sendMessage() {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    if (hitLimit) {
      setChatError("今日免费对话次数已用完，开通Pro版解锁无限对话")
      return
    }

    setChatError("")
    setChatInput("")
    setChatMessages((prev) => [...prev, { id: `${Date.now()}-u`, role: "user", content: text }])
    setChatLoading(true)

    try {
      const response = await fetch("/api/ai/contact-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: `联系人:${contacts.length}; 预警:${energyAlerts.length}; 日期:${diarySelectedDate}`,
        }),
      })
      const data = (await response.json().catch(() => ({}))) as { reply?: string; error?: string }
      if (!response.ok || !data.reply) {
        setChatError(data.error ?? "晓观暂时无法回复，请稍后再试。")
        return
      }
      setChatMessages((prev) => [...prev, { id: `${Date.now()}-a`, role: "assistant", content: data.reply ?? "" }])
      if (!isPro) setFreeUsed((prev) => prev + 1)
    } catch {
      setChatError("网络连接异常，请稍后重试。")
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <section className="space-y-ds-md pb-28">
      <Card className="rounded-ds border border-warm-base bg-paper p-ds-lg text-center dark:border-stone-700/80">
        <div className="mx-auto h-20 w-20 rounded-full bg-[#d4b79d] dark:bg-stone-700" />
        <h2 className="mt-3 text-ds-title font-semibold text-[#5C4B3E] dark:text-stone-100">晓观 · 你的专属人际关系AI</h2>
        <p className="mt-1 text-ds-body font-medium leading-[1.5] text-[#5C4B3E] dark:text-stone-300">
          看清关系，减少内耗，AI陪伴分析
        </p>
      </Card>

      <Card className="rounded-[16px] border border-warm-base bg-[#F9F5F0] p-ds-lg shadow-[inset_0_1px_6px_rgba(0,0,0,0.04)] dark:border-stone-700/70 dark:bg-stone-900/55 dark:shadow-[inset_0_1px_8px_rgba(0,0,0,0.35)]">
        <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {chatMessages.length === 0 ? (
            <div className="rounded-[16px] rounded-br-sm border border-[#e8d9ca] bg-[#F0E8DE] px-3 py-3 text-ds-body text-[#5C4B3E] shadow-[0_1px_2px_rgba(95,73,53,0.06)] dark:border-stone-600 dark:bg-stone-800/90 dark:text-stone-200 dark:shadow-none">
              <p className="font-medium">你好，我是晓观。</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-ds-caption leading-[1.6] dark:text-stone-400">
                <li>可聊人际困惑、情绪内耗、相处难题。</li>
                <li>我会陪你梳理，并给出适合你的建议。</li>
              </ul>
            </div>
          ) : (
            chatMessages.map((item) => (
              <div key={item.id} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap px-3.5 py-3 shadow-[0_1px_3px_rgba(60,40,30,0.08)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.35)] ${
                    item.role === "user"
                      ? "rounded-[16px] rounded-bl-sm bg-[#6B3F2E] text-[#fffdf9] dark:bg-[#7a4d38]"
                      : "rounded-[16px] rounded-br-sm border border-[#e5d8ca] bg-[#F0E8DE] text-[#5C4B3E] dark:border-stone-600 dark:bg-stone-800/95 dark:text-stone-200"
                  }`}
                >
                  {item.content}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {weeklyDigest ? (
        <Card className="rounded-ds border border-warm-base bg-paper p-ds-md dark:border-stone-700/80">
          <p className="text-ds-body font-semibold text-[#5C4B3E] dark:text-stone-100">📬 人际关系周报 · {weeklyDigest.weekLabel}</p>
          <ul className="mt-ds-xs space-y-1 text-ds-caption text-[#5C4B3E] dark:text-stone-300">
            <li>上周互动次数：{weeklyDigest.interactionCount} 次</li>
            <li>
              关系波动最大：
              {weeklyDigest.topScoreMovers.length
                ? weeklyDigest.topScoreMovers.map((x) => `${x.name}（${x.delta}）`).join("、")
                : "上周暂无足够记录"}
            </li>
            <li>
              能量消耗最高：
              {weeklyDigest.topEnergyDrains.length
                ? weeklyDigest.topEnergyDrains.map((x) => `${x.name}（${x.sumEnergy}）`).join("、")
                : "上周暂无负向汇总"}
            </li>
          </ul>
        </Card>
      ) : null}

      {showDiaryModal ? (
        <div
          className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-[#412f1f]/30 p-3 backdrop-blur-[6px] dark:bg-black/55 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="diary-calendar-modal-title"
          onClick={() => setShowDiaryModal(false)}
        >
          <div
            className="my-4 flex max-h-[min(92dvh,calc(100dvh-1.5rem-env(safe-area-inset-bottom)))] min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-[16px] border border-[#e4d8cb] bg-paper shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:border-stone-700 dark:bg-stone-900 dark:shadow-[0_8px_40px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-warm-soft px-4 py-3 dark:border-stone-700 sm:px-6">
              <div className="min-w-0">
                <h2 id="diary-calendar-modal-title" className="text-ds-title font-semibold text-ink dark:text-stone-100">
                  日记与日历
                </h2>
                <p className="text-ds-caption text-soft dark:text-stone-400">本月 {monthDiaryCount} 篇</p>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-soft transition hover:bg-surface-warm-soft dark:text-stone-400 dark:hover:bg-stone-800"
                aria-label="关闭"
                onClick={() => setShowDiaryModal(false)}
              >
                <X className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-ds-md sm:p-ds-lg">
              <div className="grid gap-ds-md lg:grid-cols-[minmax(0,420px)_1fr]">
              <Card className="rounded-ds border border-warm-base bg-gradient-to-b from-surface-warm-elevated to-surface-warm-soft p-ds-lg dark:border-stone-700/80 dark:from-stone-900 dark:to-stone-900/85">
                <div className="mb-ds-md flex items-center justify-between">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-warm-soft bg-surface-warm-soft text-ds-body text-soft transition hover:bg-surface-warm-hover dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                    onClick={() => {
                      const prevMonth = new Date(viewYear, viewMonth - 2, 1)
                      const nextMonthValue = formatMonthValue(prevMonth)
                      setDiaryViewMonth(nextMonthValue)
                      setDiarySelectedDate(`${nextMonthValue}-01`)
                    }}
                  >
                    ←
                  </button>
                  <div className="text-center">
                    <p className="text-ds-title tracking-wide text-[#5C4B3E] dark:text-stone-100">{monthLabel}</p>
                    <p className="text-ds-caption text-[#5C4B3E] dark:text-stone-400">关系日记日历</p>
                  </div>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-warm-soft bg-surface-warm-soft text-ds-body text-soft transition hover:bg-surface-warm-hover dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                    onClick={() => {
                      const nextMonth = new Date(viewYear, viewMonth, 1)
                      const nextMonthValue = formatMonthValue(nextMonth)
                      setDiaryViewMonth(nextMonthValue)
                      setDiarySelectedDate(`${nextMonthValue}-01`)
                    }}
                  >
                    →
                  </button>
                </div>
                <div className="mb-ds-xs flex items-center justify-between gap-ds-xs">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className={`rounded-btn-ds border px-2 py-1 text-ds-caption ${
                        diaryViewMode === "calendar"
                          ? "border-[#8B5A42] bg-[#f5e7cf] text-[#5C4B3E] dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-100"
                          : "border-warm-soft bg-paper text-[#5C4B3E] dark:border-stone-600 dark:bg-stone-900 dark:text-stone-300"
                      }`}
                      onClick={() => setDiaryViewMode("calendar")}
                    >
                      日历视图
                    </button>
                    <button
                      type="button"
                      className={`rounded-btn-ds border px-2 py-1 text-ds-caption ${
                        diaryViewMode === "list"
                          ? "border-[#8B5A42] bg-[#f5e7cf] text-[#5C4B3E] dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-100"
                          : "border-warm-soft bg-paper text-[#5C4B3E] dark:border-stone-600 dark:bg-stone-900 dark:text-stone-300"
                      }`}
                      onClick={() => setDiaryViewMode("list")}
                    >
                      列表视图
                    </button>
                  </div>
                  <input
                    className="max-w-[11rem] rounded-btn-ds border border-warm-soft bg-paper px-2 py-1 text-ds-caption text-[#5C4B3E] placeholder:text-[#9c8f83] dark:border-stone-600 dark:bg-stone-900 dark:text-stone-300 dark:placeholder:text-stone-500"
                    placeholder="搜索日记/联系人"
                    value={diarySearchQuery}
                    onChange={(e) => setDiarySearchQuery(e.target.value)}
                  />
                </div>
                {diaryViewMode === "list" ? (
                  <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                    {diarySearchResults.length > 0 ? (
                      diarySearchResults.map(([dateKey, content]) => (
                        <div key={dateKey} className="rounded-ds border border-warm-soft bg-paper p-ds-xs dark:border-stone-600 dark:bg-stone-900/80">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              className="text-ds-caption font-medium text-[#5C4B3E] underline-offset-2 hover:underline dark:text-stone-200"
                              onClick={() => {
                                setDiarySelectedDate(dateKey)
                                setDiaryViewMode("calendar")
                              }}
                            >
                              {dateKey}
                            </button>
                            <button type="button" className="text-ds-caption text-[#B42318]" onClick={() => handleDeleteDiary(dateKey)}>
                              删除
                            </button>
                          </div>
                          <p className="mt-1 line-clamp-3 text-ds-caption text-[#5C4B3E] dark:text-stone-400">{content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-ds-caption text-[#5C4B3E] dark:text-stone-400">
                        {totalDiaryCount === 0 ? "记录你的人际感悟；若选择心情，保存后日历上会显示对应图标。" : "暂无匹配日记"}
                      </p>
                    )}
                  </div>
                ) : null}
                {diaryViewMode === "calendar" ? (
                  <>
                    <div className="grid grid-cols-7 gap-ds-xs text-center text-ds-caption text-[#5C4B3E] dark:text-stone-400">
                      {["日", "一", "二", "三", "四", "五", "六"].map((w) => (
                        <div key={w} className="py-1 font-medium tracking-wide">
                          {w}
                        </div>
                      ))}
                    </div>
                    <div
                      className="mt-ds-xs grid grid-cols-7 gap-ds-xs text-center transition-all duration-300"
                      style={{ opacity: calendarFadeIn ? 1 : 0.45, transform: calendarFadeIn ? "translateY(0)" : "translateY(4px)" }}
                    >
                      {calendarCells.map((cell, idx) =>
                        cell ? (
                          <button
                            key={cell.dateValue}
                            type="button"
                            className={`relative h-14 rounded-2xl border text-[30px] leading-none transition-all duration-200 ${
                              diarySelectedDate === cell.dateValue
                                ? "border-[#8B5A42] bg-[#f5e7cf] text-soft shadow-[0_6px_16px_rgba(139,90,66,0.18)] dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-100 dark:shadow-none"
                                : cell.hasRecord
                                  ? "border-warm-strong bg-surface-warm-elevated text-soft shadow-[0_2px_8px_rgba(95,73,53,0.08)] dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:shadow-none"
                                  : "border-warm-soft bg-paper text-muted hover:border-warm-strong hover:bg-surface-warm-soft dark:border-stone-700 dark:bg-stone-900 dark:text-stone-500 dark:hover:border-stone-500 dark:hover:bg-stone-800"
                            }`}
                            onClick={() => setDiarySelectedDate(cell.dateValue)}
                          >
                            <div className="flex h-full flex-col items-center justify-center">
                              <span
                                className={`font-light tabular-nums tracking-[-0.03em] text-[34px] ${cell.isToday ? "flex h-8 w-8 items-center justify-center rounded-full bg-[#8B5A42] text-[20px] font-medium tracking-normal text-[#fffdf9]" : ""}`}
                              >
                                {cell.day}
                              </span>
                              {(() => {
                                const moodIcon = diaryMoodCalendarIcon(cell.emotion)
                                return moodIcon ? (
                                  <span
                                    className="pointer-events-none absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[13px] leading-none"
                                    title={`心情：${cell.emotion?.trim() ?? ""}`}
                                  >
                                    {moodIcon}
                                  </span>
                                ) : null
                              })()}
                            </div>
                          </button>
                        ) : (
                          <div key={`empty-${idx}`} className="h-14" />
                        )
                      )}
                    </div>
                  </>
                ) : null}
                <div className="mt-ds-md rounded-ds border border-warm-soft bg-surface-warm-soft p-ds-md dark:border-stone-600 dark:bg-stone-800/55">
                  <p className="mb-ds-xs text-ds-caption font-medium text-[#5C4B3E] dark:text-stone-200">本月记录摘要</p>
                  {monthTimeline.length > 0 ? (
                    monthTimeline.map(([dateKey, note]) => (
                      <p key={dateKey} className="text-ds-caption text-[#5C4B3E] dark:text-stone-400">
                        {dateKey.slice(5)}：{note}
                      </p>
                    ))
                  ) : (
                    <p className="text-ds-caption text-[#5C4B3E] dark:text-stone-500">本月暂无日记记录</p>
                  )}
                </div>
              </Card>

              <div className="space-y-ds-md">
                <Card className="rounded-ds border border-warm-base bg-paper p-ds-lg dark:border-stone-700/80 dark:bg-stone-900/60">
                  <div className="flex items-center justify-between text-ds-body text-[#5C4B3E] dark:text-stone-300">
                    <p>本月记录：{monthDiaryCount} 篇</p>
                    <p>提及联系人：{monthMentionedContactCount} 人</p>
                  </div>
                </Card>

                <Card className="rounded-ds border border-warm-base bg-paper p-ds-lg dark:border-stone-700/80 dark:bg-stone-900/60">
                  <p className="text-[24px] font-semibold text-[#5C4B3E] dark:text-stone-100">{diarySelectedDate}</p>
                  {totalDiaryCount === 0 ? (
                    <p className="mt-ds-xs rounded-ds border border-dashed border-warm-soft bg-surface-warm-soft px-3 py-2 text-ds-caption text-[#5C4B3E] dark:border-stone-600 dark:bg-stone-800/55 dark:text-stone-400">
                      记录你的人际感悟；若选择心情，保存后可在日历上查看对应图标。
                    </p>
                  ) : null}
                  <div className="mt-ds-xs flex flex-wrap gap-ds-xs">
                    {(["😊愉悦", "😐平静", "😞低落", "😠愤怒"] as const).map((m) => {
                      const key = m.slice(2)
                      return (
                        <button
                          key={m}
                          type="button"
                          className={`rounded-btn-ds border px-3 py-1 text-ds-body ${
                            diaryEmotion === key
                              ? "border-[#c8ab83] bg-[#f5e7cf] dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-100"
                              : "border-warm-soft text-[#5C4B3E] dark:border-stone-600 dark:text-stone-300"
                          }`}
                          onClick={() => setDiaryEmotion(key)}
                        >
                          {m}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      className={`rounded-btn-ds border px-3 py-1 text-ds-body ${
                        diaryEmotion === ""
                          ? "border-[#c8ab83] bg-[#f5e7cf] dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-100"
                          : "border-warm-soft text-[#5C4B3E] dark:border-stone-600 dark:text-stone-300"
                      }`}
                      onClick={() => setDiaryEmotion("")}
                    >
                      不记录心情
                    </button>
                  </div>
                  <div className="mt-ds-xs flex flex-wrap items-center gap-ds-xs">
                    <input
                      type="text"
                      className="min-w-[11rem] flex-1 rounded-btn-ds border border-warm-soft bg-paper px-3 py-1.5 text-ds-body text-[#5C4B3E] placeholder:text-[#9c8f83] dark:border-stone-600 dark:bg-stone-900 dark:text-stone-300 dark:placeholder:text-stone-500"
                      placeholder={`自定义心情（最多 ${DIARY_CUSTOM_MOOD_MAX_LEN} 字）`}
                      maxLength={DIARY_CUSTOM_MOOD_MAX_LEN}
                      value={customMoodDraft}
                      onChange={(e) => setCustomMoodDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return
                        e.preventDefault()
                        setDiaryEmotion(normalizeCustomMoodInput(customMoodDraft))
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 min-h-9 shrink-0 border-warm-soft px-3 py-0 text-ds-body dark:border-stone-600 dark:bg-stone-800/90 dark:text-stone-200 dark:hover:bg-stone-700"
                      onClick={() => setDiaryEmotion(normalizeCustomMoodInput(customMoodDraft))}
                    >
                      应用自定义
                    </Button>
                  </div>
                  <Textarea
                    ref={diaryTextareaRef}
                    className="mt-4 min-h-[220px] text-[#5C4B3E] dark:text-stone-200"
                    placeholder="今天发生了什么..."
                    value={diaryEditorText}
                    onChange={(e) => setDiaryEditorText(e.target.value)}
                    onKeyDown={(e) => {
                      if (mentionKeyword === null || mentionSuggestions.length === 0) return
                      if (e.key === "ArrowDown") {
                        e.preventDefault()
                        setMentionActiveIndex((prev) => (prev + 1) % mentionSuggestions.length)
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault()
                        setMentionActiveIndex((prev) => (prev === 0 ? mentionSuggestions.length - 1 : prev - 1))
                      } else if (e.key === "Enter") {
                        e.preventDefault()
                        insertDiaryMention(mentionSuggestions[mentionActiveIndex].name)
                      }
                    }}
                  />
                  <div className="mt-ds-xs flex flex-wrap items-center gap-ds-xs">
                    <button
                      type="button"
                      className="rounded-btn-ds border border-warm-soft bg-surface-warm-soft px-2.5 py-1 text-ds-caption text-[#5C4B3E] dark:border-stone-600 dark:bg-stone-800/70 dark:text-stone-300 dark:hover:bg-stone-700"
                      onClick={insertAtTrigger}
                    >
                      @ 提及联系人
                    </button>
                    <div className="flex flex-wrap gap-1.5">
                      {linkedContacts.map((name) => (
                        <span
                          key={name}
                          className="rounded-btn-ds bg-[#f5e7cf] px-2 py-0.5 text-ds-caption text-[#5C4B3E] dark:bg-amber-950/45 dark:text-amber-100"
                        >
                          @{name}
                        </span>
                      ))}
                    </div>
                  </div>
                  {showMentionPicker ? (
                    <div className="mt-ds-xs rounded-ds border border-warm-soft bg-surface-warm-soft p-ds-xs dark:border-stone-600 dark:bg-stone-800/55">
                      <input
                        className="w-full rounded-btn-ds border border-warm-soft px-2 py-1 text-ds-caption text-[#5C4B3E] dark:border-stone-600 dark:bg-stone-900 dark:text-stone-300 dark:placeholder:text-stone-500"
                        placeholder="搜索联系人后点击插入 @"
                        value={mentionSearch}
                        onChange={(e) => setMentionSearch(e.target.value)}
                      />
                      <div className="mt-ds-xs flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                        {pickerSuggestions.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="rounded-btn-ds border border-warm-soft px-2 py-0.5 text-ds-caption text-[#5C4B3E] hover:bg-surface-warm-soft dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700"
                            onClick={() => {
                              insertDiaryMention(c.name)
                              setShowMentionPicker(false)
                              setMentionSearch("")
                            }}
                          >
                            @{c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {mentionKeyword !== null ? (
                    <div className="mt-ds-xs rounded-ds border border-warm-soft bg-surface-warm-soft p-ds-xs dark:border-stone-600 dark:bg-stone-800/55">
                      {mentionSuggestions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {mentionSuggestions.map((c, idx) => (
                            <button
                              key={c.id}
                              type="button"
                              className={`rounded-btn-ds border px-2 py-1 text-ds-caption ${
                                mentionActiveIndex === idx
                                  ? "border-[#8B5A42] bg-[#f5e7cf] text-[#5C4B3E] dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-100"
                                  : "border-warm-soft text-[#5C4B3E] dark:border-stone-600 dark:text-stone-300"
                              }`}
                              onClick={() => insertDiaryMention(c.name)}
                            >
                              @{c.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-ds-caption text-[#5C4B3E] dark:text-stone-500">未找到匹配联系人</p>
                      )}
                    </div>
                  ) : null}
                  <div className="mt-ds-xs flex flex-wrap items-center gap-1.5 text-ds-body text-[#5C4B3E] dark:text-stone-300">
                    <span>关联联系人：</span>
                    {linkedContactItems.length > 0 ? (
                      linkedContactItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="rounded-btn-ds border border-warm-soft px-2 py-0.5 text-ds-caption hover:bg-surface-warm-soft dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700"
                          onClick={() => onJumpToContact(item.id)}
                        >
                          {item.name}
                        </button>
                      ))
                    ) : (
                      <span>暂无</span>
                    )}
                  </div>
                  <div className="mt-ds-xs flex items-center justify-between gap-ds-xs">
                    <p className="text-ds-caption text-[#5C4B3E] dark:text-stone-400">{diarySaveTip}</p>
                    <Button onClick={handleSaveDiary} disabled={diarySaving}>
                      {diarySaving ? "保存中..." : "保存日记"}
                    </Button>
                  </div>
                </Card>
              </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed bottom-0 left-0 right-0 z-[120] border-t border-warm-soft bg-base/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-stone-800 dark:bg-stone-950/92 dark:backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          <div className="relative shrink-0">
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-warm-soft bg-surface-warm-elevated text-ink shadow-[0_4px_14px_rgba(95,73,53,0.18)] transition duration-200 hover:border-warm-strong hover:bg-surface-warm-hover hover:shadow-[0_6px_18px_rgba(95,73,53,0.22)] active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
              aria-label={`打开日记与日历，本月 ${monthDiaryCount} 篇`}
              title="日记与日历"
              onClick={() => setShowDiaryModal(true)}
            >
              <CalendarDays className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </button>
            {monthDiaryCount > 0 ? (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8B5A42] px-1 text-[10px] font-semibold text-[#fffdf9] shadow-sm"
                aria-hidden
              >
                {monthDiaryCount > 9 ? "9+" : monthDiaryCount}
              </span>
            ) : null}
          </div>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={hitLimit}
            className="h-12 min-w-0 flex-1 rounded-[20px] border border-warm-soft bg-paper px-4 text-ds-body text-ink placeholder:text-soft/90 disabled:opacity-70 dark:border-stone-600 dark:bg-stone-900/95 dark:text-stone-100 dark:placeholder:text-stone-500"
            placeholder="和晓观聊聊你的关系与情绪…"
            title="Enter 发送；可先说说具体场景或感受"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void sendMessage()
              }
            }}
          />
          <button
            type="button"
            className="h-12 w-12 shrink-0 rounded-full bg-[#8B5A42] text-[#fffdf9] shadow-[0_2px_8px_rgba(107,63,46,0.35)] transition duration-200 hover:scale-110 hover:shadow-[0_4px_14px_rgba(107,63,46,0.4)] active:scale-95 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:scale-100 dark:bg-[#9a6248] dark:shadow-[0_2px_12px_rgba(0,0,0,0.45)] dark:hover:shadow-[0_4px_18px_rgba(0,0,0,0.5)]"
            onClick={() => void sendMessage()}
            disabled={chatLoading || hitLimit}
            aria-label="发送消息"
          >
            ➤
          </button>
        </div>
        {!isPro ? (
          <p className="mt-2 text-center text-ds-caption text-[#5C4B3E] dark:text-stone-400">
            {hitLimit ? (
              <Link href="/pricing" className="text-[#7a5a2e] underline underline-offset-2">
                今日免费对话次数已用完，开通Pro版解锁无限对话
              </Link>
            ) : (
              `今日剩余AI对话：${freeLeft}/${DAILY_LIMIT}次`
            )}
          </p>
        ) : null}
        {chatError ? (
          <p className="mt-1 text-center text-ds-caption text-[#B42318] dark:text-red-400">{chatError}</p>
        ) : null}
      </div>
    </section>
  )
}
