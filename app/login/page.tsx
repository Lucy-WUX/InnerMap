"use client"

import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import { getSupabaseBrowserClient, isBrowserSupabaseReady, isDemoModeEnabled } from "@/lib/supabase-browser"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")
  const isSignupMode = mode === "signup"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [showOtpPanel, setShowOtpPanel] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resendingOtp, setResendingOtp] = useState(false)
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
    setStatus("")
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) setError(signInError.message)
    else router.replace("/?tab=home")
    setLoading(false)
  }

  async function signUp() {
    if (missingEnv) return
    const supabase = getSupabaseBrowserClient()
    setLoading(true)
    setError("")
    setStatus("")
    setShowOtpPanel(false)
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) setError(signUpError.message)
    else if (!data.session) {
      setShowOtpPanel(true)
      setStatus("注册成功，验证码已发送到邮箱。请填写验证码完成验证。")
    } else {
      router.replace("/?tab=home")
    }
    setLoading(false)
  }

  async function verifyEmailOtp() {
    if (missingEnv) return
    if (!email.trim() || !otpCode.trim()) {
      setError("请先填写邮箱和验证码。")
      return
    }
    const supabase = getSupabaseBrowserClient()
    setVerifyingOtp(true)
    setError("")
    setStatus("")
    const { error: otpError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otpCode.trim(),
      type: "signup",
    })
    if (otpError) {
      setError(otpError.message)
    } else {
      setStatus("邮箱验证成功，正在进入应用…")
      router.replace("/?tab=home")
    }
    setVerifyingOtp(false)
  }

  async function resendOtpCode() {
    if (missingEnv) return
    if (!email.trim()) {
      setError("请先填写邮箱。")
      return
    }
    const supabase = getSupabaseBrowserClient()
    setResendingOtp(true)
    setError("")
    setStatus("")
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    })
    if (resendError) setError(resendError.message)
    else setStatus("验证码已重新发送，请检查邮箱。")
    setResendingOtp(false)
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
        <div className="relative">
          <input
            className="w-full rounded-2xl border border-[#ddcfbe] px-3 py-2 pr-16"
            placeholder="密码"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-btn-ds border border-[#d3c3b1] px-2 py-1 text-xs text-soft"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "隐藏" : "显示"}
          </button>
        </div>
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
      <p className="mt-3 text-xs text-soft">
        {isSignupMode ? "当前为注册模式：建议先注册，再登录。" : "已有账号可直接登录；新用户请先注册。"}
      </p>
      {showOtpPanel ? (
        <div className="mt-3 rounded-2xl border border-[#e5d7c5] bg-[#fffaf2] p-3">
          <p className="text-sm font-medium text-ink">填写邮箱验证码</p>
          <p className="mt-1 text-xs text-soft">已向该邮箱发送验证码，输入后完成验证并登录。</p>
          <div className="mt-2 flex gap-2">
            <input
              className="w-full rounded-2xl border border-[#ddcfbe] px-3 py-2 text-sm"
              placeholder="6位验证码"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
            />
            <button
              type="button"
              className="shrink-0 rounded-full border border-[#d3c3b1] px-3 py-2 text-sm"
              onClick={resendOtpCode}
              disabled={resendingOtp}
            >
              {resendingOtp ? "发送中" : "重发"}
            </button>
          </div>
          <button
            type="button"
            className="mt-2 rounded-full bg-[#0f766e] px-4 py-2 text-sm text-white hover:bg-[#0d5f58]"
            onClick={verifyEmailOtp}
            disabled={verifyingOtp}
          >
            {verifyingOtp ? "验证中..." : "验证并登录"}
          </button>
        </div>
      ) : null}
      {status ? <p className="mt-2 text-sm text-[#0f766e]">{status}</p> : null}
      {error ? <p className="mt-3 text-sm text-[#b24f45]">{error}</p> : null}
    </div>
  )
}
