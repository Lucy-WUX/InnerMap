import type { Entry, MoodType, Relationship, EmotionTag, GroupType } from "@/lib/types"

const LOCAL_USER_ID = "local-demo-user"
const ENTRIES_KEY = "pss_local_entries"
const RELATIONSHIPS_KEY = "pss_local_relationships"

function hasWindow() {
  return typeof window !== "undefined"
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getLocalDemoUserId() {
  return LOCAL_USER_ID
}

export function listLocalEntries() {
  if (!hasWindow()) return []
  return safeParse<Entry[]>(window.localStorage.getItem(ENTRIES_KEY), [])
}

export function listLocalRelationships() {
  if (!hasWindow()) return []
  return safeParse<Relationship[]>(window.localStorage.getItem(RELATIONSHIPS_KEY), [])
}

export function createLocalEntry(input: { content: string; mood: MoodType; people_tag: string | null }) {
  if (!hasWindow()) return
  const nextItem: Entry = {
    id: uid(),
    user_id: LOCAL_USER_ID,
    content: input.content,
    mood: input.mood,
    people_tag: input.people_tag,
    created_at: new Date().toISOString(),
  }
  const next = [nextItem, ...listLocalEntries()]
  window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(next))
}

export function deleteLocalEntry(id: string) {
  if (!hasWindow()) return
  const next = listLocalEntries().filter((item) => item.id !== id)
  window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(next))
}

export function createLocalRelationship(input: {
  name: string
  group_type: GroupType
  emotion_tag: EmotionTag
  personality: string | null
  background: string | null
  notes: string | null
}) {
  if (!hasWindow()) return
  const nextItem: Relationship = {
    id: uid(),
    user_id: LOCAL_USER_ID,
    name: input.name,
    group_type: input.group_type,
    emotion_tag: input.emotion_tag,
    personality: input.personality,
    background: input.background,
    notes: input.notes,
    created_at: new Date().toISOString(),
  }
  const next = [nextItem, ...listLocalRelationships()]
  window.localStorage.setItem(RELATIONSHIPS_KEY, JSON.stringify(next))
}

export function getLocalRelationshipById(id: string) {
  return listLocalRelationships().find((item) => item.id === id) ?? null
}
