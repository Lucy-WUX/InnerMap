import { useEffect, useState } from "react"
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
    setHasHistory(false)
  }, [selectedContactName])

  const welcomeMessage = `👋 我是观系。关于${selectedContactName ?? "TA"}，我看到你给 TA 标记了“${
    selectedContactGroup ?? "关系"
  }”和“${selectedContactTraits || "敏感"}”。有什么想和我聊的吗？`

  const scoreCircleStyle = (value: number, color: string) => ({
    background: `conic-gradient(${color} 0 ${(value / 10) * 100}%, #eee7dd ${(value / 10) * 100}% 100%)`,
  })

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
            <button onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-ds-xs grid grid-cols-2 gap-ds-xs">
            <Button onClick={openInteractionDialog}>📝 记录互动</Button>
            <Button variant="outline" onClick={openEditContact}>
              ✏️ 编辑档案
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
                    我觉得最近和 TA 有点疏远了...
                  </div>
                  <div className="w-[92%] rounded-ds bg-slate-100 p-ds-xs text-ds-body">
                    我注意到你记录的上次互动是 3 天前，当时能量变化为 +2，TA 主动关心了你。疏远感可能来自你的内疚（备注中提到答应内推未做）。以下是两个小建议...
                    <p className="mt-1 text-ds-caption text-soft">基于你记录的 3 次互动生成</p>
                  </div>
                </>
              ) : (
                <div className="w-[92%] rounded-ds bg-slate-100 p-ds-xs text-ds-body">
                  {welcomeMessage}
                  <p className="mt-1 text-ds-caption text-soft">首次进入该联系人分析面板</p>
                </div>
              )}
            </div>
              </>
            ) : (
              <div className="space-y-2">
                {interactionLogs.length > 0 ? (
                  interactionLogs.map((log) => (
                    <div key={log.id} className="rounded-ds border border-warm-soft bg-surface-warm-soft p-ds-xs">
                      <p className="text-ds-caption font-medium text-ink">
                        {log.date} · {log.type} · 能量 {log.energy >= 0 ? `+${log.energy}` : log.energy}
                        {log.meaningful ? " · 有意义" : ""}
                      </p>
                      <p className="mt-1 text-ds-caption text-soft">我：{log.what || "（未填写）"}</p>
                      <p className="text-ds-caption text-soft">TA：{log.reaction || "（未填写）"}</p>
                      {log.aiInsight ? (
                        <p className="mt-ds-xs rounded-btn-ds bg-[#f0f7f2] px-ds-xs py-1 text-ds-caption text-[#2E7D32]">
                          AI：{log.aiInsight}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-ds-caption text-soft">暂无互动记录</p>
                )}
              </div>
            )}
          </Card>

          <div className="my-ds-xs space-y-ds-xs">
            <div className="flex items-center gap-ds-xs overflow-x-auto pb-1">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  className="shrink-0 rounded-full border border-warm-soft bg-[#f3f2ef] px-3 py-1 text-ds-caption transition-colors hover:bg-[#efe6d7]"
                  onClick={() => {
                    setDetailInput(q)
                    setHasHistory(true)
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
                    setHasHistory(true)
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
              if (e.target.value.trim()) setHasHistory(true)
            }}
          />
          <div className="mt-ds-xs flex justify-end">
            <Button className="transition-all hover:-translate-y-0.5 hover:shadow-ds-card-hover" onClick={() => setHasHistory(true)}>
              发送
            </Button>
          </div>
          {interactionAiStatus === "analyzing" ? <p className="mt-1 text-ds-caption text-[#7a5a2e]">AI 分析中...</p> : null}
          {interactionAiStatus === "done" ? <p className="mt-1 text-ds-caption text-[#0f766e]">AI 已分析本次互动，关系评分已更新</p> : null}
        </div>
      </aside>

      {selectedContact && showTrueFriendReport ? (
        <Dialog
          open={showTrueFriendReport}
          onClose={() => setShowTrueFriendReport(false)}
          title={`真朋友验证 · ${selectedContact.name}`}
          description="基于当前档案与互动记录的演示报告"
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
