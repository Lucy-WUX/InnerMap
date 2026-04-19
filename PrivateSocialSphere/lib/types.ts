export type MoodType = "happy" | "sad" | "anxious" | "angry"
export type GroupType =
  | "family"
  | "friend"
  | "classmate"
  | "colleague"
  | "professional"
  | "intimate"
export type EmotionTag = "positive" | "negative" | "mixed"

export type Entry = {
  id: string
  user_id: string
  content: string
  mood: MoodType
  people_tag: string | null
  created_at: string
}

export type Relationship = {
  id: string
  user_id: string
  name: string
  group_type: GroupType
  emotion_tag: EmotionTag
  personality: string | null
  background: string | null
  notes: string | null
  created_at: string
}
