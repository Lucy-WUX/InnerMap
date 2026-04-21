"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

import { getLocalRelationshipById, listLocalEntries } from "@/lib/local-demo-store"
import { getSupabaseBrowserClient, isBrowserSupabaseReady } from "@/lib/supabase-browser"
import { useAuthStore } from "@/lib/stores/auth-store"
import type { Entry, Relationship } from "@/lib/types"
import { useAuthHydration } from "@/lib/use-user-session"

export default function RelationshipDetailPage() {
  const params = useParams<{ id: string }>()
  const userId = useAuthStore((s) => s.userId)
  const token = useAuthStore((s) => s.accessToken)
  const authHydrated = useAuthHydration()
  const offlineMode = !authHydrated || !userId || !isBrowserSupabaseReady()
  const [relationship, setRelationship] = useState<Relationship | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [analysis, setAnalysis] = useState("")
  const [portrait, setPortrait] = useState("")
  const [question, setQuestion] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)

  async function fetchData() {
    if (!params.id) return
    if (offlineMode) {
      const relation = getLocalRelationshipById(params.id)
      setRelationship(relation)
      if (!relation) return
      const relatedEntries = listLocalEntries().filter((item) => item.people_tag === relation.name).slice(0, 20)
      setEntries(relatedEntries)
      return
    }
    const supabase = getSupabaseBrowserClient()
    const { data: relationData } = await supabase
      .from("relationships")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", userId)
      .maybeSingle()
    const relation = relationData as Relationship | null
    setRelationship(relation)
    if (!relation) return

    const { data: entryData } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", userId)
      .eq("people_tag", relation.name)
      .order("created_at", { ascending: false })
      .limit(20)
    setEntries((entryData ?? []) as Entry[])
  }

  useEffect(() => {
    void fetchData()
  }, [userId, params.id, offlineMode])

  async function analyzeRelationship() {
    if (offlineMode) {
      setError("离线演示模式不支持 AI 分析，请先接入 Supabase 并登录。")
      return
    }
    if (!relationship || !token) return
    setLoading(true)
    setError("")
    const response = await fetch("/api/ai/relationship-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        relationship,
        relatedEntries: entries,
        question: question.trim() || null,
      }),
    })
    const data = (await response.json()) as { reply?: string; error?: string; remaining?: number }
    if (!response.ok) setError(data.error || "分析失败")
    else {
      setAnalysis(data.reply || "")
      setRemaining(data.remaining ?? null)
    }
    setLoading(false)
  }

  async function generatePortrait() {
    if (offlineMode) {
      setError("离线演示模式不支持 AI 画像，请先接入 Supabase 并登录。")
      return
    }
    if (!relationship || !token) return
    setLoading(true)
    setError("")
    const response = await fetch("/api/ai/relationship-portrait", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        relationship,
        relatedEntries: entries,
      }),
    })
    const data = (await response.json()) as { reply?: string; error?: string; remaining?: number }
    if (!response.ok) setError(data.error || "画像生成失败")
    else {
      setPortrait(data.reply || "")
      setRemaining(data.remaining ?? null)
    }
    setLoading(false)
  }

  if (!relationship) return <div className="text-sm text-soft">关系不存在或无权限。</div>

  return (
    <div className="space-y-4">
      {offlineMode ? <p className="text-xs text-soft">离线演示模式：关系与日记来自本地缓存。</p> : null}
      <div className="rounded-3xl border border-[#e6d9c8] bg-paper p-4">
        <h1 className="text-xl font-semibold">{relationship.name}</h1>
        <p className="mt-1 text-sm text-soft">
          {relationship.group_type} | {relationship.emotion_tag}
        </p>
        <div className="mt-3 space-y-2 text-sm leading-6">
          <p>
            <span className="font-medium">性格描述：</span>
            {relationship.personality || "暂无"}
          </p>
          <p>
            <span className="font-medium">成长背景：</span>
            {relationship.background || "暂无"}
          </p>
          <p>
            <span className="font-medium">备注：</span>
            {relationship.notes || "暂无"}
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-[#eadfce] bg-paper p-3">
        <p className="mb-2 text-sm text-soft">问我关于你和TA的关系问题</p>
        {offlineMode ? (
          <div className="mb-2 rounded-lg border border-[#f3d08a] bg-[#fff6de] px-3 py-2 text-xs text-[#8a5a00]">
            ⚠️ 演示模式：AI 功能已禁用。连接 Supabase 和 AI 服务后即可使用
          </div>
        ) : null}
        <input
          className="w-full rounded-xl border border-[#ddcfbe] px-3 py-2 text-sm"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="例如：我是不是太依赖了？"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-full bg-[#795548] px-4 py-2 text-sm text-[#5C4B3E]" onClick={analyzeRelationship} disabled={loading}>
            {loading ? "分析中..." : "分析这段关系"}
          </button>
          <button className="rounded-full border border-warm-strong px-4 py-2 text-sm text-ink" onClick={generatePortrait} disabled={loading}>
            {loading ? "生成中..." : "生成关系画像"}
          </button>
        </div>
      </div>
      <p className="text-xs text-soft">今日AI剩余次数：{remaining ?? "--"}</p>
      {analysis ? <div className="rounded-2xl bg-paper p-3 text-sm leading-6 whitespace-pre-wrap">{analysis}</div> : null}
      {portrait ? <div className="rounded-2xl bg-paper p-3 text-sm leading-6 whitespace-pre-wrap">{portrait}</div> : null}
      {error ? <p className="text-sm text-[#b24f45]">{error}</p> : null}

      <div className="space-y-2">
        <h2 className="text-base font-semibold">相关日记</h2>
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-[#eadfce] bg-paper p-3 text-sm">
            <p>{entry.content}</p>
            <p className="mt-1 text-xs text-soft">{entry.mood}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
