import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { X } from "lucide-react"

import { buildTrueFriendReport, type ScoreHistoryPoint } from "../../lib/relationship-ai-demo"
import { isProSubscriber } from "../../lib/product-limits"
import type { RelationContact } from "./types"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Dialog } from "../ui/dialog"
import { Textarea } from "../ui/textarea"
import { ScoreTrendChart } from "./score-trend-chart"

/** 与晓观首页顶部头像同色、同形 */
function XiaoguanAvatar({ className = "" }: { className?: string }) {
  return <div className={`shrink-0 rounded-full bg-[#d4b79d] ${className}`} aria-hidden />
}

function UserAvatar({ className = "" }: { className?: string }) {
  return <div className={`shrink-0 rounded-full bg-[#a89888] ${className}`} aria-hidden />
}

function AnalyzingDots() {
  return (
    <span className="inline-flex items-center gap-1 pl-0.5" aria-hidden>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="inline-block h-1.5 w-1.5 rounded-full bg-[#9c8f83] motion-safe:animate-bounce"
          style={{ animationDuration: "0.7s", animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}

const bubbleUser =
  "max-w-[85%] whitespace-pre-wrap rounded-tl-[16px] rounded-tr-[16px] rounded-br-[16px] rounded-bl-none bg-[#8B5A42] px-3.5 py-3 text-ds-body text-[#fffdf9] shadow-[0_1px_3px_rgba(60,40,30,0.08)]"
const bubbleAi =
  "whitespace-pre-wrap rounded-tl-[16px] rounded-tr-[16px] rounded-bl-[16px] rounded-br-none border border-[#e8d9ca] bg-white px-3.5 py-3 text-ds-body text-[#5C4B3E] shadow-[0_1px_3px_rgba(60,40,30,0.08)]"

const DAILY_LIMIT = 15

function usageStorageKey(scope: string) {
  return `xiaoguan-usage:${scope}`
}

function contactAdvisorChatKey(scope: string, contactId: string) {
  return `xiaoguan-contact-advisor-chat:${scope}:${contactId}`
}

function todayToken() {
  return new Date().toISOString().slice(0, 10)
}

type AdvisorMsg = { id: string; role: "user" | "assistant"; content: string }

type PersonDetailOverlayProps = {
  storageScope?: string
  selectedContactId?: string
  selectedContactName?: string
  selectedContactGroup?: string
  selectedContactTraits?: string
  trueFriendScore: number
  surfaceRelationScore: number
  scoreTrendPoints: ScoreHistoryPoint[]
  patternSummary: string
  selectedContact?: RelationContact
  openInteractionDialog: () => void
  openEditContact: () => void
  interactionSaved: boolean
  detailInput: string
  setDetailInput: (value: string) => void
  onClose: () => void
  interactionAiStatus: "idle" | "analyzing" | "done"
  interactionLogs: Array<{
    id: string
    contactId: string
    date: string
    type: string
    what: string
    reaction: string
    feel: string
    energy: number
    meaningful?: boolean
    aiInsight?: string
  }>
  onDeleteInteraction: (interactionId: string) => void
  onDeleteContact: () => void
}

export function PersonDetailOverlay({
  storageScope = "guest",
  selectedContactId = "",
  selectedContactName,
  selectedContactGroup,
  selectedContactTraits,
  trueFriendScore,
  surfaceRelationScore,
  scoreTrendPoints,
  patternSummary,
  selectedContact,
  openInteractionDialog,
  openEditContact,
  interactionSaved,
  detailInput,
  setDetailInput,
  onClose,
  interactionAiStatus,
  interactionLogs,
  onDeleteInteraction,
  onDeleteContact,
}: PersonDetailOverlayProps) {
  const [isDesktop, setIsDesktop] = useState(true)
  const [mobileAiOpen, setMobileAiOpen] = useState(false)
  const [sheetHeightPct, setSheetHeightPct] = useState(70)
  const [sheetClosing, setSheetClosing] = useState(false)
  const [sheetEntered, setSheetEntered] = useState(false)
  const [keyboardShift, setKeyboardShift] = useState(0)

  const [quickPrompts, setQuickPrompts] = useState([
    "🤔 我们之间的问题出在哪？",
    "💬 该怎么和 TA 沟通难事？",
    "🔁 我重复什么模式？",
    "❓ 真朋友还是表面关系？",
    "📂 建议移到哪个分组？",
  ])
  const [customPrompt, setCustomPrompt] = useState("")
  const [showCustomPromptInput, setShowCustomPromptInput] = useState(false)
  const [showTrueFriendReport, setShowTrueFriendReport] = useState(false)

  const [advisorMessages, setAdvisorMessages] = useState<AdvisorMsg[]>([])
  const [streamAssistantText, setStreamAssistantText] = useState("")
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [advisorError, setAdvisorError] = useState("")
  const [freeUsed, setFreeUsed] = useState(0)

  const typeTimerRef = useRef<number | null>(null)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ startY: number; startPct: number } | null>(null)
  const sheetHandleRef = useRef<HTMLDivElement | null>(null)
  const sheetPctRef = useRef(70)

  const contactIdForStorage = selectedContactId || selectedContact?.id || "unknown"
  const isPro = isProSubscriber()

  useEffect(() => {
    sheetPctRef.current = sheetHeightPct
  }, [sheetHeightPct])
  const freeLeft = Math.max(0, DAILY_LIMIT - freeUsed)
  const hitLimit = !isPro && freeLeft <= 0

  function clearTypeTimer() {
    const id = typeTimerRef.current
    if (id != null) {
      window.clearInterval(id)
      typeTimerRef.current = null
    }
  }

  useEffect(() => () => clearTypeTimer(), [])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    function sync() {
      setIsDesktop(mq.matches)
      if (mq.matches) {
        setMobileAiOpen(false)
        setSheetClosing(false)
      }
    }
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    if (typeof localStorage === "undefined") return
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
    localStorage.setItem(usageStorageKey(storageScope), JSON.stringify({ day: todayToken(), count: freeUsed }))
  }, [freeUsed, storageScope])

  useEffect(() => {
    if (typeof localStorage === "undefined") return
    const raw = localStorage.getItem(contactAdvisorChatKey(storageScope, contactIdForStorage))
    if (raw) {
      try {
        setAdvisorMessages(JSON.parse(raw) as AdvisorMsg[])
      } catch {
        setAdvisorMessages([])
      }
    } else {
      setAdvisorMessages([])
    }
    clearTypeTimer()
    setStreamAssistantText("")
    setIsAiTyping(false)
    setAdvisorError("")
  }, [storageScope, contactIdForStorage])

  useEffect(() => {
    if (typeof localStorage === "undefined") return
    localStorage.setItem(
      contactAdvisorChatKey(storageScope, contactIdForStorage),
      JSON.stringify(advisorMessages.slice(-80))
    )
  }, [advisorMessages, storageScope, contactIdForStorage])

  const scrollChatToBottom = useCallback(() => {
    const el = chatScrollRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [])

  useEffect(() => {
    scrollChatToBottom()
  }, [advisorMessages, streamAssistantText, isAiTyping, scrollChatToBottom])

  useEffect(() => {
    if (!mobileAiOpen) return
    const vv = window.visualViewport
    if (!vv) return
    function update() {
      const vp = window.visualViewport
      if (!vp) return
      const covered = Math.max(0, window.innerHeight - vp.height - vp.offsetTop)
      setKeyboardShift(covered)
    }
    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
      setKeyboardShift(0)
    }
  }, [mobileAiOpen])

  useEffect(() => {
    if (!mobileAiOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileAiOpen])

  const closeMobileSheet = useCallback(() => {
    setSheetClosing(true)
    window.setTimeout(() => {
      setMobileAiOpen(false)
      setSheetClosing(false)
      setSheetEntered(false)
      setKeyboardShift(0)
    }, 300)
  }, [])

  useEffect(() => {
    if (!mobileAiOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      e.preventDefault()
      e.stopImmediatePropagation()
      closeMobileSheet()
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [mobileAiOpen, closeMobileSheet])

  useEffect(() => {
    if (!mobileAiOpen) {
      setSheetEntered(false)
      return
    }
    setSheetEntered(false)
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setSheetEntered(true))
    })
    return () => window.cancelAnimationFrame(id)
  }, [mobileAiOpen])

  function openMobileSheet() {
    setSheetClosing(false)
    setMobileAiOpen(true)
    setSheetHeightPct(70)
  }

  function buildAdvisorContext(): string {
    const lines: string[] = []
    if (selectedContact) {
      lines.push(`姓名：${selectedContact.name}`)
      lines.push(`分组：${selectedContact.group}`)
      if (selectedContact.traits?.trim()) lines.push(`特点：${selectedContact.traits.trim()}`)
      if (selectedContact.background?.trim()) lines.push(`背景：${selectedContact.background.trim()}`)
      if (selectedContact.privateNote?.trim()) {
        lines.push(`私人备注：${selectedContact.privateNote.trim().slice(0, 800)}`)
      }
    } else {
      lines.push(`姓名：${selectedContactName ?? "未知"}`)
      if (selectedContactGroup?.trim()) lines.push(`分组：${selectedContactGroup.trim()}`)
      if (selectedContactTraits?.trim()) lines.push(`特点：${selectedContactTraits.trim()}`)
    }
    lines.push(`真朋友指数 ${trueFriendScore}/10，表面关系指数 ${surfaceRelationScore}/10`)
    lines.push(`相处模式（本地摘要）：${patternSummary}`)
    if (interactionLogs.length > 0) {
      lines.push("互动记录（从新到旧节选）：")
      for (const log of [...interactionLogs].reverse().slice(0, 12)) {
        lines.push(
          `- ${log.date} · ${log.type} · 能量 ${log.energy} · 我：${(log.what ?? "").slice(0, 220)} · TA：${(log.reaction ?? "").slice(0, 220)} · 感受：${(log.feel ?? "").slice(0, 160)}`
        )
      }
    } else {
      lines.push("互动记录：暂无")
    }
    return lines.join("\n")
  }

  const friendScoreValue = trueFriendScore
  const surfaceScoreValue = surfaceRelationScore
  const friendScore = `${friendScoreValue.toFixed(1)}/10`
  const surfaceScore = `${surfaceScoreValue.toFixed(1)}/10`
  const trendData =
    scoreTrendPoints.length >= 2
      ? scoreTrendPoints
      : [
          { date: "前期", trueFriend: friendScoreValue * 0.92, surface: Math.min(10, surfaceScoreValue * 1.06) },
          { date: "当前", trueFriend: friendScoreValue, surface: surfaceScoreValue },
        ]

  const scoreCircleStyle = (value: number, color: string) => ({
    background: `conic-gradient(${color} 0 ${(value / 10) * 100}%, #eee7dd ${(value / 10) * 100}% 100%)`,
  })

  async function triggerAiReply(input: string) {
    const userMessage = input.trim()
    if (!userMessage || isAiTyping) return
    if (hitLimit) {
      setAdvisorError("今日免费对话次数已用完，开通Pro版解锁无限对话")
      return
    }

    clearTypeTimer()
    setAdvisorError("")
    setDetailInput("")
    setAdvisorMessages((prev) => [...prev, { id: `${Date.now()}-u`, role: "user", content: userMessage }])
    setStreamAssistantText("")
    setIsAiTyping(true)

    try {
      const res = await fetch("/api/ai/contact-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context: buildAdvisorContext(),
        }),
      })
      let data: { reply?: string; error?: string } = {}
      try {
        data = (await res.json()) as typeof data
      } catch {
        data = {}
      }

      if (!res.ok) {
        if (res.status === 400 && typeof data.error === "string") {
          setAdvisorError(data.error)
        } else {
          setAdvisorError("晓观暂时无法回复，请稍后重试")
        }
        setAdvisorMessages((prev) => prev.slice(0, -1))
        setIsAiTyping(false)
        return
      }

      const reply = typeof data.reply === "string" ? data.reply : ""
      if (!reply) {
        setAdvisorError("晓观暂时无法回复，请稍后重试")
        setAdvisorMessages((prev) => prev.slice(0, -1))
        setIsAiTyping(false)
        return
      }

      if (!isPro) setFreeUsed((u) => u + 1)

      let index = 0
      const step = 3
      const timerId = window.setInterval(() => {
        index += step
        const next = reply.slice(0, Math.min(index, reply.length))
        setStreamAssistantText(next)
        if (index >= reply.length) {
          clearTypeTimer()
          setIsAiTyping(false)
          setAdvisorMessages((prev) => [...prev, { id: `${Date.now()}-a`, role: "assistant", content: reply }])
          setStreamAssistantText("")
        }
      }, 18)
      typeTimerRef.current = timerId
    } catch {
      setAdvisorError("晓观暂时无法回复，请稍后重试")
      setAdvisorMessages((prev) => prev.slice(0, -1))
      setStreamAssistantText("")
      setIsAiTyping(false)
    }
  }

  function renderChatMessages(compactAvatar: boolean) {
    const av = compactAvatar ? "h-9 w-9" : "h-9 w-9"
    return (
      <>
        {advisorMessages.length === 0 && !streamAssistantText && !isAiTyping ? (
          <div className="flex items-end justify-start gap-2">
            <XiaoguanAvatar className={av} />
            <div className={`max-w-[85%] ${bubbleAi}`}>
              <p className="font-medium">你好，我是晓观。</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-ds-caption leading-[1.6]">
                <li>可聊人际困惑、情绪内耗、相处难题。</li>
                <li>我会陪你梳理，并给出适合你的建议；也可结合 TA 的档案与互动记录作答。</li>
              </ul>
            </div>
          </div>
        ) : null}
        {advisorMessages.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="flex items-end justify-end gap-2">
              <div className={bubbleUser}>{msg.content}</div>
              <UserAvatar className={av} />
            </div>
          ) : (
            <div key={msg.id} className="flex items-end justify-start gap-2">
              <XiaoguanAvatar className={av} />
              <div className={`min-w-0 max-w-[85%] ${bubbleAi}`}>
                <span className="whitespace-pre-wrap">{msg.content}</span>
              </div>
            </div>
          )
        )}
        {isAiTyping || streamAssistantText ? (
          <div className="flex items-end justify-start gap-2">
            <XiaoguanAvatar className={av} />
            <div className="min-w-0 max-w-[85%] flex-1">
              {isAiTyping && !streamAssistantText ? (
                <p className="flex flex-wrap items-center gap-1 text-ds-caption text-[#8a7d72]">
                  <span>正在分析…</span>
                  <AnalyzingDots />
                </p>
              ) : (
                <>
                  {isAiTyping ? (
                    <p className="mb-1 flex flex-wrap items-center gap-1 text-ds-caption text-[#8a7d72]">
                      <span>正在分析…</span>
                      <AnalyzingDots />
                    </p>
                  ) : null}
                  <div className={`min-h-[3rem] ${bubbleAi}`}>
                    <span className="whitespace-pre-wrap">
                      {streamAssistantText}
                      {isAiTyping ? <span className="ml-0.5 inline-block animate-pulse">|</span> : null}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}
      </>
    )
  }

  function renderQuickRow(className: string) {
    return (
      <div
        className={`flex shrink-0 items-center gap-2 overflow-x-auto py-1 [scrollbar-width:thin] md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden ${className}`}
      >
        {quickPrompts.map((q) => (
          <button
            type="button"
            key={q}
            className="shrink-0 rounded-full border border-warm-soft bg-[#f3f2ef] px-4 py-2.5 text-left text-[13px] font-medium leading-snug text-ink shadow-sm transition-colors hover:bg-[#efe6d7] sm:text-sm"
            onClick={() => {
              setDetailInput(q)
              void triggerAiReply(q)
            }}
          >
            {q}
          </button>
        ))}
        <button
          type="button"
          className="shrink-0 rounded-full border border-warm-strong bg-surface-warm-soft px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-[#efe6d7]"
          onClick={() => setShowCustomPromptInput((prev) => !prev)}
        >
          + 自定义
        </button>
      </div>
    )
  }

  function renderCustomPromptEditor() {
    if (!showCustomPromptInput) return null
    return (
      <div className="flex shrink-0 gap-ds-xs pt-1">
        <input
          className="min-w-0 flex-1 rounded-btn-ds border border-warm-soft px-2 py-1 text-ds-caption"
          placeholder="例如：帮我写一段缓和关系的话"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
        />
        <button
          type="button"
          className="shrink-0 rounded-btn-ds border border-warm-soft bg-white px-2 py-1 text-ds-caption hover:bg-surface-warm-soft"
          onClick={() => {
            const next = customPrompt.trim()
            if (!next) return
            setQuickPrompts((prev) => [next, ...prev])
            setDetailInput(next)
            setCustomPrompt("")
            setShowCustomPromptInput(false)
            void triggerAiReply(next)
          }}
        >
          添加
        </button>
      </div>
    )
  }

  function renderInputFooter(compact: boolean) {
    const quota = !isPro ? (
      <p className={`text-center text-[12px] text-[#8a7d72] ${compact ? "mt-1" : "mt-0.5"}`}>
        {hitLimit ? (
          <Link href="/pricing" className="text-[#7a5a2e] underline underline-offset-2">
            今日免费对话次数已用完，开通Pro版解锁无限对话
          </Link>
        ) : (
          `今日剩余AI对话：${freeLeft}/${DAILY_LIMIT}次`
        )}
      </p>
    ) : null

    return (
      <div className={`flex shrink-0 flex-col border-t border-[#ebe3d9] bg-white ${compact ? "px-3 pb-2 pt-2" : "px-2 pb-2 pt-2"}`}>
        <div className={`flex items-end gap-2 ${compact ? "min-h-[48px]" : ""}`}>
          <Textarea
            className={
              compact
                ? "min-h-[48px] max-h-[120px] flex-1 resize-none rounded-[22px] border border-warm-soft bg-paper px-4 py-3 text-ds-body text-ink placeholder:text-soft/90 focus-visible:border-[#795548]"
                : "min-h-[3rem] max-h-[160px] flex-1 resize-y rounded-[20px] border border-warm-soft bg-paper px-4 py-3 text-ds-body text-ink placeholder:text-soft/90 focus-visible:border-[#795548] sm:min-h-[3.25rem]"
            }
            placeholder="和晓观聊聊关于TA的任何问题…"
            value={detailInput}
            onChange={(e) => setDetailInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void triggerAiReply(detailInput)
              }
            }}
          />
          <button
            type="button"
            className={`flex shrink-0 items-center justify-center rounded-full bg-[#8B5A42] text-[#fffdf9] shadow-[0_2px_8px_rgba(107,63,46,0.35)] transition duration-200 hover:scale-110 hover:shadow-[0_4px_14px_rgba(107,63,46,0.4)] active:scale-95 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:scale-100 ${compact ? "h-11 w-11" : "h-12 w-12"}`}
            disabled={isAiTyping}
            aria-label={isAiTyping ? "晓观回复中" : "发送"}
            onClick={() => void triggerAiReply(detailInput)}
          >
            ➤
          </button>
        </div>
        {quota}
      </div>
    )
  }

  function renderDesktopAiColumn() {
    return (
      <div className="flex min-h-0 w-full flex-col border-l border-[#ebe3d9] bg-[#F9F5F0] md:w-[40%]">
        <div className="flex h-20 shrink-0 flex-col justify-center gap-0.5 border-b border-[#ebe3d9] bg-[#F9F5F0] px-3">
          <div className="flex items-center gap-3">
            <XiaoguanAvatar className="h-12 w-12" />
            <div className="min-w-0">
              <h3 className="text-base font-semibold leading-snug text-[#5C4B3E]">
                晓观 · 关于 {selectedContactName ?? "联系人"} 的专属分析
              </h3>
              <p className="text-xs leading-relaxed text-[#8a7d72]">
                晓观基于TA的档案与你们的互动记录，为你提供专属建议
              </p>
            </div>
          </div>
        </div>
        <div
          ref={chatScrollRef}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-[#F9F5F0] px-3 py-4"
        >
          {renderChatMessages(false)}
        </div>
        <div className="flex min-h-[60px] shrink-0 flex-col justify-center gap-1 border-t border-[#ebe3d9] bg-white px-2 py-1">
          {renderQuickRow("")}
          {renderCustomPromptEditor()}
        </div>
        <div className="flex min-h-[88px] shrink-0 flex-col bg-white">{renderInputFooter(false)}</div>
        {advisorError ? (
          <p className="shrink-0 bg-white px-3 pb-2 text-ds-caption font-medium text-[#b42318]" role="alert">
            {advisorError}
          </p>
        ) : null}
      </div>
    )
  }

  const dataColumnInner = (
    <div
      onContextMenu={(event) => {
        event.preventDefault()
        openInteractionDialog()
      }}
    >
      <p className="mb-ds-xs text-ds-caption text-soft md:hidden">页面4：已选中联系人</p>

      <div className="mb-ds-xs flex flex-col gap-ds-xs md:grid md:grid-cols-3">
        <Button onClick={openInteractionDialog}>📝 记录互动</Button>
        <Button variant="outline" onClick={openEditContact}>
          ✏️ 编辑档案
        </Button>
        <Button variant="danger" onClick={onDeleteContact}>
          🗑️ 删除联系人
        </Button>
      </div>

      {interactionSaved ? (
        <div className="mb-ds-xs rounded-ds border border-[#BBF7D0] bg-[#ECFDF5] px-3 py-2 text-ds-caption text-[#065F46]">
          互动已记录
        </div>
      ) : null}

      <Card className="mb-ds-xs rounded-ds border border-warm-base p-ds-md">
        <p className="text-ds-caption font-medium text-soft">关系评分（示意）</p>
        <div className="mt-ds-xs grid gap-ds-xs sm:grid-cols-2">
          <div className="flex items-center gap-ds-xs rounded-ds bg-surface-warm-soft p-ds-xs">
            <div
              className="relative h-14 w-14 shrink-0 rounded-full p-[4px] sm:h-16 sm:w-16 sm:p-[5px]"
              style={scoreCircleStyle(friendScoreValue, "#66BB6A")}
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-ds-caption font-semibold text-ink">
                {friendScoreValue.toFixed(1)}
              </div>
            </div>
            <div>
              <p className="text-ds-caption text-soft">🧡 真朋友指数</p>
              <p className="text-ds-caption font-medium text-ink">{friendScore}</p>
            </div>
          </div>
          <div className="flex items-center gap-ds-xs rounded-ds bg-surface-warm-soft p-ds-xs">
            <div
              className="relative h-14 w-14 shrink-0 rounded-full p-[4px] sm:h-16 sm:w-16 sm:p-[5px]"
              style={scoreCircleStyle(surfaceScoreValue, "#BDBDBD")}
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-ds-caption font-semibold text-ink">
                {surfaceScoreValue.toFixed(1)}
              </div>
            </div>
            <div>
              <p className="text-ds-caption text-soft">🤝 表面关系指数</p>
              <p className="text-ds-caption font-medium text-ink">{surfaceScore}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-ds-xs rounded-ds border border-warm-base p-ds-md">
        <div className="flex flex-wrap items-center justify-between gap-ds-xs">
          <p className="text-ds-caption font-medium text-soft">近 3 个月指数趋势</p>
          <Button size="sm" variant="outline" onClick={() => setShowTrueFriendReport(true)}>
            一键验证真朋友
          </Button>
        </div>
        <ScoreTrendChart data={trendData} className="mt-ds-xs" />
      </Card>

      <Card className="mb-ds-xs rounded-ds border border-warm-base bg-surface-warm-soft p-ds-md">
        <p className="text-ds-caption font-medium text-soft">相处模式摘要</p>
        <p className="mt-1 text-ds-body text-ink">{patternSummary}</p>
      </Card>

      <Card className="rounded-ds border border-warm-base p-ds-md">
        <div className="space-y-2">
          {interactionLogs.length > 0 ? (
            interactionLogs.map((log) => (
              <div key={log.id} className="rounded-ds border border-warm-soft bg-surface-warm-soft p-ds-xs">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-ds-caption font-medium text-ink">
                    {log.date} · {log.type} · 能量 {log.energy >= 0 ? `+${log.energy}` : log.energy}
                    {log.meaningful ? " · 有意义" : ""}
                  </p>
                  <button
                    className="shrink-0 rounded-btn-ds border border-[#e7b7b2] bg-[#fff3f2] px-2 py-0.5 text-[11px] text-[#b42318] hover:bg-[#ffe8e6]"
                    onClick={() => onDeleteInteraction(log.id)}
                  >
                    删除
                  </button>
                </div>
                <p className="mt-1 text-ds-caption text-soft">我：{log.what || "（未填写）"}</p>
                <p className="text-ds-caption text-soft">TA：{log.reaction || "（未填写）"}</p>
              </div>
            ))
          ) : (
            <p className="rounded-ds border border-dashed border-warm-soft bg-surface-warm-soft p-ds-xs text-ds-caption text-soft">
              记录你与 TA 的每一次互动，晓观会结合互动帮你观察关系变化
            </p>
          )}
        </div>
      </Card>

      {interactionAiStatus === "analyzing" ? (
        <p className="mt-ds-md text-ds-caption text-[#7a5a2e]">晓观正在结合本次互动更新分析…</p>
      ) : null}
      {interactionAiStatus === "done" ? (
        <p className="mt-1 text-ds-caption text-energy-positive">晓观已参考本次互动，关系评分示意已更新</p>
      ) : null}
    </div>
  )

  return (
    <section>
      <div className="rounded-ds border border-warm-base bg-paper md:flex md:h-[calc(100dvh-3.5rem)] md:max-h-[calc(100dvh-3.5rem)] md:min-h-0 md:flex-col md:overflow-hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-warm-soft bg-paper px-ds-md md:px-ds-lg">
          <div>
            <h2 className="text-ds-title text-ink">{selectedContactName}</h2>
            <p className="hidden text-ds-caption text-soft md:block">页面4：已选中联系人</p>
          </div>
          <button
            className="rounded-md p-2 text-[#907f6f] hover:bg-[#f3eadf]"
            aria-label="关闭详情弹窗"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row md:overflow-hidden">
          <aside className="min-h-0 md:w-[60%] md:overflow-y-auto md:border-r md:border-warm-soft md:px-ds-lg md:py-ds-md">
            <div className="p-ds-md pb-24 md:p-0 md:pb-ds-md">{dataColumnInner}</div>
          </aside>

          {isDesktop ? renderDesktopAiColumn() : null}
        </div>
      </div>

      {!isDesktop ? (
        <>
          <div className="pointer-events-none fixed bottom-[calc(20px+env(safe-area-inset-bottom))] right-5 z-[999] flex flex-col items-center">
            <span className="pointer-events-none mb-2.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#5C4B3E] shadow-md">
              问晓观
            </span>
            <button
              type="button"
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#8B5A42] text-[#fffdf9] shadow-[0_4px_16px_rgba(80,50,35,0.35)] transition hover:scale-[1.03] active:scale-95"
              aria-label="问晓观"
              onClick={openMobileSheet}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fffdf9] text-sm font-semibold text-[#8B5A42]">
                观
              </span>
            </button>
          </div>

          {mobileAiOpen ? (
            <div className="fixed inset-0 z-[998]">
              <button
                type="button"
                className="absolute inset-0 bg-black/25"
                aria-label="关闭晓观"
                onClick={closeMobileSheet}
              />
              <div
                className="absolute bottom-0 left-0 right-0 flex min-h-0 flex-col rounded-t-2xl border-r border-[#ebe3d9] bg-white shadow-[0_-8px_32px_rgba(60,40,30,0.12)] motion-safe:[transition:transform_0.3s_ease-out]"
                style={{
                  height: `${sheetHeightPct}vh`,
                  maxHeight: "90vh",
                  transform:
                    sheetClosing || !sheetEntered ? "translateY(100%)" : `translateY(-${keyboardShift}px)`,
                }}
              >
                <div
                  ref={sheetHandleRef}
                  className="flex h-2 shrink-0 cursor-ns-resize touch-none items-center justify-center rounded-t-2xl bg-white pt-1"
                  onPointerDown={(e) => {
                    dragRef.current = { startY: e.clientY, startPct: sheetPctRef.current }
                    sheetHandleRef.current?.setPointerCapture(e.pointerId)
                  }}
                  onPointerMove={(e) => {
                    if (!dragRef.current) return
                    const dy = dragRef.current.startY - e.clientY
                    const deltaPct = (dy / window.innerHeight) * 100
                    const next = Math.min(90, Math.max(30, dragRef.current.startPct + deltaPct))
                    setSheetHeightPct(next)
                  }}
                  onPointerUp={(e) => {
                    if (sheetPctRef.current < 30) closeMobileSheet()
                    dragRef.current = null
                    try {
                      sheetHandleRef.current?.releasePointerCapture(e.pointerId)
                    } catch {
                      /* released */
                    }
                  }}
                  onPointerCancel={(e) => {
                    dragRef.current = null
                    try {
                      sheetHandleRef.current?.releasePointerCapture(e.pointerId)
                    } catch {
                      /* released */
                    }
                  }}
                >
                  <span className="h-0.5 w-10 rounded-full bg-[#c4b8ad]" />
                </div>

                <div className="flex h-[70px] shrink-0 items-center gap-2 border-b border-[#ebe3d9] px-3">
                  <XiaoguanAvatar className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[16px] font-semibold leading-snug text-[#5C4B3E]">
                      晓观 · 关于 {selectedContactName ?? "联系人"} 的专属分析
                    </h3>
                    <p className="text-[12px] leading-relaxed text-[#8a7d72]">
                      晓观基于TA的档案与你们的互动记录，为你提供专属建议
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-md p-2 text-[#907f6f] hover:bg-[#f3eadf]"
                    aria-label="关闭"
                    onClick={closeMobileSheet}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div ref={chatScrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-3">
                  {renderChatMessages(true)}
                </div>

                <div className="flex h-14 shrink-0 flex-col justify-center border-t border-[#ebe3d9] bg-white px-2">
                  {renderQuickRow("")}
                  {renderCustomPromptEditor()}
                </div>

                <div className="min-h-[80px] shrink-0">{renderInputFooter(true)}</div>
                {advisorError ? (
                  <p className="shrink-0 bg-white px-3 pb-2 text-center text-ds-caption font-medium text-[#b42318]" role="alert">
                    {advisorError}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {selectedContact && showTrueFriendReport ? (
        <Dialog
          open={showTrueFriendReport}
          onClose={() => setShowTrueFriendReport(false)}
          title={`真朋友验证 · ${selectedContact.name}`}
          description="基于当前档案与互动记录的关系摘要"
          maxWidthClassName="max-w-lg"
        >
          {(() => {
            const rep = buildTrueFriendReport(selectedContact, interactionLogs)
            return (
              <div className="space-y-ds-md text-ds-body text-soft">
                <div>
                  <p className="text-ds-title text-ink">支持「真朋友」的证据</p>
                  <ul className="mt-1 list-inside list-disc space-y-1">
                    {rep.support.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-ds-title text-ink">需要留意的反证</p>
                  <ul className="mt-1 list-inside list-disc space-y-1">
                    {rep.against.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <p className="rounded-ds border border-warm-soft bg-surface-warm-soft p-ds-xs text-ink">{rep.summary}</p>
              </div>
            )
          })()}
        </Dialog>
      ) : null}
    </section>
  )
}
