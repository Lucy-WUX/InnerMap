"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { getSupabaseBrowserClient, isBrowserSupabaseReady, isDemoModeEnabled } from "@/lib/supabase-browser"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const missingEnv = !isBrowserSupabaseReady()
  const demoMode = isDemoModeEnabled()

  useEffect(() => {
    if (missingEnv && demoMode) {
      router.replace("/")
    }
  }, [demoMode, missingEnv, router])

  async function signIn() {
    if (missingEnv) return
    const supabase = getSupabaseBrowserClient()
    setLoading(true)
    setError("")
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) setError(signInError.message)
    else router.replace("/")
    setLoading(false)
  }

  async function signUp() {
    if (missingEnv) return
    const supabase = getSupabaseBrowserClient()
    setLoading(true)
    setError("")
    const { error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) setError(signUpError.message)
    else router.replace("/")
    setLoading(false)
  }

  return (
    <div className="mx-auto mt-16 max-w-md rounded-3xl border border-[#e5d7c5] bg-paper p-6">
      <h1 className="text-xl font-semibold">登录 / 注册</h1>
      <p className="mt-1 text-sm text-soft">私密关系认知空间，仅你可见。</p>
      <div className="mt-4 space-y-3">
        <input
          className="w-full rounded-2xl border border-[#ddcfbe] px-3 py-2"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-2xl border border-[#ddcfbe] px-3 py-2"
          placeholder="密码"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {missingEnv ? (
        <p className="mt-3 text-sm text-[#b24f45]">
          缺少 Supabase 环境变量。请在 `.env.local` 或 Vercel 设置 `NEXT_PUBLIC_SUPABASE_URL` 与
          `NEXT_PUBLIC_SUPABASE_ANON_KEY`（或 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`）。
        </p>
      ) : null}
      <div className="mt-4 flex gap-2">
        <button className="rounded-full bg-[#795548] px-4 py-2 text-sm text-white" disabled={loading} onClick={signIn}>
          登录
        </button>
        <button className="rounded-full border border-[#d3c3b1] px-4 py-2 text-sm" disabled={loading} onClick={signUp}>
          注册
        </button>
        {demoMode ? (
          <button
            className="rounded-full border border-[#d3c3b1] px-4 py-2 text-sm"
            onClick={() => router.replace("/")}
          >
            进入演示
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-sm text-[#b24f45]">{error}</p> : null}
    </div>
  )
}
