import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"

import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Dialog } from "../ui/dialog"
import { Textarea } from "../ui/textarea"

import { DEFAULT_CONTACT_GROUP, type GroupKey } from "./types"

function intimacyHint(value: number): string {
  if (value <= 3) return "疏远"
  if (value <= 6) return "普通"
  if (value <= 9) return "亲密"
  return "挚友"
}

function energyHint(value: number): string {
  if (value <= -4) return "能量明显被消耗"
  if (value === -3) return "偏疲惫"
  if (value === -2) return "略感疲惫"
  if (value === -1) return "有一点累"
  if (value === 0) return "平和 · 中性"
  if (value === 1) return "略感轻松"
  if (value <= 3) return "轻松愉快"
  return "明显被滋养"
}

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

function useEscapeToClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      event.preventDefault()
      onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])
}

function UnifiedAppModal({
  open,
  onBackdropClick,
  onDismiss,
  titleId,
  title,
  children,
  footer,
}: {
  open: boolean
  onBackdropClick: () => void
  onDismiss: () => void
  titleId: string
  title: string
  children: ReactNode
  footer: ReactNode
}) {
  useEscapeToClose(open, onDismiss)
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-[#412f1f]/30 p-3 backdrop-blur-[8px] sm:items-center sm:p-6"
      onClick={onBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="flex max-h-[min(92dvh,calc(100dvh-1.5rem-env(safe-area-inset-bottom)))] min-h-0 w-full max-w-[520px] flex-col overflow-hidden rounded-[16px] border border-[#e4d8cb] bg-paper shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0 px-6 pb-2 pt-6">
          <h2 id={titleId} className="text-ds-title font-semibold text-ink">
            {title}
          </h2>
          <button
            type="button"
            aria-label="关闭弹窗"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md text-soft transition hover:bg-[#f3eadf]"
            onClick={onDismiss}
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4">{children}</div>
        <div className="flex shrink-0 items-center justify-end gap-ds-xs border-t border-[#e5e7eb] px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      </div>
    </div>
  )
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
  contactSaving: boolean
  contactFormError?: string
  clearContactFormError?: () => void
  storageScope?: string
  selectedContactId?: string
  showInteractionDialog: boolean
  setShowInteractionDialog: (value: boolean) => void
  selectedContactName?: string
  interactionForm: InteractionFormState
  setInteractionForm: Dispatch<SetStateAction<InteractionFormState>>
  saveInteraction: () => boolean
  resetInteractionForm: () => void
  interactionSaving: boolean
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
  contactSaving,
  contactFormError,
  clearContactFormError,
  storageScope = "guest",
  selectedContactId,
  showInteractionDialog,
  setShowInteractionDialog,
  selectedContactName,
  interactionForm,
  setInteractionForm,
  saveInteraction,
  resetInteractionForm,
  interactionSaving,
  interactionAiStatus,
}: AppDialogsProps) {
  const [interactionTemplates, setInteractionTemplates] = useState<Record<string, Pick<InteractionFormState, "what" | "reaction" | "feel">>>({})
  const energy = interactionForm.energy
  const energyTrackPercent = ((energy + 5) / 10) * 100
  const energyAccentColor = energy > 0 ? "#2d7a4a" : energy < 0 ? "#b42318" : "#a39a91"
  const nameMissing = !contactForm.name.trim()
  const groupMissing = !contactForm.group || !String(contactForm.group).trim()
  const [contactSubmitError, setContactSubmitError] = useState("")
  const [contactSubmitSuccess, setContactSubmitSuccess] = useState(false)
  const [interactionSubmitError, setInteractionSubmitError] = useState("")
  const [interactionSubmitSuccess, setInteractionSubmitSuccess] = useState(false)

  const contactDraftKey = useMemo(() => {
    if (isEditingContact) return `contact-form-draft:${storageScope}:edit:${selectedContactId ?? "unknown"}`
    return `contact-form-draft:${storageScope}:new`
  }, [isEditingContact, selectedContactId, storageScope])
  const interactionDraftKey = useMemo(
    () => `interaction-form-draft:${storageScope}:${selectedContactId ?? "unknown"}`,
    [storageScope, selectedContactId]
  )
  const contactBaselineRef = useRef<{ form: ContactFormState; tagInput: string } | null>(null)
  const interactionBaselineRef = useRef<InteractionFormState | null>(null)

  function clearContactDraft() {
    if (typeof localStorage === "undefined") return
    localStorage.removeItem(contactDraftKey)
  }

  function persistContactDraft(nextForm: ContactFormState, nextTagInput: string) {
    if (typeof localStorage === "undefined") return
    try {
      localStorage.setItem(contactDraftKey, JSON.stringify({ form: nextForm, tagInput: nextTagInput, at: Date.now() }))
    } catch {
      // ignore draft persistence failures
    }
  }

  function clearInteractionDraft() {
    if (typeof localStorage === "undefined") return
    localStorage.removeItem(interactionDraftKey)
  }

  function persistInteractionDraft(next: InteractionFormState) {
    if (typeof localStorage === "undefined") return
    try {
      localStorage.setItem(interactionDraftKey, JSON.stringify({ form: next, at: Date.now() }))
    } catch {
      // ignore draft persistence failures
    }
  }

  async function handleContactSave() {
    setContactSubmitError("")
    setContactSubmitSuccess(false)
    clearContactFormError?.()

    try {
      const ok = (saveContactForm as unknown as () => boolean)()
      if (!ok) {
        setContactSubmitError(contactFormError?.trim() ? "" : "保存失败，请重试")
        return
      }
      setContactSubmitSuccess(true)
      clearContactDraft()
      // 保存成功后短暂提示，再自动关闭
      setTimeout(() => {
        setShowContactDialog(false)

        // 新建联系人：尝试滚动到新联系人（不改列表组件，仅做弱匹配）
        if (!isEditingContact) {
          const name = contactForm.name.trim()
          if (!name) return
          setTimeout(() => {
            const candidates = Array.from(document.querySelectorAll("button")).filter((el) => {
              const txt = (el as HTMLButtonElement).innerText?.trim?.() ?? ""
              return txt === name || txt.startsWith(name)
            })
            const target = candidates[0] as HTMLElement | undefined
            target?.scrollIntoView?.({ block: "center", behavior: "smooth" })
          }, 50)
        }
      }, 550)
    } catch {
      setContactSubmitError("保存失败，请重试")
    }
  }

  function handleContactCancel() {
    setContactSubmitError("")
    setContactSubmitSuccess(false)
    clearContactFormError?.()
    clearContactDraft()
    if (contactBaselineRef.current) {
      setContactForm(contactBaselineRef.current.form)
      setTagInput(contactBaselineRef.current.tagInput)
    }
    setShowContactDialog(false)
  }

  function handleInteractionCancel() {
    setInteractionSubmitError("")
    setInteractionSubmitSuccess(false)
    clearInteractionDraft()
    if (interactionBaselineRef.current) {
      setInteractionForm(interactionBaselineRef.current)
    }
    setShowInteractionDialog(false)
  }

  const handleInteractionSave = useCallback(() => {
    if (interactionSaving) return
    setInteractionSubmitError("")
    setInteractionSubmitSuccess(false)
    try {
      const ok = saveInteraction()
      if (!ok) {
        setInteractionSubmitError(!selectedContactId?.trim() ? "请先选择联系人" : "保存失败，请重试")
        return
      }
      setInteractionSubmitSuccess(true)
      clearInteractionDraft()
      setTimeout(() => {
        setShowInteractionDialog(false)
        resetInteractionForm()
      }, 550)
    } catch {
      setInteractionSubmitError("保存失败，请重试")
    }
  }, [
    interactionDraftKey,
    interactionSaving,
    saveInteraction,
    selectedContactId,
    resetInteractionForm,
    setShowInteractionDialog,
  ])

  // 打开时：记录 baseline；尝试恢复 draft
  useEffect(() => {
    if (!showContactDialog) return
    setContactSubmitError("")
    setContactSubmitSuccess(false)
    clearContactFormError?.()
    contactBaselineRef.current = { form: contactForm, tagInput }

    if (typeof localStorage === "undefined") return
    const raw = localStorage.getItem(contactDraftKey)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as { form?: ContactFormState; tagInput?: string }
      if (parsed.form) setContactForm(parsed.form)
      if (typeof parsed.tagInput === "string") setTagInput(parsed.tagInput)
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showContactDialog, contactDraftKey])

  // 关闭时：保留 draft（不清除），以支持“未保存关闭再次打开恢复”
  useEffect(() => {
    if (!showContactDialog) return
    persistContactDraft(contactForm, tagInput)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactForm, tagInput, showContactDialog])

  useEffect(() => {
    if (!showInteractionDialog) return
    setInteractionSubmitError("")
    setInteractionSubmitSuccess(false)
    interactionBaselineRef.current = interactionForm

    if (typeof localStorage === "undefined") return
    const raw = localStorage.getItem(interactionDraftKey)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as { form?: InteractionFormState }
      if (parsed.form) setInteractionForm(parsed.form)
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInteractionDialog, interactionDraftKey])

  useEffect(() => {
    if (!showInteractionDialog) return
    persistInteractionDraft(interactionForm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactionForm, showInteractionDialog])

  useEffect(() => {
    if (!showInteractionDialog) return
    function onKeyDown(event: KeyboardEvent) {
      const isSave = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s"
      if (!isSave) return
      event.preventDefault()
      handleInteractionSave()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleInteractionSave, showInteractionDialog])

  return (
    <>
      <Dialog
        open={showNewGroupDialog}
        onClose={() => setShowNewGroupDialog(false)}
        title="新建分组"
        description={"创建后会立即出现在联系人分组里。\n（与「观系」页列表同步）"}
      >
        <div className="space-y-ds-xs">
          <input
            className="w-full rounded-btn-ds border border-warm-soft px-3 py-2 text-ds-body"
            placeholder="例如：兴趣伙伴"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return
              e.preventDefault()
              handleCreateGroup()
            }}
          />
          <div className="flex justify-end gap-ds-xs">
            <Button className="border-warm-soft bg-white" variant="outline" onClick={() => setShowNewGroupDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
              创建
            </Button>
          </div>
        </div>
      </Dialog>

      <UnifiedAppModal
        open={showContactDialog}
        onBackdropClick={handleContactCancel}
        onDismiss={handleContactCancel}
        titleId="contact-dialog-title"
        title={isEditingContact ? "编辑档案" : "新建联系人"}
        footer={
          <>
            <Button
              variant="outline"
              className="h-11 rounded-[12px] border-[#d8c9b9] px-4"
              onClick={handleContactCancel}
              disabled={contactSaving}
            >
              取消
            </Button>
            <Button className="h-11 rounded-[12px] px-4" onClick={() => void handleContactSave()} disabled={contactSaving}>
              {contactSaving ? "保存中..." : "保存"}
            </Button>
          </>
        }
      >
        <div className="space-y-ds-xs">
          <label className="block text-ds-body font-medium">
            姓名 *
            <input
              className={cn(
                "mt-1 w-full rounded-btn-ds border px-3 py-2 text-ds-body transition-colors",
                nameMissing
                  ? "border-[#e8a8a8] bg-[#fff8f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a8a8]/80"
                  : "border-warm-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3ae98]/60"
              )}
              placeholder="请输入姓名"
              value={contactForm.name}
              onChange={(e) => {
                clearContactFormError?.()
                setContactForm((prev) => ({ ...prev, name: e.target.value }))
              }}
            />
          </label>
          <label className="block text-ds-body font-medium">
            <span className="flex items-center justify-between">
              <span>分组 *</span>
              <span className="text-ds-caption font-normal text-soft">请从列表选择，或使用「观系」页新建分组</span>
            </span>
            <select
              className={cn(
                "mt-1 w-full rounded-btn-ds border px-3 py-2 text-ds-body transition-colors",
                groupMissing
                  ? "border-[#e8a8a8] bg-[#fff8f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a8a8]/80"
                  : "border-warm-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3ae98]/60"
              )}
              value={contactForm.group}
              onChange={(e) => {
                clearContactFormError?.()
                setContactForm((prev) => ({ ...prev, group: e.target.value as GroupKey }))
              }}
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
              onInput={(e) =>
                setContactForm((prev) => ({ ...prev, intimacy: Number((e.target as HTMLInputElement).value) }))
              }
              className="mt-1 w-full"
            />
            <p className="mt-1 text-ds-caption text-soft transition-opacity duration-150">
              <span className="font-medium text-ink tabular-nums">{contactForm.intimacy}</span>
              <span className="mx-1.5 text-muted">·</span>
              {intimacyHint(contactForm.intimacy)}
            </p>
          </label>
          <div className="grid gap-ds-xs sm:grid-cols-2">
            <label className="block text-ds-body font-medium">
              真朋友指数：{contactForm.trueFriendScore.toFixed(1)}
              <div className="mt-1 space-y-1">
                <div className="h-2 w-full rounded-full bg-[#efe7db]">
                  <div
                    className="h-full rounded-full bg-energy-positive"
                    style={{ width: `${Math.max(0, Math.min(100, contactForm.trueFriendScore * 10))}%` }}
                  />
                </div>
                <p className="text-ds-caption font-normal text-muted">(AI自动计算，只读)</p>
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
                <p className="text-ds-caption font-normal text-muted">(AI自动计算，只读)</p>
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
            <p className="text-ds-caption text-energy-positive">
              已重置为「{DEFAULT_CONTACT_GROUP}」。
              <br />
              需要更多类别时：请先在「观系」页「新建分组」，再回到此处选择。
            </p>
          ) : null}
              {contactFormError ? (
                <p className="text-ds-caption font-medium text-[#b42318]" role="alert">
                  {contactFormError}
                </p>
              ) : null}
              {contactSubmitError ? (
                <p className="text-ds-caption font-medium text-[#b42318]" role="alert">
                  {contactSubmitError}
                </p>
              ) : null}
              {contactSubmitSuccess ? (
                <p className="text-ds-caption font-semibold text-energy-positive" role="status">
                  保存成功
                </p>
              ) : null}
        </div>
      </UnifiedAppModal>

      <UnifiedAppModal
        open={showInteractionDialog}
        onBackdropClick={handleInteractionCancel}
        onDismiss={handleInteractionCancel}
        titleId="interaction-dialog-title"
        title={`记录与 ${selectedContactName ?? "联系人"} 的互动`}
        footer={
          <>
            <Button
              variant="outline"
              className="h-11 rounded-[12px] border-[#d8c9b9] px-4"
              onClick={handleInteractionCancel}
              disabled={interactionSaving}
            >
              取消
            </Button>
            <Button className="h-11 rounded-[12px] px-4" onClick={handleInteractionSave} disabled={interactionSaving}>
              {interactionSaving ? "保存中..." : "保存"}
            </Button>
          </>
        }
      >
        <div className="space-y-ds-xs">
          <p className="text-ds-caption text-soft">保存后会更新互动记录。右侧关系评分示意可随之刷新。</p>
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
            <input
              type="range"
              min={-5}
              max={5}
              value={interactionForm.energy}
              onChange={(e) => setInteractionForm((prev) => ({ ...prev, energy: Number(e.target.value) }))}
              onInput={(e) =>
                setInteractionForm((prev) => ({ ...prev, energy: Number((e.target as HTMLInputElement).value) }))
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-full"
              style={{
                background:
                  energy === 0
                    ? "#e8e0d6"
                    : energy > 0
                      ? `linear-gradient(90deg, #e8e0d6 0%, #e8e0d6 50%, #c5ddcc ${50 + energyTrackPercent / 2}%, #2d7a4a 100%)`
                      : `linear-gradient(90deg, #b42318 0%, #e8b4b0 ${energyTrackPercent}%, #e8e0d6 50%, #e8e0d6 100%)`,
                accentColor: energyAccentColor,
              }}
            />
            <div className="mt-1 flex justify-between text-ds-caption text-soft">
              <span>-5</span>
              <span>+5</span>
            </div>
            <p className="mt-1 rounded-ds border border-warm-soft bg-surface-warm-soft px-2 py-1.5 text-ds-caption text-soft transition-colors duration-150">
              <span className="font-semibold tabular-nums text-ink">当前 {energy > 0 ? `+${energy}` : energy}</span>
              <span className="mx-1.5 text-muted">·</span>
              <span>{energyHint(energy)}</span>
            </p>
          </div>
          <div className="flex items-center justify-between rounded-ds border border-warm-soft bg-surface-warm-soft px-3 py-2">
            <div>
              <p className="text-ds-body font-medium">是否有意义</p>
              <p className="text-ds-caption text-soft">默认关闭</p>
            </div>
            <button
              type="button"
              className={`relative h-6 w-11 rounded-full transition ${
                interactionForm.meaningful ? "bg-energy-positive" : "bg-[#e8e0d6]"
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
          {interactionAiStatus === "analyzing" ? (
            <p className="text-ds-caption text-[#7a5a2e]">AI 正在分析本次互动...</p>
          ) : null}
          {interactionAiStatus === "done" ? (
            <p className="text-ds-caption text-energy-positive">AI 已分析本次互动，关系评分已更新</p>
          ) : null}
          {interactionSubmitError ? (
            <p className="text-ds-caption font-medium text-[#b42318]" role="alert">
              {interactionSubmitError}
            </p>
          ) : null}
          {interactionSubmitSuccess ? (
            <p className="text-ds-caption font-semibold text-energy-positive" role="status">
              保存成功
            </p>
          ) : null}
        </div>
      </UnifiedAppModal>

    </>
  )
}
