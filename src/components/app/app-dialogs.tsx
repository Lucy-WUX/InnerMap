import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react"

import { Button } from "../ui/button"
import { Dialog } from "../ui/dialog"
import { Textarea } from "../ui/textarea"

import type { GroupKey } from "./types"

type ContactFormState = {
  name: string
  group: GroupKey
  tags: string[]
  intimacy: number
  trueFriendScore: number
  surfaceRelationScore: number
  traits: string
  background: string
  privateNote: string
}

type InteractionFormState = {
  date: string
  type: string
  what: string
  feel: string
  reaction: string
  energy: number
  meaningful: boolean
}

type AppDialogsProps = {
  showNewGroupDialog: boolean
  setShowNewGroupDialog: (value: boolean) => void
  newGroupName: string
  setNewGroupName: (value: string) => void
  handleCreateGroup: () => void
  showContactDialog: boolean
  setShowContactDialog: (value: boolean) => void
  isEditingContact: boolean
  contactForm: ContactFormState
  setContactForm: Dispatch<SetStateAction<ContactFormState>>
  tagInput: string
  setTagInput: (value: string) => void
  allGroups: GroupKey[]
  allTags: string[]
  showRecommendHint: boolean
  smartGrouping: boolean
  setSmartGrouping: (value: boolean) => void
  setShowRecommendHint: (value: boolean) => void
  saveContactForm: () => void
  contactFormError?: string
  showInteractionDialog: boolean
  setShowInteractionDialog: (value: boolean) => void
  selectedContactName?: string
  interactionForm: InteractionFormState
  setInteractionForm: Dispatch<SetStateAction<InteractionFormState>>
  saveInteraction: () => void
  interactionAiStatus: "idle" | "analyzing" | "done"
}

export function AppDialogs({
  showNewGroupDialog,
  setShowNewGroupDialog,
  newGroupName,
  setNewGroupName,
  handleCreateGroup,
  showContactDialog,
  setShowContactDialog,
  isEditingContact,
  contactForm,
  setContactForm,
  tagInput,
  setTagInput,
  allGroups,
  allTags,
  showRecommendHint,
  smartGrouping,
  setSmartGrouping,
  setShowRecommendHint,
  saveContactForm,
  contactFormError,
  showInteractionDialog,
  setShowInteractionDialog,
  selectedContactName,
  interactionForm,
  setInteractionForm,
  saveInteraction,
  interactionAiStatus,
}: AppDialogsProps) {
  const [groupSuggestLoading, setGroupSuggestLoading] = useState(false)
  const [liveSuggestedGroup, setLiveSuggestedGroup] = useState<GroupKey | "">("")
  const [interactionTemplates, setInteractionTemplates] = useState<Record<string, Pick<InteractionFormState, "what" | "reaction" | "feel">>>({})
  const energy = interactionForm.energy
  const energyTrackPercent = ((energy + 5) / 10) * 100
  const energyAccentColor = energy > 0 ? "#16a34a" : energy < 0 ? "#dc2626" : "#9ca3af"

  const suggestSourceText = useMemo(
    () => `${contactForm.traits} ${contactForm.background}`.trim(),
    [contactForm.traits, contactForm.background]
  )

  useEffect(() => {
    if (!showContactDialog) return
    if (!suggestSourceText) {
      setLiveSuggestedGroup("")
      setGroupSuggestLoading(false)
      return
    }
    setGroupSuggestLoading(true)
    const timer = setTimeout(() => {
      const text = suggestSourceText
      let next: GroupKey = "朋友"
      if (/家|父母|亲|家庭|家人/.test(text)) next = "家人"
      else if (/同事|工作|项目|汇报|团队/.test(text)) next = "同事"
      else if (/职业|客户|合作|商务|行业/.test(text)) next = "职业关系"
      else if (/同学|学校|大学|老师|课程/.test(text)) next = "同学"
      else if (/邻居|社群|兴趣/.test(text)) next = "其他"
      setLiveSuggestedGroup(next)
      setGroupSuggestLoading(false)
    }, 450)
    return () => clearTimeout(timer)
  }, [showContactDialog, suggestSourceText])

  useEffect(() => {
    if (!showInteractionDialog) return
    function onKeyDown(event: KeyboardEvent) {
      const isSave = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s"
      if (!isSave) return
      event.preventDefault()
      saveInteraction()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [saveInteraction, showInteractionDialog])

  return (
    <>
      <Dialog
        open={showNewGroupDialog}
        onClose={() => setShowNewGroupDialog(false)}
        title="新建分组"
        description="创建后会立即出现在联系人分组里。"
      >
        <div className="space-y-ds-xs">
          <input
            className="w-full rounded-btn-ds border border-warm-soft px-3 py-2 text-ds-body"
            placeholder="例如：兴趣伙伴"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <div className="flex justify-end gap-ds-xs">
            <Button className="border-warm-soft bg-white" variant="outline" onClick={() => setShowNewGroupDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateGroup}>创建</Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={showContactDialog}
        onClose={() => setShowContactDialog(false)}
        title={isEditingContact ? `编辑 ${contactForm.name || "联系人"}` : "新建联系人"}
        description="画布双击、左侧＋或右键菜单可触发。"
      >
        <div className="space-y-ds-xs">
          <label className="block text-ds-body font-medium">
            姓名 *
            <input
              className="mt-1 w-full rounded-btn-ds border border-warm-soft px-3 py-2 text-ds-body"
              placeholder="例如：张三"
              value={contactForm.name}
              onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </label>
          <label className="block text-ds-body font-medium">
            <span className="flex items-center justify-between">
              <span>分组 *</span>
              <span className="text-ds-caption font-normal text-soft">
                {groupSuggestLoading
                  ? "AI 识别中..."
                  : liveSuggestedGroup
                    ? `建议：${liveSuggestedGroup}`
                    : "输入特点后自动建议"}
              </span>
            </span>
            <select
              className="mt-1 w-full rounded-btn-ds border border-warm-soft px-3 py-2 text-ds-body"
              value={contactForm.group}
              onChange={(e) => setContactForm((prev) => ({ ...prev, group: e.target.value as GroupKey }))}
            >
              {allGroups.map((group) => (
                <option key={group}>{group}</option>
              ))}
            </select>
          </label>
          <label className="block text-ds-body font-medium">
            标签
            <input
              className="mt-1 w-full rounded-btn-ds border border-warm-soft px-3 py-2 text-ds-body"
              placeholder="输入后回车添加"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  const next = tagInput.trim()
                  if (!next) return
                  setContactForm((prev) =>
                    prev.tags.includes(next) ? prev : { ...prev, tags: [...prev.tags, next] }
                  )
                  setTagInput("")
                }
              }}
            />
            {tagInput.trim() ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {allTags
                  .filter((tag) => tag.includes(tagInput.trim()) && !contactForm.tags.includes(tag))
                  .slice(0, 5)
                  .map((tag) => (
                    <button
                      key={tag}
                      className="rounded-btn-ds border border-warm-soft bg-surface-warm-soft px-2 py-0.5 text-ds-caption text-soft"
                      onClick={() => {
                        setContactForm((prev) => (prev.tags.includes(tag) ? prev : { ...prev, tags: [...prev.tags, tag] }))
                        setTagInput("")
                      }}
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            ) : null}
          </label>
          <div className="flex flex-wrap gap-ds-xs">
            {contactForm.tags.map((tag) => (
              <button
                key={tag}
                className="rounded-btn-ds border border-warm-soft bg-surface-warm-soft px-2 py-1 text-ds-caption"
                onClick={() => setContactForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))}
              >
                #{tag} ×
              </button>
            ))}
          </div>
          <label className="block text-ds-body font-medium">
            亲密度：{contactForm.intimacy}
            <input
              type="range"
              min={1}
              max={10}
              value={contactForm.intimacy}
              onChange={(e) => setContactForm((prev) => ({ ...prev, intimacy: Number(e.target.value) }))}
              className="mt-1 w-full"
            />
          </label>
          <div className="grid gap-ds-xs sm:grid-cols-2">
            <label className="block text-ds-body font-medium">
              真朋友指数：{contactForm.trueFriendScore.toFixed(1)}
              <div className="mt-1 space-y-1">
                <div className="h-2 w-full rounded-full bg-[#efe7db]">
                  <div
                    className="h-full rounded-full bg-[#4f9d69]"
                    style={{ width: `${Math.max(0, Math.min(100, contactForm.trueFriendScore * 10))}%` }}
                  />
                </div>
                <p className="text-[11px] font-normal text-soft">由 AI 根据互动记录自动计算（只读）</p>
              </div>
            </label>
            <label className="block text-ds-body font-medium">
              表面关系指数：{contactForm.surfaceRelationScore.toFixed(1)}
              <div className="mt-1 space-y-1">
                <div className="h-2 w-full rounded-full bg-[#efe7db]">
                  <div
                    className="h-full rounded-full bg-[#a18f7a]"
                    style={{ width: `${Math.max(0, Math.min(100, contactForm.surfaceRelationScore * 10))}%` }}
                  />
                </div>
                <p className="text-[11px] font-normal text-soft">由 AI 根据互动记录自动计算（只读）</p>
              </div>
            </label>
          </div>
          <Textarea
            placeholder="性格特点（如：回避冲突、敏感、幽默...）"
            value={contactForm.traits}
            onChange={(e) => setContactForm((prev) => ({ ...prev, traits: e.target.value }))}
          />
          <Textarea
            placeholder="成长背景（如：单亲家庭、近期工作变动...）"
            value={contactForm.background}
            onChange={(e) => setContactForm((prev) => ({ ...prev, background: e.target.value }))}
          />
          <Textarea
            placeholder="私人备注（任何你想记下的...）"
            value={contactForm.privateNote}
            onChange={(e) => setContactForm((prev) => ({ ...prev, privateNote: e.target.value }))}
          />
          {showRecommendHint ? (
            <p className="text-ds-caption text-[#0F766E]">
              建议分组：{contactForm.group}（根据你输入的“{contactForm.background.slice(0, 6) || "同事"}”和“{contactForm.traits.slice(0, 6) || "敏感"}”标签）
            </p>
          ) : null}
          {contactFormError ? (
            <p className="text-ds-caption font-medium text-[#b42318]" role="alert">
              {contactFormError}
            </p>
          ) : null}
          <div className="sticky bottom-0 -mx-5 mt-ds-md flex items-center justify-between border-t border-warm-base bg-surface-warm-elevated px-ds-lg py-ds-xs">
            <Button
              variant="outline"
              disabled={smartGrouping}
              onClick={() => {
                setSmartGrouping(true)
                setShowRecommendHint(false)
                setTimeout(() => {
                  setSmartGrouping(false)
                  setShowRecommendHint(true)
                  setContactForm((prev) => ({ ...prev, group: "朋友" }))
                }, 800)
              }}
            >
              {smartGrouping ? "推荐中..." : "✨ 智能推荐分组"}
            </Button>
            <div className="flex gap-ds-xs">
              <Button className="border-warm-soft bg-white" variant="outline" onClick={() => setShowContactDialog(false)}>
                取消
              </Button>
              <Button onClick={saveContactForm}>保存</Button>
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={showInteractionDialog}
        onClose={() => setShowInteractionDialog(false)}
        title={`记录与 ${selectedContactName} 的互动`}
        description="保存后可刷新右侧评分示意。"
        maxWidthClassName="max-w-[460px]"
      >
        <div className="space-y-ds-xs">
          <Textarea
            placeholder="描述一下..."
            value={interactionForm.what}
            onChange={(e) => setInteractionForm((prev) => ({ ...prev, what: e.target.value }))}
          />
          <Textarea
            placeholder="TA说了什么，做了什么"
            value={interactionForm.reaction}
            onChange={(e) => setInteractionForm((prev) => ({ ...prev, reaction: e.target.value }))}
          />
          <label className="block text-ds-body font-medium">
            日期
            <input
              type="date"
              className="mt-1 w-full rounded-btn-ds border border-warm-soft px-3 py-2 text-ds-body"
              value={interactionForm.date}
              onChange={(e) => setInteractionForm((prev) => ({ ...prev, date: e.target.value }))}
            />
          </label>
          <label className="block text-ds-body font-medium">
            互动类型
            <select
              className="mt-1 w-full rounded-btn-ds border border-warm-soft px-3 py-2 text-ds-body"
              value={interactionForm.type}
              onChange={(e) => setInteractionForm((prev) => ({ ...prev, type: e.target.value }))}
            >
              {["微信聊天", "见面吃饭", "电话", "送礼", "吵架", "帮助", "被帮助"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-1">
            <button
              className="rounded-btn-ds border border-warm-soft px-2 py-1 text-ds-caption"
              onClick={() =>
                setInteractionTemplates((prev) => ({
                  ...prev,
                  [interactionForm.type]: {
                    what: interactionForm.what,
                    reaction: interactionForm.reaction,
                    feel: interactionForm.feel,
                  },
                }))
              }
            >
              保存为模板
            </button>
            <button
              className="rounded-btn-ds border border-warm-soft px-2 py-1 text-ds-caption"
              onClick={() => {
                const tpl = interactionTemplates[interactionForm.type]
                if (!tpl) return
                setInteractionForm((prev) => ({ ...prev, ...tpl }))
              }}
            >
              一键填充模板
            </button>
          </div>
          <Textarea
            placeholder="当时或事后的情绪"
            value={interactionForm.feel}
            onChange={(e) => setInteractionForm((prev) => ({ ...prev, feel: e.target.value }))}
          />
          <div>
            <p className="mb-1 text-ds-body font-medium">能量变化</p>
            <div className="mb-1 flex items-center justify-between text-ds-caption text-soft">
              <span>😫 -2</span>
              <span>😐 0</span>
              <span>🙂 +2</span>
            </div>
            <input
              type="range"
              min={-5}
              max={5}
              value={interactionForm.energy}
              onChange={(e) => setInteractionForm((prev) => ({ ...prev, energy: Number(e.target.value) }))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full"
              style={{
                background:
                  energy === 0
                    ? "#e5e7eb"
                    : energy > 0
                      ? `linear-gradient(90deg, #e5e7eb 0%, #e5e7eb 50%, #86efac ${50 + energyTrackPercent / 2}%, #16a34a 100%)`
                      : `linear-gradient(90deg, #dc2626 0%, #fca5a5 ${energyTrackPercent}%, #e5e7eb 50%, #e5e7eb 100%)`,
                accentColor: energyAccentColor,
              }}
            />
            <div className="mt-1 flex justify-between text-ds-caption text-soft">
              <span>-5</span>
              <span>+5</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-ds-caption text-soft">
              <span>-1 略感疲惫</span>
              <span>+1 轻松愉快</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-ds border border-warm-soft bg-surface-warm-soft px-3 py-2">
            <div>
              <p className="text-ds-body font-medium">是否有意义</p>
              <p className="text-ds-caption text-soft">默认关闭</p>
            </div>
            <button
              type="button"
              className={`relative h-6 w-11 rounded-full transition ${
                interactionForm.meaningful ? "bg-[#66BB6A]" : "bg-slate-200"
              }`}
              onClick={() => setInteractionForm((prev) => ({ ...prev, meaningful: !prev.meaningful }))}
              aria-label="是否有意义"
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  interactionForm.meaningful ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
          <div className="flex justify-end gap-ds-xs">
            <Button className="border-warm-soft bg-white" variant="outline" onClick={() => setShowInteractionDialog(false)}>
              取消
            </Button>
            <Button onClick={saveInteraction}>保存</Button>
          </div>
          {interactionAiStatus === "analyzing" ? (
            <p className="text-ds-caption text-[#7a5a2e]">AI 正在分析本次互动...</p>
          ) : null}
          {interactionAiStatus === "done" ? (
            <p className="text-ds-caption text-[#0f766e]">AI 已分析本次互动，关系评分已更新</p>
          ) : null}
        </div>
      </Dialog>

    </>
  )
}
