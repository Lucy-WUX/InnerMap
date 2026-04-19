import { X } from "lucide-react"

import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Textarea } from "../ui/textarea"

type AiAnalysisOverlayProps = {
  aiInput: string
  setAiInput: (value: string) => void
  onClose: () => void
}

export function AiAnalysisOverlay({ aiInput, setAiInput, onClose }: AiAnalysisOverlayProps) {
  return (
    <section className="rounded-ds border border-warm-base bg-paper p-ds-lg">
      <div className="mb-ds-xs flex items-center justify-between">
        <h2 className="text-ds-title">AI 分析页</h2>
        <button onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="mb-ds-xs text-ds-body text-soft">正在基于近期关系记录进行分析</p>
      <div className="space-y-ds-xs">
        <div className="ml-auto w-[80%] rounded-ds bg-[#DBEAFE] p-ds-xs text-ds-body">
          {aiInput || "我该如何更有效地沟通？"}
        </div>
        <div className="w-[85%] rounded-ds bg-slate-100 p-ds-xs text-ds-body">
          建议先说事实和感受，再提出单一、可执行的小请求。
        </div>
      </div>
      <div className="mt-ds-xs flex flex-wrap gap-ds-xs">
        {["如何化解矛盾", "如何提出请求", "识别他的意图"].map((tag) => (
          <button key={tag} className="rounded-btn-ds border px-3 py-1 text-ds-caption" onClick={() => setAiInput(tag)}>
            {tag}
          </button>
        ))}
      </div>
      <Card className="mt-ds-xs rounded-ds border border-[#BFDBFE] bg-[#EFF6FF] p-ds-md text-ds-body">
        <p className="font-medium text-ds-body">回溯建议</p>
        <p className="mt-1 text-ds-caption text-soft">
          上月同类问题你选择回避，结果负向；这次建议先确认情绪，再表达边界。
        </p>
      </Card>
      <Textarea className="mt-ds-xs min-h-24" value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="继续输入..." />
      <div className="mt-ds-xs flex justify-end">
        <Button>发送</Button>
      </div>
    </section>
  )
}
