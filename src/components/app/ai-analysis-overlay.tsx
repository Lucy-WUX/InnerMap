import { useState } from "react"
import { X } from "lucide-react"

import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Textarea } from "../ui/textarea"

type AiAnalysisOverlayProps = {
  aiInput: string
  setAiInput: (value: string) => void
  onClose: () => void
  buildAdvisorContext: () => string
}

export function AiAnalysisOverlay({
  aiInput,
  setAiInput,
  onClose,
  buildAdvisorContext,
}: AiAnalysisOverlayProps) {
  const [reply, setReply] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    const message = aiInput.trim()
    if (!message || loading) return
    setError("")
    setReply("")
    setLoading(true)
    try {
      const res = await fetch("/api/ai/contact-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
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
        setError(typeof data.error === "string" ? data.error : `请求失败（${res.status}）`)
        return
      }
      const text = typeof data.reply === "string" ? data.reply : ""
      if (!text) {
        setError("模型未返回内容，请重试。")
        return
      }
      setReply(text)
    } catch {
      setError("网络异常，请稍后重试。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-ds border border-warm-base bg-paper p-ds-lg">
      <div className="mb-ds-xs flex items-center justify-between">
        <h2 className="text-ds-title">晓观页</h2>
        <button
          className="rounded-md p-2 text-[#907f6f] hover:bg-[#f3eadf]"
          aria-label="关闭晓观页"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="mb-ds-xs text-ds-body text-soft">
        晓观不会向界面注入任何演示回复；上下文来自你本机已保存的联系人、分组、日记与互动。若本机已启动 Next 且配置了 AI
        密钥，可通过「发送」调用同域 API 获得分析（无需登录）。
      </p>
      <Card className="mb-ds-xs rounded-ds border border-warm-soft bg-surface-warm-soft p-ds-md text-ds-caption text-[#5c4d42]">
        纯本地模式下数据只存于浏览器；AI 请求仍走当前站点的 /api（不读写 Supabase）。未配置密钥时会返回明确错误提示。
      </Card>
      <div className="mt-ds-xs flex flex-wrap gap-ds-xs">
        {["如何化解矛盾", "如何提出请求", "识别对方的意图"].map((tag) => (
          <button key={tag} className="rounded-btn-ds border px-3 py-1 text-ds-caption" type="button" onClick={() => setAiInput(tag)}>
            {tag}
          </button>
        ))}
      </div>
      <Textarea
        className="mt-ds-xs min-h-24"
        value={aiInput}
        onChange={(e) => setAiInput(e.target.value)}
        placeholder="输入你想讨论的问题…"
      />
      <div className="mt-ds-xs flex justify-end gap-ds-xs">
        <Button type="button" disabled={loading || !aiInput.trim()} onClick={() => void handleSend()}>
          {loading ? "分析中…" : "发送"}
        </Button>
      </div>
      {error ? (
        <p className="mt-ds-xs text-ds-caption text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {reply ? (
        <Card className="mt-ds-md rounded-ds border border-warm-base bg-surface-warm-soft p-ds-md">
          <p className="mb-ds-xs text-ds-caption font-medium text-soft">回复</p>
          <p className="whitespace-pre-wrap text-ds-body text-ink">{reply}</p>
        </Card>
      ) : null}
    </section>
  )
}
