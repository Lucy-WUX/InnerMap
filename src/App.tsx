"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"

const AiAnalysisOverlay = dynamic(() => import("./components/app/ai-analysis-overlay").then((m) => m.AiAnalysisOverlay))
const AppDialogs = dynamic(() => import("./components/app/app-dialogs").then((m) => m.AppDialogs))
const HomeSection = dynamic(() => import("./components/app/home-section").then((m) => m.HomeSection))
const MineSection = dynamic(() => import("./components/app/mine-section").then((m) => m.MineSection))
const PersonDetailOverlay = dynamic(() =>
  import("./components/app/person-detail-overlay").then((m) => m.PersonDetailOverlay)
)
const RelationsSection = dynamic(() => import("./components/app/relations-section").then((m) => m.RelationsSection))
import {
  DEFAULT_CONTACT_GROUP,
  sortContactGroupsForUi,
  type GroupKey,
  type OverlayPage,
  type RelationContact,
  type TabKey,
} from "./components/app/types"
import { AppLockScreen } from "./components/app/app-lock-screen"
import { OnboardingOverlay } from "./components/app/onboarding-overlay"
import { Button } from "./components/ui/button"
import {
  applyGuestLocalSchemaIfStale,
  clearAllScopedLocalData,
  countDiaryEntriesWithContent,
  dismissMonthlyBackupBannerForMonth,
  guestMergePromptKey,
  hasSeenLocalModeWelcome,
  isAppDataEmpty,
  isSessionUnlocked,
  loadLockSettings,
  loadSnapshot,
  markLocalModeWelcomeSeen,
  onboardingDone,
  saveLockSettings,
  saveSnapshot,
  setOnboardingDone,
  shouldShowMonthlyBackupBanner,
  snapshotHasMigratableData,
  snapshotLooksLikeHardcodedDemo,
  userScopeShouldOfferGuestMerge,
  wipeGuestAppDataOnly,
  type AppDataSnapshot,
  type LockSettings,
} from "./lib/app-local-storage"
import { normalizeCustomMoodInput } from "./lib/diary-mood"
import { hasLocalProSynced, markLocalProSynced, readStoredLocalProLicense } from "./lib/local-pro-license"
import { FREE_CONTACT_LIMIT, isProSubscriber } from "./lib/product-limits"
import {
  buildPatternSummary,
  computeEnergyAlerts,
  computeRelationHealthBuckets,
  computeWeeklyDigest,
  type ScoreHistoryPoint,
} from "./lib/relationship-ai-demo"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useAuthHydration } from "@/lib/use-user-session"

type InteractionLog = {
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

function buildDefaultInteractionForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    type: "微信聊天",
    what: "",
    feel: "",
    reaction: "",
    energy: 0,
    meaningful: false,
  }
}

function normalizeGroupNameInput(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

function App({ initialTab = "home" }: { initialTab?: TabKey }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isLocalModeUrl = searchParams.get("local") === "1"
  const userId = useAuthStore((s) => s.userId)
  const accessToken = useAuthStore((s) => s.accessToken)
  const authHydrated = useAuthHydration()
  const sessionLoading = !authHydrated
  const storageScope = userId ?? "guest"
  const [tab, setTab] = useState<TabKey>(initialTab)
  const [overlay, setOverlay] = useState<OverlayPage>("none")
  const [showInteractionDialog, setShowInteractionDialog] = useState(false)
  const [aiInput, setAiInput] = useState("")
  const [detailInput, setDetailInput] = useState("")
  const [interactionSaved, setInteractionSaved] = useState(false)
  const [interactionAiStatus, setInteractionAiStatus] = useState<"idle" | "analyzing" | "done">("idle")
  const [interactionLogs, setInteractionLogs] = useState<InteractionLog[]>([])
  const [scoreHistory, setScoreHistory] = useState<Record<string, ScoreHistoryPoint[]>>({})
  const [contacts, setContacts] = useState<RelationContact[]>([])
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [smartGrouping, setSmartGrouping] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [showRecommendHint, setShowRecommendHint] = useState(false)
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [customGroups, setCustomGroups] = useState<GroupKey[]>([])
  const [contactForm, setContactForm] = useState<ContactFormState>({
    name: "",
    group: DEFAULT_CONTACT_GROUP,
    tags: [] as string[],
    intimacy: 5,
    trueFriendScore: 7,
    surfaceRelationScore: 3,
    traits: "",
    background: "",
    privateNote: "",
  })
  const [selectedContactId, setSelectedContactId] = useState<string>("")
  const [diarySelectedDate, setDiarySelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [diaryViewMonth, setDiaryViewMonth] = useState(new Date().toISOString().slice(0, 7))
  const [diaryEditorText, setDiaryEditorText] = useState("")
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0)
  const [calendarFadeIn, setCalendarFadeIn] = useState(true)
  const [diaryEmotion, setDiaryEmotion] = useState("")
  const [diarySaveTip, setDiarySaveTip] = useState("")
  const [diaryViewMode, setDiaryViewMode] = useState<"calendar" | "list">("calendar")
  const [diarySearchQuery, setDiarySearchQuery] = useState("")
  const [diaryRecords, setDiaryRecords] = useState<Record<string, string>>({})
  const [diaryEmotionRecords, setDiaryEmotionRecords] = useState<Record<string, string>>({})
  const [hoveredHealthLabel, setHoveredHealthLabel] = useState<string | null>(null)
  const [healthChartReady, setHealthChartReady] = useState(false)
  const [autoHealthIndex, setAutoHealthIndex] = useState(0)
  const [healthPulseStrength, setHealthPulseStrength] = useState(0)
  const [relationsFocusGroup, setRelationsFocusGroup] = useState<GroupKey | "全部">("全部")
  const [relationsSearchQuery, setRelationsSearchQuery] = useState("")
  const [relationsSortBy, setRelationsSortBy] = useState<"recent" | "intimacy" | "trueFriend">("recent")
  const [selectedRelationIds, setSelectedRelationIds] = useState<string[]>([])
  const [animatedHealthRatios, setAnimatedHealthRatios] = useState<number[]>([0, 0, 0])
  const [interactionForm, setInteractionForm] = useState(buildDefaultInteractionForm)
  const [appReady, setAppReady] = useState(false)
  const [unlockTick, setUnlockTick] = useState(0)
  const [lockSettings, setLockSettings] = useState<LockSettings | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [contactFormError, setContactFormError] = useState("")
  const [saveSuccessTip, setSaveSuccessTip] = useState("")
  const [contactSaving, setContactSaving] = useState(false)
  const [interactionSaving, setInteractionSaving] = useState(false)
  const [diarySaving, setDiarySaving] = useState(false)
  const [diaryDrafts, setDiaryDrafts] = useState<Record<string, string>>({})
  const [showLocalWelcomeModal, setShowLocalWelcomeModal] = useState(false)
  const showLocalWelcomeRef = useRef(false)
  showLocalWelcomeRef.current = showLocalWelcomeModal
  const [showGuestMergeModal, setShowGuestMergeModal] = useState(false)
  const [, setBackupBannerTick] = useState(0)

  function showSaveSuccess(message = "保存成功 ✓") {
    setSaveSuccessTip(message)
    setTimeout(() => setSaveSuccessTip(""), 2000)
  }

  function setContactDialogOpen(value: boolean) {
    if (!value) setContactFormError("")
    setShowContactDialog(value)
  }

  function navigateToTab(next: TabKey) {
    setOverlay("none")
    if (next === "home") {
      router.push(isLocalModeUrl ? "/?local=1" : "/")
    } else {
      router.push(isLocalModeUrl ? `/?tab=${next}&local=1` : `/?tab=${next}`)
    }
  }

  function openAiPage(seedText?: string) {
    setAiInput(seedText ?? "")
    setOverlay("ai-analysis")
  }

  function openPage4WithContact(contactId: string) {
    setSelectedContactId(contactId)
    setOverlay("person-detail")
  }

  function openInteractionDialog() {
    setShowInteractionDialog(true)
  }

  function openInteractionForContact(contactId: string) {
    setSelectedContactId(contactId)
    openInteractionDialog()
  }

  function openInteractionForFirstContact() {
    const first = contacts[0]
    if (first) openInteractionForContact(first.id)
  }

  function buildExportCore(): Omit<AppDataSnapshot, "version" | "exportedAt"> {
    return {
      contacts,
      interactionLogs,
      scoreHistory,
      customGroups,
      diaryRecords,
      diaryEmotionRecords,
      diarySelectedDate,
      diaryViewMonth,
      selectedContactId,
    }
  }

  function restoreSnapshot(s: AppDataSnapshot) {
    setContacts(s.contacts)
    setInteractionLogs(s.interactionLogs)
    setScoreHistory(s.scoreHistory)
    setCustomGroups(s.customGroups)
    setDiaryRecords(s.diaryRecords)
    setDiaryEmotionRecords(s.diaryEmotionRecords)
    setDiarySelectedDate(s.diarySelectedDate)
    setDiaryViewMonth(s.diaryViewMonth)
    setSelectedContactId(s.selectedContactId)
  }

  function clampScore(value: number) {
    return Math.min(10, Math.max(0, Math.round(value * 10) / 10))
  }

  function saveInteraction() {
    setInteractionSaving(true)
    setShowInteractionDialog(false)
    setInteractionSaved(true)
    setInteractionAiStatus("analyzing")
    if (selectedContactId) {
      const energy = interactionForm.energy
      const sel = contacts.find((c) => c.id === selectedContactId)
      const deltaFriend = energy * 0.12
      const deltaSurface = -energy * 0.08
      const nextTF = sel ? clampScore(sel.trueFriendScore + deltaFriend) : 0
      const nextSF = sel ? clampScore(sel.surfaceRelationScore + deltaSurface) : 0
      setInteractionLogs((prev) => [
        {
          id: String(Date.now()),
          contactId: selectedContactId,
          date: interactionForm.date,
          type: interactionForm.type,
          what: interactionForm.what,
          reaction: interactionForm.reaction,
          feel: interactionForm.feel,
          energy: interactionForm.energy,
          meaningful: interactionForm.meaningful,
        },
        ...prev,
      ])
      setContacts((prev) =>
        prev.map((item) => {
          if (item.id !== selectedContactId) return item
          return {
            ...item,
            lastContact: interactionForm.date,
            trueFriendScore: nextTF,
            surfaceRelationScore: nextSF,
          }
        })
      )
      setScoreHistory((prev) => {
        const cur = prev[selectedContactId] ?? []
        const nextPoint: ScoreHistoryPoint = {
          date: interactionForm.date,
          trueFriend: nextTF,
          surface: nextSF,
        }
        const merged =
          cur.length > 0 && cur[cur.length - 1].date === interactionForm.date
            ? [...cur.slice(0, -1), nextPoint]
            : [...cur, nextPoint]
        return { ...prev, [selectedContactId]: merged.slice(-16) }
      })
    }
    setTimeout(() => {
      setInteractionAiStatus("done")
    }, 900)
    setTimeout(() => {
      setInteractionSaved(false)
      setInteractionAiStatus("idle")
    }, 2200)
    setInteractionForm(buildDefaultInteractionForm())
    showSaveSuccess("保存成功 ✓")
    setTimeout(() => setInteractionSaving(false), 300)
  }

  function openCreateContact() {
    setContactFormError("")
    setIsEditingContact(false)
    setTagInput("")
    setContactForm({
      name: "",
      group: DEFAULT_CONTACT_GROUP,
      tags: [],
      intimacy: 5,
      trueFriendScore: 7,
      surfaceRelationScore: 3,
      traits: "",
      background: "",
      privateNote: "",
    })
    setContactDialogOpen(true)
  }

  function openEditContact() {
    const selected = contacts.find((c) => c.id === selectedContactId)
    if (!selected) return
    setContactFormError("")
    setIsEditingContact(true)
    setTagInput("")
    setContactForm({
      name: selected.name,
      group: selected.group,
      tags: selected.tags ?? [],
      intimacy: selected.stars * 2,
      trueFriendScore: selected.trueFriendScore,
      surfaceRelationScore: selected.surfaceRelationScore,
      traits: selected.traits ?? "",
      background: selected.background ?? "",
      privateNote: selected.privateNote ?? "",
    })
    setContactDialogOpen(true)
  }

  function handleDeleteContactFromDetail() {
    const targetId = selectedContactId
    const target = contacts.find((c) => c.id === targetId)
    if (!target) return
    if (!window.confirm(`确认删除联系人「${target.name}」吗？其互动记录与评分历史也会一并删除，且不可恢复。`)) return

    setContacts((prev) => prev.filter((item) => item.id !== targetId))
    setInteractionLogs((prev) => prev.filter((item) => item.contactId !== targetId))
    setScoreHistory((prev) => {
      const next = { ...prev }
      delete next[targetId]
      return next
    })
    setSelectedRelationIds((prev) => prev.filter((id) => id !== targetId))
    setSelectedContactId("")
    setOverlay("none")
    showSaveSuccess("联系人已删除 ✓")
  }

  function saveContactForm() {
    if (!contactForm.name.trim()) return
    if (!isEditingContact && !isProSubscriber() && contacts.length >= FREE_CONTACT_LIMIT) {
      setContactFormError(`免费版最多添加 ${FREE_CONTACT_LIMIT} 位联系人，升级 Pro 可解除限制。`)
      return
    }
    setContactFormError("")
    setContactSaving(true)
    if (!allGroups.includes(contactForm.group)) {
      setCustomGroups((prev) => [...prev, contactForm.group])
    }
    if (isEditingContact) {
      const today = new Date().toISOString().slice(0, 10)
      const tf = clampScore(contactForm.trueFriendScore)
      const sf = clampScore(contactForm.surfaceRelationScore)
      setContacts((prev) =>
        prev.map((item) =>
          item.id === selectedContactId
            ? {
                ...item,
                name: contactForm.name.trim(),
                group: contactForm.group,
                stars: Math.max(1, Math.min(5, Math.round(contactForm.intimacy / 2))),
                trueFriendScore: tf,
                surfaceRelationScore: sf,
                tags: contactForm.tags,
                traits: contactForm.traits,
                background: contactForm.background,
                privateNote: contactForm.privateNote,
              }
            : item
        )
      )
      setScoreHistory((prev) => {
        const cur = prev[selectedContactId] ?? []
        return {
          ...prev,
          [selectedContactId]: [...cur, { date: today, trueFriend: tf, surface: sf }].slice(-16),
        }
      })
    } else {
      const createdId = String(Date.now())
      const today = new Date().toISOString().slice(0, 10)
      const tf = clampScore(contactForm.trueFriendScore)
      const sf = clampScore(contactForm.surfaceRelationScore)
      setContacts((prev) => [
        {
          id: createdId,
          name: contactForm.name.trim(),
          group: contactForm.group,
          stars: Math.max(1, Math.min(5, Math.round(contactForm.intimacy / 2))),
          trueFriendScore: tf,
          surfaceRelationScore: sf,
          lastContact: today,
          note: "",
          tags: contactForm.tags,
          traits: contactForm.traits,
          background: contactForm.background,
          privateNote: contactForm.privateNote,
        },
        ...prev,
      ])
      setScoreHistory((prev) => ({
        ...prev,
        [createdId]: [{ date: today, trueFriend: tf, surface: sf }],
      }))
      setSelectedContactId(createdId)
    }
    setContactDialogOpen(false)
    setOverlay("none")
    showSaveSuccess(isEditingContact ? "联系人已更新 ✓" : "联系人已创建 ✓")
    setTimeout(() => setContactSaving(false), 300)
  }

  function handleCreateGroup() {
    const name = normalizeGroupNameInput(newGroupName)
    if (!name) return
    if (name === DEFAULT_CONTACT_GROUP) {
      window.alert(`「${DEFAULT_CONTACT_GROUP}」为默认分组，无需创建。`)
      return
    }
    const normalizedExisting = new Set([
      ...customGroups.map((g) => normalizeGroupNameInput(g)),
      ...contacts.map((c) => normalizeGroupNameInput(c.group)),
    ])
    if (normalizedExisting.has(name)) {
      window.alert("已存在同名分组。")
      return
    }
    setCustomGroups((prev) => [...prev, name])
    setNewGroupName("")
    setShowNewGroupDialog(false)
    showSaveSuccess("分组已创建 ✓")
  }

  function renameContactGroup(oldName: GroupKey, newName: string) {
    const next = newName.trim()
    if (!next || next === oldName) return
    if (oldName === DEFAULT_CONTACT_GROUP) {
      window.alert("不能重命名默认分组。")
      return
    }
    if (next === DEFAULT_CONTACT_GROUP) {
      window.alert(`请使用「删除分组」将联系人移入「${DEFAULT_CONTACT_GROUP}」，不要改为同名。`)
      return
    }
    const nameTaken =
      (next !== oldName && contacts.some((c) => c.group === next)) ||
      (next !== oldName && customGroups.includes(next))
    if (nameTaken) {
      window.alert("已存在同名分组。")
      return
    }
    setContacts((prev) => prev.map((c) => (c.group === oldName ? { ...c, group: next } : c)))
    setCustomGroups((prev) => prev.map((g) => (g === oldName ? next : g)))
    if (relationsFocusGroup === oldName) setRelationsFocusGroup(next)
    setContactForm((p) => (p.group === oldName ? { ...p, group: next } : p))
  }

  function deleteContactGroup(groupName: GroupKey) {
    if (groupName === DEFAULT_CONTACT_GROUP) return
    setContacts((prev) =>
      prev.map((c) => (c.group === groupName ? { ...c, group: DEFAULT_CONTACT_GROUP } : c))
    )
    setCustomGroups((prev) => prev.filter((g) => g !== groupName))
    if (relationsFocusGroup === groupName) setRelationsFocusGroup("全部")
    setContactForm((p) => (p.group === groupName ? { ...p, group: DEFAULT_CONTACT_GROUP } : p))
  }

  function formatMonthValue(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  }

  function formatDateValue(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  function insertDiaryMention(name: string) {
    setDiaryEditorText((prev) => {
      const next = prev.replace(/@([^\s@]*)$/, `@${name} `)
      setDiaryDrafts((drafts) => ({ ...drafts, [diarySelectedDate]: next }))
      return next
    })
  }

  function handleSaveDiary() {
    const content = diaryEditorText.trim()
    if (!content) {
      setDiarySaveTip("请先填写日记内容")
      return
    }

    setDiarySaving(true)
    setDiaryRecords((prev) => ({ ...prev, [diarySelectedDate]: content }))
    setDiaryEmotionRecords((prev) => {
      const next = { ...prev }
      const mood = normalizeCustomMoodInput(diaryEmotion)
      if (!mood) delete next[diarySelectedDate]
      else next[diarySelectedDate] = mood
      return next
    })

    const mentionNames = contacts
      .filter((c) => content.includes(`@${c.name}`))
      .map((c) => c.name)

    if (mentionNames.length > 0) {
      setContacts((prev) =>
        prev.map((item) => {
          if (!mentionNames.includes(item.name)) return item
          const brief = content.length > 18 ? `${content.slice(0, 18)}...` : content
          const diaryLine = `[日记 ${diarySelectedDate}] ${brief}`
          const existingNote = item.privateNote ?? ""
          if (existingNote.includes(diaryLine)) return item
          return {
            ...item,
            privateNote: existingNote ? `${existingNote}\n${diaryLine}` : diaryLine,
          }
        })
      )
    }

    setDiarySaveTip(
      mentionNames.length > 0 ? `保存成功 ✓（已关联：${mentionNames.join("、")}）` : "保存成功 ✓"
    )
    setTimeout(() => setDiarySaveTip(""), 2000)
    setDiaryDrafts((prev) => {
      const next = { ...prev }
      delete next[diarySelectedDate]
      return next
    })
    showSaveSuccess("保存成功 ✓")
    setTimeout(() => setDiarySaving(false), 300)
  }

  function handleDeleteDiary(dateKey: string) {
    if (!window.confirm("确认删除这条日记吗？删除后无法恢复。")) return
    setDiaryRecords((prev) => {
      const next = { ...prev }
      delete next[dateKey]
      return next
    })
    setDiaryEmotionRecords((prev) => {
      const next = { ...prev }
      delete next[dateKey]
      return next
    })
    if (diarySelectedDate === dateKey) {
      setDiaryEditorText("")
      setDiaryEmotion("")
    }
    setDiaryDrafts((prev) => {
      const next = { ...prev }
      delete next[dateKey]
      return next
    })
    setDiarySaveTip("日记已删除")
    setTimeout(() => setDiarySaveTip(""), 1400)
  }

  function handleDeleteInteraction(interactionId: string) {
    if (!window.confirm("确认删除这条互动记录吗？删除后无法恢复。")) return
    setInteractionLogs((prev) => prev.filter((item) => item.id !== interactionId))
    showSaveSuccess("删除成功 ✓")
  }

  const linkedContacts = contacts
    .filter((c) => diaryEditorText.includes(`@${c.name}`))
    .map((c) => c.name)
  const linkedContactItems = contacts.filter((c) => linkedContacts.includes(c.name))
  const selectedContact = contacts.find((c) => c.id === selectedContactId)
  const allGroups: GroupKey[] = sortContactGroupsForUi([
    DEFAULT_CONTACT_GROUP,
    ...customGroups,
    ...contacts.map((c) => c.group),
  ])
  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags ?? [])))
  const relationVisibleContacts = contacts
    .filter((c) => (relationsFocusGroup === "全部" ? true : c.group === relationsFocusGroup))
    .filter((c) => {
      if (!relationsSearchQuery.trim()) return true
      const q = relationsSearchQuery.trim().toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        (c.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => {
      if (relationsSortBy === "intimacy") return b.stars - a.stars
      if (relationsSortBy === "trueFriend") return b.trueFriendScore - a.trueFriendScore
      return b.lastContact.localeCompare(a.lastContact)
    })
  const relationHealthData = useMemo(() => computeRelationHealthBuckets(contacts), [contacts])
  const [viewYear, viewMonth] = diaryViewMonth.split("-").map(Number)
  const monthDate = new Date(viewYear, viewMonth - 1, 1)
  const today = new Date()
  const todayDateValue = formatDateValue(today.getFullYear(), today.getMonth(), today.getDate())
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate()
  const firstWeekDay = monthDate.getDay()
  const monthLabel = `${viewYear}年${viewMonth}月`
  const calendarCells = Array.from({ length: firstWeekDay + daysInMonth }, (_, idx) => {
    if (idx < firstWeekDay) return null
    const day = idx - firstWeekDay + 1
    const dateValue = formatDateValue(viewYear, viewMonth - 1, day)
    return {
      day,
      dateValue,
      hasRecord: (diaryRecords[dateValue] ?? "").trim().length > 0,
      isToday: dateValue === todayDateValue,
      emotion: diaryEmotionRecords[dateValue] ?? null,
    }
  })
  const monthTimeline = Object.entries(diaryRecords)
    .filter(
      ([dateKey, content]) => dateKey.startsWith(diaryViewMonth) && (content ?? "").trim().length > 0
    )
    .sort((a, b) => a[0].localeCompare(b[0]))
  const diarySearchResults = Object.entries(diaryRecords)
    .filter(([, content]) => (content ?? "").trim().length > 0)
    .filter(([, content]) => {
      if (!diarySearchQuery.trim()) return true
      const q = diarySearchQuery.trim().toLowerCase()
      const relatedNames = contacts
        .filter((c) => content.includes(`@${c.name}`))
        .map((c) => c.name)
        .join(" ")
        .toLowerCase()
      return content.toLowerCase().includes(q) || relatedNames.includes(q)
    })
    .sort((a, b) => b[0].localeCompare(a[0]))
  const mentionMatch = diaryEditorText.match(/(?:^|\s)@([^\s@]*)$/)
  const mentionKeyword = mentionMatch ? mentionMatch[1] : null
  const mentionSuggestions =
    mentionKeyword === null
      ? []
      : contacts
          .filter((c) => c.name.includes(mentionKeyword))
          .slice(0, 6)
  const activeHealthLabel =
    hoveredHealthLabel ?? (healthChartReady ? relationHealthData[autoHealthIndex]?.label ?? null : null)
  const activeHealth =
    relationHealthData.find((item) => item.label === activeHealthLabel) ?? null

  const weeklyDigest = useMemo(() => computeWeeklyDigest(contacts, interactionLogs), [contacts, interactionLogs])
  const energyAlerts = useMemo(() => computeEnergyAlerts(contacts, interactionLogs), [contacts, interactionLogs])
  const energySpotlightItems = useMemo(() => {
    const alertById = new Map(energyAlerts.map((a) => [a.contactId, a]))
    const sums = new Map<string, number>()
    for (const l of interactionLogs) {
      if (l.energy < 0) sums.set(l.contactId, (sums.get(l.contactId) ?? 0) + l.energy)
    }
    const rows = [...sums.entries()].sort((a, b) => a[1] - b[1]).slice(0, 3)
    if (rows.length === 0) return []
    return rows.map(([id]) => {
      const c = contacts.find((x) => x.id === id)
      const al = alertById.get(id)
      return {
        id,
        title: c ? `${c.name} · ${c.group}` : id,
        desc: al?.reason ?? c?.note ?? "近期互动能量偏低，建议关注沟通节奏。",
        alert: Boolean(al),
      }
    })
  }, [contacts, interactionLogs, energyAlerts])
  const patternSummaryForDetail = useMemo(() => {
    if (!selectedContact) return ""
    const logs = interactionLogs.filter((l) => l.contactId === selectedContactId)
    return buildPatternSummary(selectedContact.name, logs)
  }, [selectedContact, selectedContactId, interactionLogs])
  const scoreTrendForDetail = selectedContactId ? scoreHistory[selectedContactId] ?? [] : []

  const buildGlobalAiAdvisorContext = useCallback((): string => {
    const lines: string[] = []
    lines.push(`全局关系概括：联系人 ${contacts.length} 人；自定义分组 ${customGroups.length} 个。`)
    lines.push(`互动记录共 ${interactionLogs.length} 条。`)
    const diaryFilled = Object.keys(diaryRecords).filter((d) => (diaryRecords[d] ?? "").trim().length > 0)
    lines.push(`有内容的日记 ${diaryFilled.length} 篇。`)
    if (contacts.length > 0) {
      lines.push("联系人节选（最多 12 人）：")
      for (const c of contacts.slice(0, 12)) {
        lines.push(
          `- ${c.name} · 分组「${c.group}」· 真朋友 ${c.trueFriendScore}/10 · 表面 ${c.surfaceRelationScore}/10`
        )
      }
    }
    if (interactionLogs.length > 0) {
      lines.push("互动节选（最新 8 条）：")
      for (const log of interactionLogs.slice(0, 8)) {
        const person = contacts.find((x) => x.id === log.contactId)?.name ?? log.contactId
        lines.push(
          `- ${log.date} · ${person} · ${log.type} · 能量 ${log.energy} · ${(log.what ?? "").slice(0, 160)}`
        )
      }
    }
    const recentDiary = Object.entries(diaryRecords)
      .filter(([, t]) => (t ?? "").trim().length > 0)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 3)
    if (recentDiary.length > 0) {
      lines.push("最近日记节选：")
      for (const [date, text] of recentDiary) {
        lines.push(`- ${date}：${(text ?? "").trim().slice(0, 500)}`)
      }
    }
    return lines.join("\n")
  }, [contacts, customGroups, interactionLogs, diaryRecords])

  useEffect(() => {
    if (sessionLoading) return

    setAppReady(false)
    const ls = loadLockSettings(storageScope)
    setLockSettings(ls)
    if (storageScope === "guest") {
      applyGuestLocalSchemaIfStale()
    }
    let snap = loadSnapshot(storageScope)
    if (storageScope === "guest" && snap && snapshotLooksLikeHardcodedDemo(snap)) {
      wipeGuestAppDataOnly()
      snap = null
    }
    if (snap) {
      setContacts(snap.contacts)
      setInteractionLogs(snap.interactionLogs)
      setScoreHistory(snap.scoreHistory)
      setCustomGroups(snap.customGroups)
      setDiaryRecords(snap.diaryRecords)
      setDiaryEmotionRecords(snap.diaryEmotionRecords)
      setDiarySelectedDate(snap.diarySelectedDate)
      setDiaryViewMonth(snap.diaryViewMonth)
      setSelectedContactId(snap.selectedContactId)
    } else {
      setContacts([])
      setInteractionLogs([])
      setScoreHistory({})
      setCustomGroups([])
      setDiaryRecords({})
      setDiaryEmotionRecords({})
      setDiarySelectedDate(new Date().toISOString().slice(0, 10))
      setDiaryViewMonth(new Date().toISOString().slice(0, 7))
      setSelectedContactId("")
    }

    if (typeof localStorage !== "undefined") {
      const rawDiaryDrafts = localStorage.getItem(`pss-diary-drafts:${storageScope}`)
      if (rawDiaryDrafts) {
        try {
          setDiaryDrafts(JSON.parse(rawDiaryDrafts) as Record<string, string>)
        } catch {
          setDiaryDrafts({})
        }
      } else {
        setDiaryDrafts({})
      }

      const rawInteractionDraft = localStorage.getItem(`pss-interaction-draft:${storageScope}`)
      if (rawInteractionDraft) {
        try {
          const parsed = JSON.parse(rawInteractionDraft) as ReturnType<typeof buildDefaultInteractionForm>
          setInteractionForm({ ...buildDefaultInteractionForm(), ...parsed })
        } catch {
          setInteractionForm(buildDefaultInteractionForm())
        }
      } else {
        setInteractionForm(buildDefaultInteractionForm())
      }
    }

    setAppReady(true)
  }, [sessionLoading, storageScope])

  useEffect(() => {
    if (typeof localStorage === "undefined") return
    localStorage.setItem(`pss-diary-drafts:${storageScope}`, JSON.stringify(diaryDrafts))
  }, [diaryDrafts, storageScope])

  useEffect(() => {
    if (typeof localStorage === "undefined") return
    localStorage.setItem(`pss-interaction-draft:${storageScope}`, JSON.stringify(interactionForm))
  }, [interactionForm, storageScope])

  useEffect(() => {
    if (!appReady) return
    saveSnapshot({
      contacts,
      interactionLogs,
      scoreHistory,
      customGroups,
      diaryRecords,
      diaryEmotionRecords,
      diarySelectedDate,
      diaryViewMonth,
      selectedContactId,
    }, storageScope)
  }, [
    appReady,
    contacts,
    interactionLogs,
    scoreHistory,
    customGroups,
    diaryRecords,
    diaryEmotionRecords,
    diarySelectedDate,
    diaryViewMonth,
    selectedContactId,
    storageScope,
  ])

  const lockVisible = appReady && Boolean(lockSettings?.enabled && !isSessionUnlocked(storageScope))

  useEffect(() => {
    if (!appReady || lockVisible) return
    if (!isLocalModeUrl || userId) return
    if (hasSeenLocalModeWelcome()) return
    setShowLocalWelcomeModal(true)
  }, [appReady, lockVisible, isLocalModeUrl, userId])

  useEffect(() => {
    if (!appReady || !userId || lockVisible) {
      setShowGuestMergeModal(false)
      return
    }
    if (typeof localStorage === "undefined") return
    if (localStorage.getItem(guestMergePromptKey(userId))) return
    if (!userScopeShouldOfferGuestMerge(userId)) return
    setShowGuestMergeModal(true)
  }, [appReady, userId, lockVisible])

  useEffect(() => {
    if (!userId || !accessToken) return
    if (hasLocalProSynced(userId)) return
    const localLicense = readStoredLocalProLicense()
    if (!localLicense?.code) return
    void fetch("/api/billing/sync-local-license", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ code: localLicense.code }),
    })
      .then((res) => {
        if (!res.ok) return
        markLocalProSynced(userId)
      })
      .catch(() => undefined)
  }, [userId, accessToken])

  useEffect(() => {
    if (!appReady || lockVisible) return
    if (isLocalModeUrl && !userId && !hasSeenLocalModeWelcome()) return
    if (onboardingDone(storageScope)) return
    if (!isAppDataEmpty(contacts.length, interactionLogs.length, countDiaryEntriesWithContent(diaryRecords)))
      return
    setShowOnboarding(true)
  }, [
    appReady,
    lockVisible,
    unlockTick,
    contacts.length,
    interactionLogs.length,
    diaryRecords,
    storageScope,
    isLocalModeUrl,
    userId,
  ])

  useEffect(() => {
    setTab(initialTab)
    setOverlay("none")
  }, [initialTab])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      if (showLocalWelcomeRef.current) {
        markLocalModeWelcomeSeen()
      }
      setShowLocalWelcomeModal(false)
      setOverlay("none")
      setShowInteractionDialog(false)
      setShowContactDialog(false)
      setShowNewGroupDialog(false)
      setShowOnboarding(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    const [year, month] = diarySelectedDate.split("-")
    setDiaryViewMonth(`${year}-${month}`)
  }, [diarySelectedDate])

  useEffect(() => {
    setCalendarFadeIn(false)
    const raf = requestAnimationFrame(() => setCalendarFadeIn(true))
    return () => cancelAnimationFrame(raf)
  }, [diaryViewMonth])

  useEffect(() => {
    setMentionActiveIndex(0)
  }, [mentionKeyword])

  useEffect(() => {
    if (mentionSuggestions.length === 0) {
      setMentionActiveIndex(0)
      return
    }
    if (mentionActiveIndex > mentionSuggestions.length - 1) {
      setMentionActiveIndex(mentionSuggestions.length - 1)
    }
  }, [mentionSuggestions.length, mentionActiveIndex])

  useEffect(() => {
    const saved = diaryRecords[diarySelectedDate]
    if (saved) {
      setDiaryEditorText(saved)
      setDiaryEmotion(diaryEmotionRecords[diarySelectedDate] ?? "")
    } else {
      setDiaryEditorText(diaryDrafts[diarySelectedDate] ?? "")
      setDiaryEmotion("")
    }
  }, [diarySelectedDate, diaryRecords, diaryEmotionRecords, diaryDrafts])

  useEffect(() => {
    const timer = setTimeout(() => setHealthChartReady(true), 80)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!healthChartReady || hoveredHealthLabel) return
    const timer = setInterval(() => {
      setAutoHealthIndex((prev) => (prev + 1) % relationHealthData.length)
    }, 2200)
    return () => clearInterval(timer)
  }, [healthChartReady, hoveredHealthLabel, relationHealthData.length])

  useEffect(() => {
    if (!healthChartReady) return
    const duration = 1000
    let rafId = 0
    let start = 0
    const targetRatios = relationHealthData.map((item) => item.ratio)

    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setAnimatedHealthRatios(targetRatios.map((ratio) => Number((ratio * eased).toFixed(1))))
      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      } else {
        setAnimatedHealthRatios(targetRatios)
      }
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [healthChartReady, relationHealthData])

  useEffect(() => {
    if (!healthChartReady || !activeHealthLabel) return
    let rafId = 0
    let start = 0
    const duration = 2800

    const animatePulse = (timestamp: number) => {
      if (!start) start = timestamp
      const phase = ((timestamp - start) % duration) / duration
      const mainBeat = Math.exp(-((phase - 0.18) ** 2) / 0.0065)
      const echoBeat = Math.exp(-((phase - 0.37) ** 2) / 0.01)
      const strength = Math.min(1, 0.18 + mainBeat * 0.56 + echoBeat * 0.3)
      setHealthPulseStrength(strength)
      rafId = requestAnimationFrame(animatePulse)
    }

    rafId = requestAnimationFrame(animatePulse)
    return () => cancelAnimationFrame(rafId)
  }, [healthChartReady, activeHealthLabel])

  useEffect(() => {
    if (!activeHealthLabel) setHealthPulseStrength(0)
  }, [activeHealthLabel])

  if (!appReady) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-ds-md pb-ds-lg pt-ds-md">
        <div className="mx-auto max-w-5xl space-y-ds-md animate-pulse">
          <div className="h-11 w-full rounded-ds bg-[#efe6d9]" />
          <div className="grid gap-ds-md lg:grid-cols-[320px_1fr]">
            <div className="h-56 rounded-ds bg-[#f4ecdf]" />
            <div className="h-72 rounded-ds bg-[#f4ecdf]" />
          </div>
        </div>
      </main>
    )
  }

  if (lockVisible && lockSettings) {
    return <AppLockScreen settings={lockSettings} storageScope={storageScope} onUnlocked={() => setUnlockTick((n) => n + 1)} />
  }

  const showBackupReminder =
    shouldShowMonthlyBackupBanner() && snapshotHasMigratableData(loadSnapshot(storageScope))
  const firstUseEmpty = isAppDataEmpty(contacts.length, interactionLogs.length, countDiaryEntriesWithContent(diaryRecords))

  return (
    <>
    <main className="min-h-screen bg-[#F8FAFC] px-ds-md pb-ds-lg pt-ds-md text-[#0F172A]">
      {showBackupReminder ? (
        <div className="mb-3 flex items-start gap-2 rounded-ds border border-[#d8c9b9] bg-[#f8f1e8] px-3 py-2.5 text-sm text-[#4a3728] shadow-sm">
          <button
            type="button"
            className="flex-1 text-left leading-snug hover:underline"
            onClick={() => {
              dismissMonthlyBackupBannerForMonth()
              setBackupBannerTick((n) => n + 1)
              navigateToTab("mine")
            }}
          >
            📅 本月备份提醒：你已经一个月没有备份数据了，点击这里导出备份。
          </button>
          <button
            type="button"
            className="shrink-0 rounded px-2 py-0.5 text-[#795548] hover:bg-[#ece4d8]"
            aria-label="关闭提醒"
            onClick={() => {
              dismissMonthlyBackupBannerForMonth()
              setBackupBannerTick((n) => n + 1)
            }}
          >
            ×
          </button>
        </div>
      ) : null}
      {firstUseEmpty && overlay === "none" ? (
        <div className="mb-3 rounded-ds border border-[#e6d7c5] bg-[#fff8ee] px-3 py-2.5 text-[#5f4a32] shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-ds-body font-medium">新用户快速开始：先添加联系人，再记录互动，最后查看关系洞察。</p>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowOnboarding(true)}>
                打开新手引导
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  navigateToTab("relations")
                  openCreateContact()
                }}
              >
                立即添加联系人
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <div>
      {overlay === "none" && tab === "relations" ? (
        <RelationsSection
          relationHealthData={relationHealthData}
          healthChartReady={healthChartReady}
          healthPulseStrength={healthPulseStrength}
          activeHealthLabel={activeHealthLabel}
          activeHealth={activeHealth}
          setHoveredHealthLabel={setHoveredHealthLabel}
          animatedHealthRatios={animatedHealthRatios}
          openPage4WithContact={openPage4WithContact}
          openInteractionForContact={openInteractionForContact}
          openCreateContact={openCreateContact}
          setShowNewGroupDialog={setShowNewGroupDialog}
          relationsFocusGroup={relationsFocusGroup}
          setRelationsFocusGroup={setRelationsFocusGroup}
          contacts={contacts}
          allGroups={allGroups}
          onRenameGroup={renameContactGroup}
          onDeleteGroup={deleteContactGroup}
          relationVisibleContacts={relationVisibleContacts}
          relationsSearchQuery={relationsSearchQuery}
          setRelationsSearchQuery={setRelationsSearchQuery}
          relationsSortBy={relationsSortBy}
          setRelationsSortBy={setRelationsSortBy}
          selectedRelationIds={selectedRelationIds}
          setSelectedRelationIds={setSelectedRelationIds}
          setContacts={setContacts}
          energySpotlightItems={energySpotlightItems}
        />
      ) : null}

      {overlay === "person-detail" ? (
        <PersonDetailOverlay
          selectedContactName={selectedContact?.name}
          selectedContactGroup={selectedContact?.group}
          selectedContactTraits={selectedContact?.traits}
          trueFriendScore={selectedContact?.trueFriendScore ?? 7}
          surfaceRelationScore={selectedContact?.surfaceRelationScore ?? 3}
          scoreTrendPoints={scoreTrendForDetail}
          patternSummary={patternSummaryForDetail}
          selectedContact={selectedContact}
          openInteractionDialog={openInteractionDialog}
          openEditContact={openEditContact}
          interactionSaved={interactionSaved}
          interactionAiStatus={interactionAiStatus}
          detailInput={detailInput}
          setDetailInput={setDetailInput}
          onClose={() => setOverlay("none")}
          interactionLogs={interactionLogs.filter((item) => item.contactId === selectedContactId)}
          onDeleteInteraction={handleDeleteInteraction}
          onDeleteContact={handleDeleteContactFromDetail}
        />
      ) : null}

      {overlay === "none" && tab === "home" ? (
        <HomeSection
          {...({
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
            totalDiaryCount: countDiaryEntriesWithContent(diaryRecords),
            diaryEmotion,
            setDiaryEmotion,
            diaryEditorText,
            setDiaryEditorText: (value: string) => {
              setDiaryEditorText(value)
              setDiaryDrafts((prev) => ({ ...prev, [diarySelectedDate]: value }))
            },
            mentionKeyword,
            mentionSuggestions,
            mentionActiveIndex,
            setMentionActiveIndex,
            insertDiaryMention,
            linkedContacts,
            linkedContactItems,
            contacts,
            onJumpToContact: (contactId: string) => {
              navigateToTab("relations")
              openPage4WithContact(contactId)
            },
            onOpenAiPage: () => openAiPage("我想先快速梳理这周最消耗我的关系。"),
            diarySaveTip,
            diarySaving,
            handleSaveDiary,
            handleDeleteDiary,
            weeklyDigest,
            energyAlerts,
          } as const)}
        />
      ) : null}

      {overlay === "none" && tab === "mine" ? (
        <MineSection
          storageScope={storageScope}
          openAiPage={openAiPage}
          buildExportSnapshot={buildExportCore}
          onRestoreSnapshot={restoreSnapshot}
          lockEnabled={Boolean(lockSettings?.enabled)}
          lockSettings={lockSettings}
          onLockSettingsChange={(s) => {
            setLockSettings(s)
            saveLockSettings(s, storageScope)
          }}
          localRecordCount={contacts.length + interactionLogs.length + countDiaryEntriesWithContent(diaryRecords)}
          onExportComplete={() => setBackupBannerTick((n) => n + 1)}
        />
      ) : null}

      {overlay === "ai-analysis" ? (
        <AiAnalysisOverlay
          aiInput={aiInput}
          setAiInput={setAiInput}
          onClose={() => setOverlay("none")}
          buildAdvisorContext={buildGlobalAiAdvisorContext}
        />
      ) : null}

      <AppDialogs
        showNewGroupDialog={showNewGroupDialog}
        setShowNewGroupDialog={setShowNewGroupDialog}
        newGroupName={newGroupName}
        setNewGroupName={setNewGroupName}
        handleCreateGroup={handleCreateGroup}
        showContactDialog={showContactDialog}
        setShowContactDialog={setContactDialogOpen}
        contactFormError={contactFormError}
        isEditingContact={isEditingContact}
        contactForm={contactForm}
        setContactForm={setContactForm}
        tagInput={tagInput}
        setTagInput={setTagInput}
        allGroups={allGroups}
        allTags={allTags}
        showRecommendHint={showRecommendHint}
        smartGrouping={smartGrouping}
        setSmartGrouping={setSmartGrouping}
        setShowRecommendHint={setShowRecommendHint}
        saveContactForm={saveContactForm}
        contactSaving={contactSaving}
        showInteractionDialog={showInteractionDialog}
        setShowInteractionDialog={setShowInteractionDialog}
        selectedContactName={selectedContact?.name}
        interactionForm={interactionForm}
        setInteractionForm={setInteractionForm}
        saveInteraction={saveInteraction}
        interactionSaving={interactionSaving}
        interactionAiStatus={interactionAiStatus}
      />
      </div>
    </main>
    <OnboardingOverlay
      open={showOnboarding}
      onClose={() => setShowOnboarding(false)}
      onFinishOnboarding={() => setOnboardingDone(storageScope)}
      setTab={navigateToTab}
      openCreateContact={openCreateContact}
      openInteractionForFirstContact={openInteractionForFirstContact}
      openAiPage={openAiPage}
      openReminderSetup={() => navigateToTab("mine")}
      contactCount={contacts.length}
      interactionCount={interactionLogs.length}
    />
    {saveSuccessTip ? (
      <div className="fixed right-4 top-4 z-[80] rounded-ds border border-[#b7e4c7] bg-[#ecfdf3] px-3 py-2 text-ds-caption font-medium text-[#166534] shadow-md">
        {saveSuccessTip}
      </div>
    ) : null}

    {showLocalWelcomeModal ? (
      <div
        className="fixed inset-0 z-[160] flex items-center justify-center bg-black/45 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="local-welcome-title"
      >
        <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-ds border border-[#d8c9b9] bg-paper p-6 shadow-xl">
          <h2 id="local-welcome-title" className="text-lg font-semibold text-[#3b2f2f]">
            🎉 欢迎使用 InnerMap！
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#4a3728]">
            <p>你的所有数据都将存储在这台设备的浏览器中，不会上传到任何服务器。</p>
            <p>
              💡 建议：定期点击右上角 &quot;我的&quot;→&quot;导出所有数据&quot; 备份你的数据，防止意外丢失。
            </p>
            <p>如果你需要在多设备之间同步数据，可以随时注册一个账号。</p>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={() => {
                markLocalModeWelcomeSeen()
                setShowLocalWelcomeModal(false)
              }}
            >
              知道了
            </Button>
          </div>
        </div>
      </div>
    ) : null}

    {showGuestMergeModal && userId ? (
      <div
        className="fixed inset-0 z-[160] flex items-center justify-center bg-black/45 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-merge-title"
      >
        <div className="w-full max-w-md rounded-ds border border-[#d8c9b9] bg-paper p-6 shadow-xl">
          <h2 id="guest-merge-title" className="text-lg font-semibold text-[#3b2f2f]">
            同步本地数据
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#4a3728]">
            检测到你有本地数据，是否要将这些数据同步到你的新账号？
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="sm:order-1"
              onClick={() => {
                clearAllScopedLocalData("guest")
                localStorage.setItem(guestMergePromptKey(userId), "skip")
                setShowGuestMergeModal(false)
              }}
            >
              否，创建空账号
            </Button>
            <Button
              type="button"
              className="sm:order-2"
              onClick={() => {
                const guestSnap = loadSnapshot("guest")
                if (guestSnap) restoreSnapshot(guestSnap)
                clearAllScopedLocalData("guest")
                localStorage.setItem(guestMergePromptKey(userId), "merged")
                setShowGuestMergeModal(false)
                showSaveSuccess("已同步本地数据 ✓")
              }}
            >
              是，同步所有数据
            </Button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  )
}

export default App
