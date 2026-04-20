"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { AiAnalysisOverlay } from "./components/app/ai-analysis-overlay"
import { AppDialogs } from "./components/app/app-dialogs"
import { HomeSection } from "./components/app/home-section"
import { MineSection } from "./components/app/mine-section"
import { PersonDetailOverlay } from "./components/app/person-detail-overlay"
import { RelationsSection } from "./components/app/relations-section"
import {
  BASE_GROUPS,
  RELATION_HEALTH_DATA,
  type GroupKey,
  type OverlayPage,
  type RelationContact,
  type TabKey,
} from "./components/app/types"
import { AppLockScreen } from "./components/app/app-lock-screen"
import { OnboardingOverlay } from "./components/app/onboarding-overlay"
import {
  isAppDataEmpty,
  isSessionUnlocked,
  loadLockSettings,
  loadSnapshot,
  onboardingDone,
  saveLockSettings,
  saveSnapshot,
  setOnboardingDone,
  type AppDataSnapshot,
  type LockSettings,
} from "./lib/app-local-storage"
import { FREE_CONTACT_LIMIT, isProSubscriber } from "./lib/product-limits"
import {
  buildInteractionInsight,
  buildPatternSummary,
  computeEnergyAlerts,
  computeWeeklyDigest,
  type ScoreHistoryPoint,
} from "./lib/relationship-ai-demo"
import { useUserSession } from "@/lib/use-user-session"

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

function App({ initialTab = "home" }: { initialTab?: TabKey }) {
  const router = useRouter()
  const { loading: sessionLoading, userId } = useUserSession()
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
    group: "朋友" as GroupKey,
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
  const [diaryEmotion, setDiaryEmotion] = useState<"愉悦" | "平静" | "低落" | "愤怒">("平静")
  const [diarySaveTip, setDiarySaveTip] = useState("")
  const [diaryViewMode, setDiaryViewMode] = useState<"calendar" | "list">("calendar")
  const [diarySearchQuery, setDiarySearchQuery] = useState("")
  const [diaryRecords, setDiaryRecords] = useState<Record<string, string>>({})
  const [diaryEmotionRecords, setDiaryEmotionRecords] = useState<Record<string, "愉悦" | "平静" | "低落" | "愤怒">>({})
  const [hoveredHealthLabel, setHoveredHealthLabel] = useState<string | null>(null)
  const [healthChartReady, setHealthChartReady] = useState(false)
  const [autoHealthIndex, setAutoHealthIndex] = useState(0)
  const [healthPulseStrength, setHealthPulseStrength] = useState(0)
  const [relationsFocusGroup, setRelationsFocusGroup] = useState<GroupKey | "全部">("全部")
  const [relationsSearchQuery, setRelationsSearchQuery] = useState("")
  const [relationsSortBy, setRelationsSortBy] = useState<"recent" | "intimacy" | "trueFriend">("recent")
  const [selectedRelationIds, setSelectedRelationIds] = useState<string[]>([])
  const [animatedHealthRatios, setAnimatedHealthRatios] = useState<number[]>(
    RELATION_HEALTH_DATA.map(() => 0)
  )
  const [interactionForm, setInteractionForm] = useState(buildDefaultInteractionForm)
  const [appReady, setAppReady] = useState(false)
  const [unlockTick, setUnlockTick] = useState(0)
  const [lockSettings, setLockSettings] = useState<LockSettings | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [contactFormError, setContactFormError] = useState("")
  const [saveSuccessTip, setSaveSuccessTip] = useState("")
  const [contentVisible, setContentVisible] = useState(true)
  const [diaryDrafts, setDiaryDrafts] = useState<Record<string, string>>({})

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
    if (next === "home") router.push("/")
    else router.push(`/?tab=${next}`)
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
      const aiInsight =
        sel != null
          ? buildInteractionInsight({
              contactName: sel.name,
              energy,
              deltaTrueFriend: Math.round(deltaFriend * 10) / 10,
              type: interactionForm.type,
            })
          : undefined
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
          aiInsight,
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
  }

  function openCreateContact() {
    setContactFormError("")
    setIsEditingContact(false)
    setTagInput("")
    setContactForm({
      name: "",
      group: "朋友",
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

  function saveContactForm() {
    if (!contactForm.name.trim()) return
    if (!isEditingContact && !isProSubscriber() && contacts.length >= FREE_CONTACT_LIMIT) {
      setContactFormError(`免费版最多添加 ${FREE_CONTACT_LIMIT} 位联系人，升级 Pro 可解除限制。`)
      return
    }
    setContactFormError("")
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
          lastContact: "刚创建",
          note: "新建联系人",
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
  }

  function handleCreateGroup() {
    const name = newGroupName.trim()
    if (!name || allGroups.includes(name)) return
    setCustomGroups((prev) => [...prev, name])
    setNewGroupName("")
    setShowNewGroupDialog(false)
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

    setDiaryRecords((prev) => ({ ...prev, [diarySelectedDate]: content }))
    setDiaryEmotionRecords((prev) => ({ ...prev, [diarySelectedDate]: diaryEmotion }))

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
      setDiaryEmotion("平静")
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
  const allGroups: GroupKey[] = [...BASE_GROUPS, ...customGroups]
  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags ?? [])))
  const groupsWithContacts = allGroups.filter((group) => contacts.some((c) => c.group === group))
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
  const relationHealthData = RELATION_HEALTH_DATA
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
      hasRecord: Boolean(diaryRecords[dateValue]),
      isToday: dateValue === todayDateValue,
      emotion: diaryEmotionRecords[dateValue] ?? null,
    }
  })
  const monthTimeline = Object.entries(diaryRecords)
    .filter(([dateKey]) => dateKey.startsWith(diaryViewMonth))
    .sort((a, b) => a[0].localeCompare(b[0]))
  const diarySearchResults = Object.entries(diaryRecords)
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
    let rows = [...sums.entries()].sort((a, b) => a[1] - b[1]).slice(0, 3)
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

  useEffect(() => {
    if (sessionLoading) return

    setAppReady(false)
    const ls = loadLockSettings(storageScope)
    setLockSettings(ls)
    const snap = loadSnapshot(storageScope)
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
    if (onboardingDone(storageScope)) return
    if (!isAppDataEmpty(contacts.length, interactionLogs.length, Object.keys(diaryRecords).length)) return
    setShowOnboarding(true)
  }, [appReady, lockVisible, unlockTick, contacts.length, interactionLogs.length, diaryRecords, storageScope])

  useEffect(() => {
    setTab(initialTab)
    setOverlay("none")
  }, [initialTab])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return
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
    setContentVisible(false)
    const timer = setTimeout(() => setContentVisible(true), 120)
    return () => clearTimeout(timer)
  }, [tab, overlay])

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
      setDiaryEmotion(diaryEmotionRecords[diarySelectedDate] ?? "平静")
    } else {
      setDiaryEditorText(diaryDrafts[diarySelectedDate] ?? "")
      setDiaryEmotion("平静")
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

  return (
    <>
    <main className="min-h-screen bg-[#F8FAFC] px-ds-md pb-ds-lg pt-ds-md text-[#0F172A]">
      <div
        className={`transition-all duration-200 ease-out ${
          contentVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
      >
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
          groupsWithContacts={groupsWithContacts}
          allGroups={allGroups}
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
            totalDiaryCount: Object.keys(diaryRecords).length,
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
            diarySaveTip,
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
        />
      ) : null}

      {overlay === "ai-analysis" ? (
        <AiAnalysisOverlay aiInput={aiInput} setAiInput={setAiInput} onClose={() => setOverlay("none")} />
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
        showInteractionDialog={showInteractionDialog}
        setShowInteractionDialog={setShowInteractionDialog}
        selectedContactName={selectedContact?.name}
        interactionForm={interactionForm}
        setInteractionForm={setInteractionForm}
        saveInteraction={saveInteraction}
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
      contactCount={contacts.length}
      interactionCount={interactionLogs.length}
    />
    {saveSuccessTip ? (
      <div className="fixed right-4 top-4 z-[95] rounded-ds border border-[#b7e4c7] bg-[#ecfdf3] px-3 py-2 text-ds-caption font-medium text-[#166534] shadow-md">
        {saveSuccessTip}
      </div>
    ) : null}
    </>
  )
}

export default App
