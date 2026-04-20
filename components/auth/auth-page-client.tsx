"use client"

import { Lock, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"

import { getSupabaseBrowserClient, isBrowserSupabaseReady, isDemoModeEnabled } from "@/lib/supabase-browser"

const EMAIL_EMPTY = "请输入邮箱地址"
const EMAIL_INVALID = "请输入有效的邮箱地址"
const PASSWORD_EMPTY = "请输入密码"
const SIGNIN_WRONG = "邮箱或密码错误"
const USER_NOT_REGISTERED = "该账号未注册，请先注册"
const PASSWORD_TOO_SHORT = "密码至少需要 6 位字符"
const SIGNUP_PASSWORD_TOO_SHORT = "密码长度至少为 6 位"
const PASSWORD_MISMATCH = "两次输入的密码不一致"
const CONFIRM_PASSWORD_EMPTY = "请再次输入密码"
const EMAIL_ALREADY_REGISTERED = "该邮箱已被注册，请直接登录"

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function mapSignInError(err: { message?: string; code?: string }): string {
  const msg = (err.message || "").toLowerCase()
  const code = err.code || ""

  if (code === "user_not_found" || msg.includes("user not found")) {
    return USER_NOT_REGISTERED
  }
  if (
    code === "invalid_credentials" ||
    msg.includes("invalid login credentials") ||
    msg.includes("invalid email or password")
  ) {
    return SIGNIN_WRONG
  }
  if (msg.includes("email not confirmed")) {
    return "请先完成邮箱验证后再登录"
  }
  if (msg.includes("user_banned") || msg.includes("banned")) {
    return "该账号暂时无法登录，请联系支持"
  }
  return SIGNIN_WRONG
}

export type AuthPageVariant = "login" | "register"

export function AuthPageClient({ variant }: { variant: AuthPageVariant }) {
  const router = useRouter()
  const isRegister = variant === "register"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [showOtpPanel, setShowOtpPanel] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resendingOtp, setResendingOtp] = useState(false)
  const [forgotSending, setForgotSending] = useState(false)
  const [forgotConfirmOpen, setForgotConfirmOpen] = useState(false)
  const missingEnv = !isBrowserSupabaseReady()
  const demoMode = isDemoModeEnabled()

  useEffect(() => {
    if (missingEnv && demoMode) {
      router.replace("/")
    }
  }, [demoMode, missingEnv, router])

  useEffect(() => {
    setConfirmPassword("")
    setShowConfirmPassword(false)
    setError("")
    setForgotConfirmOpen(false)
    if (!isRegister) {
      setShowOtpPanel(false)
      setOtpCode("")
    }
  }, [isRegister])

  function openForgotPasswordConfirm() {
    if (missingEnv) return
    const e = email.trim()
    if (!e) {
      setError(EMAIL_EMPTY)
      return
    }
    if (!isValidEmail(e)) {
      setError(EMAIL_INVALID)
      return
    }
    setError("")
    setStatus("")
    setForgotConfirmOpen(true)
  }

  function validateAuthFields(): boolean {
    const e = email.trim()
    const p = password
    if (!e) {
      setError(EMAIL_EMPTY)
      return false
    }
    if (!isValidEmail(e)) {
      setError(EMAIL_INVALID)
      return false
    }
    if (!p) {
      setError(PASSWORD_EMPTY)
      return false
    }
    if (p.length < 6) {
      setError(PASSWORD_TOO_SHORT)
      return false
    }
    return true
  }

  function validateSignupFields(): boolean {
    const e = email.trim()
    const p = password
    const c = confirmPassword
    if (!e) {
      setError(EMAIL_EMPTY)
      return false
    }
    if (!isValidEmail(e)) {
      setError(EMAIL_INVALID)
      return false
    }
    if (!p) {
      setError(PASSWORD_EMPTY)
      return false
    }
    if (p.length < 6) {
      setError(SIGNUP_PASSWORD_TOO_SHORT)
      return false
    }
    if (!c) {
      setError(CONFIRM_PASSWORD_EMPTY)
      return false
    }
    if (p !== c) {
      setError(PASSWORD_MISMATCH)
      return false
    }
    return true
  }

  async function signIn() {
    if (missingEnv) return
    if (!validateAuthFields()) return
    const supabase = getSupabaseBrowserClient()
    setLoading(true)
    setError("")
    setStatus("")
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (signInError) {
      setError(mapSignInError(signInError as { message?: string; code?: string }))
    } else {
      router.replace("/?tab=home")
    }
    setLoading(false)
  }

  async function signUp() {
    if (missingEnv) return
    if (!validateSignupFields()) return
    const supabase = getSupabaseBrowserClient()
    setLoading(true)
    setError("")
    setStatus("")
    setShowOtpPanel(false)
    const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password })
    if (signUpError) {
      const msg = signUpError.message || ""
      const code = (signUpError as { code?: string }).code || ""
      if (
        code === "user_already_exists" ||
        /already registered|already been registered|user already|email address is already registered/i.test(msg)
      ) {
        setError(EMAIL_ALREADY_REGISTERED)
      } else {
        setError(msg || "注册失败，请稍后再试")
      }
    } else if (!data.session) {
      setShowOtpPanel(true)
      setStatus("注册成功，验证码已发送到邮箱。请填写验证码完成验证。")
    } else {
      router.replace("/?tab=home")
    }
    setLoading(false)
  }

  async function verifyEmailOtp() {
    if (missingEnv) return
    if (!email.trim()) {
      setError(EMAIL_EMPTY)
      return
    }
    if (!isValidEmail(email.trim())) {
      setError(EMAIL_INVALID)
      return
    }
    if (!otpCode.trim()) {
      setError("请输入邮箱验证码")
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
      setError(otpError.message || "验证码无效或已过期")
    } else {
      setStatus("邮箱验证成功，正在进入应用…")
      router.replace("/?tab=home")
    }
    setVerifyingOtp(false)
  }

  async function resendOtpCode() {
    if (missingEnv) return
    if (!email.trim()) {
      setError(EMAIL_EMPTY)
      return
    }
    if (!isValidEmail(email.trim())) {
      setError(EMAIL_INVALID)
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
    if (resendError) setError(resendError.message || "重发失败")
    else setStatus("验证码已重新发送，请检查邮箱。")
    setResendingOtp(false)
  }

  async function sendPasswordReset() {
    if (missingEnv) return
    const e = email.trim()
    if (!e) {
      setError(EMAIL_EMPTY)
      return
    }
    if (!isValidEmail(e)) {
      setError(EMAIL_INVALID)
      return
    }
    const supabase = getSupabaseBrowserClient()
    setForgotSending(true)
    setError("")
    setStatus("")
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(e, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
    })
    if (resetError) {
      setError(resetError.message || "发送失败，请稍后再试")
    } else {
      setStatus("重置链接已发送到邮箱，请查收并按提示操作。")
      setForgotConfirmOpen(false)
    }
    setForgotSending(false)
  }

  function onLoginSubmit(e: FormEvent) {
    e.preventDefault()
    if (isRegister) return
    void signIn()
  }

  function onSignupSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isRegister) return
    void signUp()
  }

  const inputShell =
    "w-full rounded-2xl border border-land-input-border bg-white py-3 text-sm text-ink outline-none ring-0 transition-shadow placeholder:text-soft/60 focus:border-[#c4b5a4] focus:shadow-[0_0_0_3px_rgba(121,85,72,0.12)]"

  const brandPanel = (
    <div className="relative flex min-h-[220px] flex-col justify-center px-8 py-12 text-[#5d4037] sm:px-12 lg:min-h-screen lg:py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#efe6dc] via-[#e5d9cc] to-[#d4c2b0] opacity-95"
        aria-hidden
      />
      <div className="relative">
        <p className="text-lg font-semibold tracking-tight text-[#6d5443]">InnerMap</p>
        <h1 className="mt-4 max-w-lg text-2xl font-bold leading-snug sm:text-3xl lg:text-[1.85rem] lg:leading-tight">
          绘制你的人际地图，导航每一段关系
        </h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-[#6d5433]/90 sm:text-base">私密关系认知空间，仅你可见</p>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-base lg:flex-row">
      <div className="lg:w-1/2 lg:shrink-0">{brandPanel}</div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:py-0">
        <div className="w-full max-w-md rounded-landing-card border border-land-border bg-white p-6 shadow-landing sm:p-8">
          {missingEnv ? (
            <p className="mb-4 rounded-2xl border border-land-border bg-[#fff8f5] p-3 text-sm text-land-error">
              缺少 Supabase 环境变量。请在 `.env.local` 或 Vercel 设置 `NEXT_PUBLIC_SUPABASE_URL` 与
              `NEXT_PUBLIC_SUPABASE_ANON_KEY`（或 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`）。
            </p>
          ) : null}

          {!isRegister ? (
            <>
              <h2 className="text-xl font-semibold text-[#5d4037]">登录</h2>
              <p className="mt-1 text-xs text-soft">登录状态会保存在本浏览器，下次打开将自动保持登录。</p>

              <form className="mt-6 space-y-4" onSubmit={onLoginSubmit}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" />
                  <input
                    className={`${inputShell} pl-10 pr-4`}
                    placeholder="请输入邮箱"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError("")
                      setForgotConfirmOpen(false)
                    }}
                  />
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" />
                  <input
                    className={`${inputShell} pl-10 pr-[5.5rem]`}
                    placeholder="请输入密码"
                    autoComplete="current-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (error) setError("")
                    }}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[#d3c3b1] bg-white px-3 py-1.5 text-xs font-medium text-soft transition-colors hover:bg-[#f8f1e7]"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "隐藏" : "显示"}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={forgotSending || missingEnv}
                    onClick={openForgotPasswordConfirm}
                    className="text-xs font-medium text-ink underline-offset-4 transition-colors hover:text-[#6d4c41] hover:underline disabled:opacity-50"
                  >
                    忘记密码？
                  </button>
                </div>

                {forgotConfirmOpen ? (
                  <div className="rounded-2xl border border-land-border bg-[#fffaf2] p-4 text-sm shadow-sm">
                    <p className="font-medium text-ink">确认发送重置邮件</p>
                    <p className="mt-2 leading-relaxed text-soft">
                      我们将向{" "}
                      <span className="break-all font-medium text-ink">{email.trim()}</span>{" "}
                      发送一封用于重置密码的邮件。请稍后在邮箱中打开链接，并在安全、私密的环境下设置新密码。
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-soft">
                      若邮箱填写有误，请先关闭本提示，修改上方邮箱后再点击「忘记密码」。邮件可能出现在垃圾箱，请一并查看。
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={forgotSending}
                        onClick={() => setForgotConfirmOpen(false)}
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d3c3b1] bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-[#f8f1e7] disabled:opacity-50"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        disabled={forgotSending || missingEnv}
                        onClick={() => void sendPasswordReset()}
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#6d4c41] disabled:opacity-50"
                      >
                        {forgotSending ? "发送中…" : "确认发送"}
                      </button>
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading || missingEnv}
                  className="flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#6d4c41] disabled:opacity-50"
                >
                  {loading ? "登录中…" : "登录"}
                </button>
                {error ? <p className="mt-3 text-sm text-land-error">{error}</p> : null}
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-land-border" />
                <span className="text-xs text-soft">或者</span>
                <div className="h-px flex-1 bg-land-border" />
              </div>

              <p className="text-center text-sm text-soft">
                还没有账号？{" "}
                <Link href="/register" className="font-medium text-ink underline-offset-4 hover:underline">
                  立即注册
                </Link>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-[#5d4037]">注册</h2>
              <p className="mt-1 text-xs text-soft">创建账号后即可在私密空间中记录关系与复盘。</p>

              <form className="mt-6 space-y-4" onSubmit={onSignupSubmit}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" />
                  <input
                    className={`${inputShell} pl-10 pr-4`}
                    placeholder="请输入邮箱"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError("")
                    }}
                  />
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" />
                  <input
                    className={`${inputShell} pl-10 pr-[5.5rem]`}
                    placeholder="请输入密码"
                    autoComplete="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (error) setError("")
                    }}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[#d3c3b1] bg-white px-3 py-1.5 text-xs font-medium text-soft transition-colors hover:bg-[#f8f1e7]"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "隐藏" : "显示"}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" />
                  <input
                    className={`${inputShell} pl-10 pr-[5.5rem]`}
                    placeholder="请再次输入密码"
                    autoComplete="new-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (error) setError("")
                    }}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[#d3c3b1] bg-white px-3 py-1.5 text-xs font-medium text-soft transition-colors hover:bg-[#f8f1e7]"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? "隐藏" : "显示"}
                  </button>
                </div>

                <p className="text-center text-[11px] leading-relaxed text-soft sm:text-xs">
                  点击注册即表示你同意我们的{" "}
                  <Link href="/terms" className="font-medium text-ink underline-offset-2 hover:underline">
                    服务条款
                  </Link>{" "}
                  和{" "}
                  <Link href="/privacy" className="font-medium text-ink underline-offset-2 hover:underline">
                    隐私政策
                  </Link>
                </p>

                <button
                  type="submit"
                  disabled={loading || missingEnv}
                  className="flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#6d4c41] disabled:opacity-50"
                >
                  {loading ? "注册中…" : "注册"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-soft">
                已有账号？{" "}
                <Link href="/login" className="font-medium text-ink underline-offset-4 hover:underline">
                  立即登录
                </Link>
              </p>

              {showOtpPanel ? (
                <div className="mt-5 rounded-2xl border border-land-border bg-[#fffaf2] p-4 shadow-sm">
                  <p className="text-sm font-medium text-ink">填写邮箱验证码</p>
                  <p className="mt-1 text-xs text-soft">已向该邮箱发送验证码，输入后完成验证并登录。</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <input
                      className={`${inputShell} px-4`}
                      placeholder="6 位验证码"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                    />
                    <button
                      type="button"
                      className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-[#d3c3b1] bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-[#f8f1e7] disabled:opacity-50"
                      onClick={() => void resendOtpCode()}
                      disabled={resendingOtp}
                    >
                      {resendingOtp ? "发送中" : "重发"}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#6d4c41] disabled:opacity-50 sm:w-auto"
                    onClick={() => void verifyEmailOtp()}
                    disabled={verifyingOtp}
                  >
                    {verifyingOtp ? "验证中…" : "验证并登录"}
                  </button>
                </div>
              ) : null}

              {error ? <p className="mt-3 text-center text-sm text-land-error">{error}</p> : null}
            </>
          )}

          {demoMode ? (
            <div className="mt-6 border-t border-land-border pt-4 text-center">
              <button
                type="button"
                className="text-xs font-medium text-soft underline-offset-4 hover:text-ink hover:underline"
                onClick={() => router.replace("/")}
              >
                进入演示模式
              </button>
            </div>
          ) : null}

          {status ? <p className="mt-4 text-sm text-[#2d6a4f]">{status}</p> : null}
        </div>
      </div>
    </div>
  )
}
