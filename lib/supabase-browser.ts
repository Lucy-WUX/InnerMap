import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const demoModeEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true"

let client: SupabaseClient | null = null

function isPlaceholderValue(value: string | undefined) {
  if (!value) return true
  return value.includes("your-project-ref") || value.includes("your-anon-key")
}

export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey || isPlaceholderValue(supabaseUrl) || isPlaceholderValue(supabaseAnonKey)) {
    throw new Error(
      "Supabase 未正确配置。请在本地 .env.local 或 Vercel 项目环境变量中填写真实 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY 后重启。"
    )
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}

export function isBrowserSupabaseReady() {
  return Boolean(supabaseUrl && supabaseAnonKey && !isPlaceholderValue(supabaseUrl) && !isPlaceholderValue(supabaseAnonKey))
}

export function isDemoModeEnabled() {
  return demoModeEnabled
}
