import Link from "next/link"
import { useEffect, useState, type Dispatch, type SetStateAction } from "react"

import type { EnergyAlert, WeeklyDigest } from "../../lib/relationship-ai-demo"
import { isProSubscriber } from "../../lib/product-limits"
import { normalizeCustomMoodInput } from "../../lib/diary-mood"
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
  openCreateContact?: () => void
  openOnboarding?: () => void
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
    contacts,
    energyAlerts,
    linkedContactItems,
    onJumpToContact,
    onOpenAiPage,
    diarySelectedDate,
    diaryEmotion,
    setDiaryEmotion,
    diaryEditorText,
    setDiaryEditorText,
    diarySaveTip,
    diarySaving,
    handleSaveDiary,
    handleDeleteDiary,
    totalDiaryCount,
    openCreateContact,
    openOnboarding,
    storageScope = "guest",
  } = props

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState("")
  const [freeUsed, setFreeUsed] = useState(0)
  const [expandEnergy, setExpandEnergy] = useState(false)
  const [expandDiary, setExpandDiary] = useState(false)
  const [expandContacts, setExpandContacts] = useState(false)

  const isPro = isProSubscriber()
  const freeLeft = Math.max(0, DAILY_LIMIT - freeUsed)
  const hitLimit = !isPro && freeLeft <= 0
  const isEmptyUser = contacts.length === 0 && totalDiaryCount === 0

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
      <Card className="rounded-ds border border-warm-base bg-paper p-ds-lg text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-[#d4b79d]" />
        <h2 className="mt-3 text-2xl font-semibold text-[#5C4B3E]">晓观 · 你的专属人际关系AI</h2>
        <p className="mt-1 text-ds-body text-soft">看清关系，减少内耗，AI陪伴分析</p>
      </Card>

      <Card className="rounded-[16px] border border-warm-base bg-[#F9F5F0] p-ds-lg shadow-[inset_0_1px_6px_rgba(0,0,0,0.04)]">
        <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
          {chatMessages.length === 0 ? (
            <div className="rounded-[16px] rounded-br-sm bg-white px-3 py-3 text-[#5C4B3E]">
              你好，我是晓观。
              <br />
              你可以和我聊聊人际关系困惑、情绪内耗、相处难题，我会帮你分析、陪伴、给出真正适合你的建议。
            </div>
          ) : (
            chatMessages.map((item) => (
              <div key={item.id} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[82%] whitespace-pre-wrap px-3 py-3 ${
                    item.role === "user"
                      ? "rounded-[16px] rounded-bl-sm bg-[#8B5A42] text-white"
                      : "rounded-[16px] rounded-br-sm bg-white text-[#5C4B3E]"
                  }`}
                >
                  {item.content}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="rounded-ds border border-warm-base bg-paper p-ds-md">
        <button type="button" className="w-full text-left text-ds-body font-semibold text-ink" onClick={() => setExpandEnergy((v) => !v)}>
          近期能量与预警 {expandEnergy ? "−" : "+"}
        </button>
        {expandEnergy ? (
          <div className="mt-ds-xs space-y-1 text-ds-caption text-soft">
            {energyAlerts.length === 0 ? (
              <p>暂无红色预警。记录互动后，观系会持续观察能量走势。</p>
            ) : (
              energyAlerts.map((a) => (
                <p key={a.contactId}>
                  ⚠️ {a.name}：{a.reason}
                </p>
              ))
            )}
          </div>
        ) : null}
      </Card>

      <Card className="rounded-ds border border-warm-base bg-paper p-ds-md">
        <button type="button" className="w-full text-left text-ds-body font-semibold text-ink" onClick={() => setExpandDiary((v) => !v)}>
          日记记录 {expandDiary ? "−" : "+"}
        </button>
        {expandDiary ? (
          <div className="mt-ds-xs space-y-ds-xs">
            <div className="flex flex-wrap gap-1.5">
              {["😊愉悦", "😐平静", "😞低落", "😠愤怒", "不记录心情"].map((label) => {
                const value = label === "不记录心情" ? "" : normalizeCustomMoodInput(label.slice(2))
                const active = diaryEmotion === value
                return (
                  <button
                    key={label}
                    type="button"
                    className={`rounded-btn-ds border px-3 py-1 text-ds-body ${active ? "border-[#c8ab83] bg-[#f5e7cf]" : "border-warm-soft"}`}
                    onClick={() => setDiaryEmotion(value)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <Textarea
              className="min-h-[180px]"
              placeholder="今天发生了什么..."
              value={diaryEditorText}
              onChange={(e) => setDiaryEditorText(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <p className="text-ds-caption text-soft">{diarySaveTip}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleDeleteDiary(diarySelectedDate)}>
                  删除当日
                </Button>
                <Button onClick={handleSaveDiary} disabled={diarySaving}>
                  {diarySaving ? "保存中..." : "保存日记"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="rounded-ds border border-warm-base bg-paper p-ds-md">
        <button type="button" className="w-full text-left text-ds-body font-semibold text-ink" onClick={() => setExpandContacts((v) => !v)}>
          联系人快捷入口 {expandContacts ? "−" : "+"}
        </button>
        {expandContacts ? (
          <div className="mt-ds-xs flex flex-wrap gap-1.5">
            {linkedContactItems.length > 0 ? (
              linkedContactItems.map((item) => (
                <button
                  key={item.id}
                  className="rounded-btn-ds border border-warm-soft px-2 py-1 text-ds-caption hover:bg-surface-warm-soft"
                  onClick={() => onJumpToContact(item.id)}
                >
                  {item.name}
                </button>
              ))
            ) : (
              <p className="text-ds-caption text-soft">暂无联系人，添加后可在这里快速进入详情。</p>
            )}
          </div>
        ) : null}
      </Card>

      {isEmptyUser ? (
        <Card className="rounded-ds border border-[#e6d7c5] bg-[#fff8ee] p-ds-md">
          <p className="text-ds-caption text-soft">新用户快速开始：先添加联系人，再记录互动，最后查看关系洞察。</p>
          <div className="mt-ds-xs flex flex-wrap gap-2">
            {openCreateContact ? <Button onClick={openCreateContact}>立即添加联系人</Button> : null}
            {openOnboarding ? (
              <Button variant="outline" onClick={openOnboarding}>
                打开新手引导
              </Button>
            ) : null}
            <Button variant="ghost" onClick={onOpenAiPage}>
              打开完整晓观页
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="fixed bottom-0 left-0 right-0 border-t border-warm-soft bg-base/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={hitLimit}
            className="h-12 flex-1 rounded-[20px] border border-warm-soft bg-paper px-4 text-ds-body text-ink placeholder:text-soft disabled:opacity-70"
            placeholder="和晓观聊聊你的关系与情绪…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void sendMessage()
              }
            }}
          />
          <button
            type="button"
            className="h-12 w-12 rounded-full bg-[#8B5A42] text-white transition hover:opacity-90 disabled:opacity-50"
            onClick={() => void sendMessage()}
            disabled={chatLoading || hitLimit}
            aria-label="发送消息"
          >
            ➤
          </button>
        </div>
        {!isPro ? (
          <p className="mt-2 text-center text-ds-caption text-soft">
            {hitLimit ? (
              <Link href="/pricing" className="text-[#7a5a2e] underline underline-offset-2">
                今日免费对话次数已用完，开通Pro版解锁无限对话
              </Link>
            ) : (
              `今日剩余AI对话：${freeLeft}/${DAILY_LIMIT}次`
            )}
          </p>
        ) : null}
        {chatError ? <p className="mt-1 text-center text-ds-caption text-[#B42318]">{chatError}</p> : null}
      </div>

      <div className="mt-ds-lg hidden rounded-ds border-2 border-[#2e7d32]/35 bg-[#e8f5e9] px-ds-md py-ds-md text-center shadow-sm sm:block">
        <p className="text-ds-body font-semibold leading-relaxed text-[#1b5e20]">
          🔒 内容与账户绑定，经 Supabase 安全同步至云端，仅你本人可访问；AI 与数据处理以{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-[#145214]">
            《隐私政策》
          </Link>{" "}
          为准。
        </p>
      </div>
    </section>
  )
}
