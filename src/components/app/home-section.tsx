import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react"

import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Textarea } from "../ui/textarea"

import type { RelationContact } from "./types"
import type { EnergyAlert, WeeklyDigest } from "../../lib/relationship-ai-demo"

type DiaryEmotion = "愉悦" | "平静" | "低落" | "愤怒"

type CalendarCell = {
  day: number
  dateValue: string
  hasRecord: boolean
  isToday: boolean
  emotion: DiaryEmotion | null
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
  diaryEmotion: DiaryEmotion
  setDiaryEmotion: (value: DiaryEmotion) => void
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
  diarySaveTip: string
  handleSaveDiary: () => void
  handleDeleteDiary: (dateKey: string) => void
  weeklyDigest: WeeklyDigest | null
  energyAlerts: EnergyAlert[]
}

export function HomeSection({
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
  diaryEmotion,
  setDiaryEmotion,
  diaryEditorText,
  setDiaryEditorText,
  mentionKeyword,
  mentionSuggestions,
  mentionActiveIndex,
  setMentionActiveIndex,
  insertDiaryMention,
  linkedContacts,
  linkedContactItems,
  contacts,
  onJumpToContact,
  diarySaveTip,
  handleSaveDiary,
  handleDeleteDiary,
  weeklyDigest,
  energyAlerts,
}: HomeSectionProps) {
  const [showMentionPicker, setShowMentionPicker] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const pickerSuggestions = useMemo(
    () => contacts.filter((c) => c.name.includes(mentionSearch.trim())).slice(0, 8),
    [contacts, mentionSearch]
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isSave = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s"
      if (!isSave) return
      event.preventDefault()
      handleSaveDiary()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleSaveDiary])

  return (
    <section className="space-y-ds-md">
      <div className="grid gap-ds-md md:grid-cols-2">
        {weeklyDigest ? (
          <Card className="rounded-ds border border-warm-base bg-paper p-ds-lg">
            <div className="flex items-start justify-between gap-ds-xs">
              <div>
                <h3 className="text-ds-title">📬 人际关系周报</h3>
                <p className="mt-1 text-ds-caption text-soft">每周一展示，统计上一完整周（上周一～上周日）</p>
              </div>
              <span className="rounded-btn-ds bg-surface-warm-soft px-2 py-0.5 text-ds-caption text-soft">{weeklyDigest.weekLabel}</span>
            </div>
            <ul className="mt-ds-xs space-y-1 text-ds-body text-soft">
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
              <li>
                建议本周联系：
                {weeklyDigest.focusNextWeek.length ? weeklyDigest.focusNextWeek.map((x) => x.name).join("、") : "暂无需优先名单"}
              </li>
            </ul>
          </Card>
        ) : null}
        <Card
          className={`rounded-ds border p-ds-lg ${
            energyAlerts.length ? "border-[#f5c2c7] bg-[#fff5f5]" : "border-warm-base bg-paper"
          } ${weeklyDigest ? "" : "md:col-span-2"}`}
        >
          <h3 className="text-ds-title">⚡ 近期能量与预警</h3>
          {energyAlerts.length ? (
            <ul className="mt-ds-xs space-y-ds-xs">
              {energyAlerts.map((a) => (
                <li key={a.contactId} className="text-ds-caption text-[#B42318]">
                  ⚠️ {a.name}：{a.reason}
                  <button
                    className="ml-2 text-[#795548] underline underline-offset-2"
                    onClick={() => onJumpToContact(a.contactId)}
                  >
                    查看
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-ds-xs text-ds-caption text-soft">暂无红色预警。记录互动后，观系会持续观察能量走势。</p>
          )}
        </Card>
      </div>
      <div className="grid gap-ds-md lg:grid-cols-[420px_1fr]">
        <Card className="rounded-ds border border-warm-base bg-gradient-to-b from-surface-warm-elevated to-surface-warm-soft p-ds-lg">
          <div className="mb-ds-md flex items-center justify-between">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-warm-soft bg-surface-warm-soft text-ds-body text-soft transition hover:bg-surface-warm-hover"
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
              <p className="text-ds-title tracking-wide text-slate-800">{monthLabel}</p>
              <p className="text-ds-caption text-soft">关系日记日历</p>
            </div>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-warm-soft bg-surface-warm-soft text-ds-body text-soft transition hover:bg-surface-warm-hover"
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
                className={`rounded-btn-ds border px-2 py-1 text-ds-caption ${diaryViewMode === "calendar" ? "border-[#6366F1] bg-[#EEF2FF] text-[#3730A3]" : "border-warm-soft bg-paper text-soft"}`}
                onClick={() => setDiaryViewMode("calendar")}
              >
                日历视图
              </button>
              <button
                className={`rounded-btn-ds border px-2 py-1 text-ds-caption ${diaryViewMode === "list" ? "border-[#6366F1] bg-[#EEF2FF] text-[#3730A3]" : "border-warm-soft bg-paper text-soft"}`}
                onClick={() => setDiaryViewMode("list")}
              >
                列表视图
              </button>
            </div>
            <input
              className="w-48 rounded-btn-ds border border-warm-soft bg-paper px-2 py-1 text-ds-caption"
              placeholder="搜索日记内容/联系人"
              value={diarySearchQuery}
              onChange={(e) => setDiarySearchQuery(e.target.value)}
            />
          </div>
          {diaryViewMode === "list" ? (
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {diarySearchResults.length > 0 ? (
                diarySearchResults.map(([dateKey, content]) => (
                  <div key={dateKey} className="rounded-ds border border-warm-soft bg-paper p-ds-xs">
                    <div className="flex items-center justify-between">
                      <button
                        className="text-ds-caption font-medium text-ink underline-offset-2 hover:underline"
                        onClick={() => {
                          setDiarySelectedDate(dateKey)
                          setDiaryViewMode("calendar")
                        }}
                      >
                        {dateKey}
                      </button>
                      <button className="text-ds-caption text-[#B42318]" onClick={() => handleDeleteDiary(dateKey)}>
                        删除
                      </button>
                    </div>
                    <p className="mt-1 line-clamp-3 text-ds-caption text-soft">{content}</p>
                  </div>
                ))
              ) : (
                <p className="text-ds-caption text-soft">
                  {totalDiaryCount === 0 ? "记录你的人际感悟，AI 会帮你分析相关的关系" : "暂无匹配日记"}
                </p>
              )}
            </div>
          ) : null}
          {diaryViewMode === "calendar" ? (
            <>
          <div className="grid grid-cols-7 gap-ds-xs text-center text-ds-caption text-soft">
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
                  className={`relative h-14 rounded-2xl border text-[30px] leading-none transition-all duration-200 ${
                    diarySelectedDate === cell.dateValue
                      ? "border-warm-strong bg-surface-warm-soft text-[#0F172A] shadow-[0_8px_18px_rgba(15,23,42,0.14)]"
                      : cell.hasRecord
                        ? "border-[#D7DEE8] bg-[#F8FAFC] text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
                        : "border-warm-soft bg-paper text-slate-500 hover:border-warm-strong hover:bg-surface-warm-soft"
                  }`}
                  onClick={() => setDiarySelectedDate(cell.dateValue)}
                >
                  {diarySelectedDate === cell.dateValue ? (
                    <>
                      <span className="pointer-events-none absolute inset-0 rounded-2xl border border-warm-soft" />
                      <span className="pointer-events-none absolute inset-[2px] rounded-[14px] border border-[#0F172A]" />
                    </>
                  ) : null}
                  {cell.hasRecord && diarySelectedDate !== cell.dateValue ? (
                    <>
                      <span className="pointer-events-none absolute inset-0 rounded-2xl border border-warm-soft" />
                      <span className="pointer-events-none absolute inset-[3px] rounded-[13px] border border-dashed border-[#C7D2E3]" />
                    </>
                  ) : null}
                  <div className="flex h-full flex-col items-center justify-center">
                    <span
                      className={`font-light tabular-nums tracking-[-0.03em] text-[34px] ${cell.isToday ? "flex h-8 w-8 items-center justify-center rounded-full bg-[#795548] text-white text-[20px] font-medium tracking-normal" : ""}`}
                    >
                      {cell.day}
                    </span>
                    {cell.hasRecord ? (
                      <span
                        className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                          cell.emotion === "愉悦"
                            ? "bg-[#66BB6A]"
                            : cell.emotion === "平静"
                              ? "bg-[#BDBDBD]"
                              : cell.emotion === "低落"
                                ? "bg-[#60A5FA]"
                                : cell.emotion === "愤怒"
                                  ? "bg-[#EF5350]"
                                  : diarySelectedDate === cell.dateValue
                                    ? "bg-[#1E293B]"
                                    : "bg-[#94A3B8]"
                        }`}
                      />
                    ) : null}
                  </div>
                </button>
              ) : (
                <div key={`empty-${idx}`} className="h-14" />
              )
            )}
          </div>
            </>
          ) : null}
          <div className="mt-ds-md rounded-ds border border-warm-soft bg-surface-warm-soft p-ds-md">
            <p className="mb-ds-xs text-ds-caption font-medium tracking-wide text-soft">本月记录</p>
            {monthTimeline.length > 0 ? (
              monthTimeline.map(([dateKey, note]) => (
                <p key={dateKey} className="text-ds-caption text-soft">
                  {dateKey.slice(5)}：{note}
                </p>
              ))
            ) : (
              <p className="text-ds-caption text-soft">本月暂无日记记录</p>
            )}
          </div>
        </Card>

        <div className="space-y-ds-md">
          <Card className="hidden rounded-ds border border-warm-base bg-paper p-ds-lg sm:block">
            <div className="flex items-center justify-between text-ds-body text-soft">
              <p>本月记录：12 篇</p>
              <p>提及联系人：8 人</p>
            </div>
          </Card>

          <Card className="rounded-ds border border-warm-base bg-paper p-ds-lg">
            <p className="text-[24px] font-semibold">{diarySelectedDate}</p>
            {totalDiaryCount === 0 ? (
              <p className="mt-ds-xs rounded-ds border border-dashed border-warm-soft bg-surface-warm-soft px-3 py-2 text-ds-caption text-soft">
                记录你的人际感悟，AI 会帮你分析相关的关系
              </p>
            ) : null}
            <div className="mt-ds-xs flex flex-wrap gap-ds-xs">
              {["😊愉悦", "😐平静", "😞低落", "😠愤怒"].map((m) => (
                <button
                  key={m}
                  className={`rounded-btn-ds border px-3 py-1 text-ds-body ${
                    diaryEmotion === m.slice(2) ? "border-[#c8ab83] bg-[#f5e7cf]" : "border-warm-soft"
                  }`}
                  onClick={() => setDiaryEmotion(m.slice(2) as DiaryEmotion)}
                >
                  {m}
                </button>
              ))}
            </div>
            <Textarea
              className="mt-4 min-h-[260px]"
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
            <div className="mt-ds-xs flex items-center gap-ds-xs">
              <button
                className="rounded-btn-ds border border-warm-soft bg-surface-warm-soft px-2.5 py-1 text-ds-caption text-soft"
                onClick={() => setShowMentionPicker((prev) => !prev)}
              >
                @ 提及联系人
              </button>
              <div className="flex flex-wrap gap-1.5">
                {linkedContacts.map((name) => (
                  <span key={name} className="rounded-btn-ds bg-[#EEF2FF] px-2 py-0.5 text-ds-caption text-[#3730A3]">
                    @{name}
                  </span>
                ))}
              </div>
            </div>
            {showMentionPicker ? (
              <div className="mt-ds-xs rounded-ds border border-warm-soft bg-surface-warm-soft p-ds-xs">
                <input
                  className="w-full rounded-btn-ds border border-warm-soft px-2 py-1 text-ds-caption"
                  placeholder="搜索联系人后点击插入 @"
                  value={mentionSearch}
                  onChange={(e) => setMentionSearch(e.target.value)}
                />
                <div className="mt-ds-xs flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                  {pickerSuggestions.map((c) => (
                    <button
                      key={c.id}
                      className="rounded-btn-ds border border-warm-soft px-2 py-0.5 text-ds-caption text-soft hover:bg-surface-warm-soft"
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
              <div className="mt-ds-xs rounded-ds border border-warm-soft bg-surface-warm-soft p-ds-xs">
                {mentionSuggestions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {mentionSuggestions.map((c, idx) => (
                      <button
                        key={c.id}
                        className={`rounded-btn-ds border px-2 py-1 text-ds-caption ${
                          mentionActiveIndex === idx
                            ? "border-[#6366F1] bg-[#EEF2FF] text-[#3730A3]"
                            : "border-warm-soft bg-surface-warm-soft text-slate-600"
                        }`}
                        onClick={() => insertDiaryMention(c.name)}
                      >
                        @{c.name}
                      </button>
                    ))}
                  </div>
                ) : (
                      <p className="text-ds-caption text-soft">未找到匹配联系人</p>
                )}
              </div>
            ) : null}
            <div className="mt-ds-xs flex flex-wrap items-center gap-1.5 text-ds-body text-soft">
              <span>关联联系人：</span>
              {linkedContactItems.length > 0 ? (
                linkedContactItems.map((item) => (
                  <button
                    key={item.id}
                    className="rounded-btn-ds border border-warm-soft px-2 py-0.5 text-ds-caption hover:bg-surface-warm-soft"
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
              <p className="text-ds-caption text-soft">{diarySaveTip}</p>
              <Button onClick={handleSaveDiary}>保存日记</Button>
            </div>
          </Card>
        </div>
      </div>
      <div className="mt-ds-lg hidden rounded-ds border-2 border-[#2e7d32]/35 bg-[#e8f5e9] px-ds-md py-ds-md text-center shadow-sm sm:block">
        <p className="text-ds-body font-semibold leading-relaxed text-[#1b5e20]">
          🔒 所有数据本地存储，不上传服务器，你的隐私完全由你掌控
        </p>
      </div>
    </section>
  )
}
