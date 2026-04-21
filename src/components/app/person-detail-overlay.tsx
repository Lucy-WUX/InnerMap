import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"

import { buildTrueFriendReport, type ScoreHistoryPoint } from "../../lib/relationship-ai-demo"
import type { RelationContact } from "./types"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Dialog } from "../ui/dialog"
import { Textarea } from "../ui/textarea"
import { ScoreTrendChart } from "./score-trend-chart"

type PersonDetailOverlayProps = {
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
  const [quickPrompts, setQuickPrompts] = useState([
    "🤔 我们之间的问题出在哪？",
    "💬 该怎么和 TA 沟通难事？",
    "🔁 我重复什么模式？",
    "❓ 真朋友还是表面关系？",
    "📂 建议移到哪个分组？",
  ])
  const [customPrompt, setCustomPrompt] = useState("")
  const [showCustomPromptInput, setShowCustomPromptInput] = useState(false)
  const [hasHistory, setHasHistory] = useState(false)
  const [activeTab, setActiveTab] = useState<"advisor" | "history">("advisor")
  const [showTrueFriendReport, setShowTrueFriendReport] = useState(false)
  const [latestUserMessage, setLatestUserMessage] = useState("")
  const [aiReplyText, setAiReplyText] = useState("")
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [advisorError, setAdvisorError] = useState("")
  const typeTimerRef = useRef<number | null>(null)

  function clearTypeTimer() {
    const id = typeTimerRef.current
    if (id != null) {
      window.clearInterval(id)
      typeTimerRef.current = null
    }
  }

  useEffect(() => () => clearTypeTimer(), [])

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

  useEffect(() => {
    clearTypeTimer()
    setHasHistory(false)
    setLatestUserMessage("")
    setAiReplyText("")
    setIsAiTyping(false)
    setAdvisorError("")
  }, [selectedContactName])

  const welcomeMessage = "请输入你的问题并发送。系统仅在模型返回后展示分析结果。"

  const scoreCircleStyle = (value: number, color: string) => ({
    background: `conic-gradient(${color} 0 ${(value / 10) * 100}%, #eee7dd ${(value / 10) * 100}% 100%)`,
  })

  async function triggerAiReply(input: string) {
    const userMessage = input.trim()
    if (!userMessage) return
    clearTypeTimer()
    setHasHistory(true)
    setLatestUserMessage(userMessage)
    setAdvisorError("")
    setIsAiTyping(true)
    setAiReplyText("")

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
        const err = typeof data.error === "string" ? data.error : `请求失败（${res.status}）`
        setAdvisorError(err)
        setAiReplyText("")
        setIsAiTyping(false)
        return
      }

      const reply = typeof data.reply === "string" ? data.reply : ""
      if (!reply) {
        setAdvisorError("模型未返回内容，请重试。")
        setIsAiTyping(false)
        return
      }

      let index = 0
      const step = 3
      const timerId = window.setInterval(() => {
        index += step
        setAiReplyText(reply.slice(0, Math.min(index, reply.length)))
        if (index >= reply.length) {
          clearTypeTimer()
          setIsAiTyping(false)
        }
      }, 18)
      typeTimerRef.current = timerId
    } catch {
      setAdvisorError("网络异常，请检查连接后重试。")
      setAiReplyText("")
      setIsAiTyping(false)
    }
  }

  return (
    <section>
      <aside className="rounded-ds border border-warm-base bg-paper p-ds-lg">
        <div
          onContextMenu={(event) => {
            event.preventDefault()
            openInteractionDialog()
          }}
        >
          <div className="mb-ds-xs flex items-start justify-between">
            <div>
              <h2 className="text-ds-title">{selectedContactName}</h2>
              <p className="text-ds-caption text-soft">页面4：已选中联系人</p>
            </div>
            <button
              className="rounded-md p-2 text-[#907f6f] hover:bg-[#f3eadf]"
              aria-label="关闭详情弹窗"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-ds-xs grid grid-cols-1 gap-ds-xs sm:grid-cols-3">
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
                <div className="relative h-16 w-16 rounded-full p-[5px]" style={scoreCircleStyle(friendScoreValue, "#66BB6A")}>
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
                <div className="relative h-16 w-16 rounded-full p-[5px]" style={scoreCircleStyle(surfaceScoreValue, "#BDBDBD")}>
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
            <p className="text-ds-caption font-medium text-soft">相处模式（观系）</p>
            <p className="mt-1 text-ds-body text-ink">{patternSummary}</p>
          </Card>

          <Card className="rounded-ds border border-warm-base p-ds-md">
            <div className="mb-ds-xs flex gap-1">
              <button
                className={`rounded-btn-ds border px-2 py-1 text-ds-caption ${activeTab === "advisor" ? "border-[#6366F1] bg-[#EEF2FF] text-[#3730A3]" : "border-warm-soft bg-paper text-soft"}`}
                onClick={() => setActiveTab("advisor")}
              >
                AI 顾问
              </button>
              <button
                className={`rounded-btn-ds border px-2 py-1 text-ds-caption ${activeTab === "history" ? "border-[#6366F1] bg-[#EEF2FF] text-[#3730A3]" : "border-warm-soft bg-paper text-soft"}`}
                onClick={() => setActiveTab("history")}
              >
                互动历史
              </button>
            </div>
            {activeTab === "advisor" ? (
              <>
            <h3 className="text-ds-title">🤖 观系 · 关于 {selectedContactName} 的顾问</h3>
            <div className="mt-ds-xs space-y-ds-xs">
              {hasHistory ? (
                <>
                <div className="ml-auto w-[86%] rounded-ds bg-[#DBEAFE] p-ds-xs text-ds-body">
                    {latestUserMessage}
                  </div>
                  <div className="w-[92%] rounded-ds bg-slate-100 p-ds-xs text-ds-body">
                    {isAiTyping ? (
                      <span>
                        {aiReplyText}
                        <span className="ml-0.5 inline-block animate-pulse">|</span>
                      </span>
                    ) : (
                      aiReplyText
                    )}
                    <p className="mt-1 text-ds-caption text-soft">由大模型基于上方档案与互动记录生成</p>
                  </div>
                </>
              ) : (
                <div className="w-[92%] rounded-ds bg-slate-100 p-ds-xs text-ds-body">
                  {welcomeMessage}
                  <p className="mt-1 text-ds-caption text-soft">当前未生成 AI 分析</p>
                </div>
              )}
            </div>
              </>
            ) : (
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
                    记录你与 TA 的每一次互动，AI 会自动评估关系变化
                  </p>
                )}
              </div>
            )}
          </Card>

          <div className="my-ds-xs space-y-ds-xs">
            <div className="flex items-center gap-ds-xs overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  className="shrink-0 rounded-full border border-warm-soft bg-[#f3f2ef] px-3 py-1 text-ds-caption transition-colors hover:bg-[#efe6d7]"
                  onClick={() => {
                    setDetailInput(q)
                    triggerAiReply(q)
                  }}
                >
                  {q}
                </button>
              ))}
              <button
                className="shrink-0 rounded-full border border-warm-strong bg-surface-warm-soft px-3 py-1 text-ds-caption transition-colors hover:bg-[#efe6d7]"
                onClick={() => setShowCustomPromptInput((prev) => !prev)}
              >
                + 自定义
              </button>
            </div>
            {showCustomPromptInput ? (
              <div className="flex gap-ds-xs">
                <input
                  className="flex-1 rounded-btn-ds border border-warm-soft px-2 py-1 text-ds-caption"
                  placeholder="例如：帮我写一段缓和关系的话"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
                <button
                  className="rounded-btn-ds border border-warm-soft bg-white px-2 py-1 text-ds-caption hover:bg-surface-warm-soft"
                  onClick={() => {
                    const next = customPrompt.trim()
                    if (!next) return
                    setQuickPrompts((prev) => [next, ...prev])
                    setDetailInput(next)
                    setCustomPrompt("")
                    setShowCustomPromptInput(false)
                    triggerAiReply(next)
                  }}
                >
                  添加
                </button>
              </div>
            ) : null}
          </div>

          <Textarea
            className="min-h-24 focus-visible:border-[#795548]"
            placeholder="输入你的困惑..."
            value={detailInput}
            onChange={(e) => {
              setDetailInput(e.target.value)
            }}
          />
          <div className="mt-ds-xs flex justify-end">
            <Button
              className="transition-all hover:-translate-y-0.5 hover:shadow-ds-card-hover"
              disabled={isAiTyping}
              onClick={() => void triggerAiReply(detailInput)}
            >
              {isAiTyping ? "生成中…" : "发送"}
            </Button>
          </div>
          {advisorError ? (
            <p className="mt-ds-xs text-ds-caption font-medium text-[#b42318]" role="alert">
              {advisorError}
            </p>
          ) : null}
          {interactionAiStatus === "analyzing" ? <p className="mt-1 text-ds-caption text-[#7a5a2e]">AI 分析中...</p> : null}
          {interactionAiStatus === "done" ? <p className="mt-1 text-ds-caption text-[#0f766e]">AI 已分析本次互动，关系评分已更新</p> : null}
        </div>
      </aside>

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
