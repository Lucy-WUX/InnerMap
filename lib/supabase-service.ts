import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let serviceClient: SupabaseClient | null = null

/** 使用 Service Role，仅用于服务端受控的账号/数据清理；切勿暴露给浏览器 */
export function getSupabaseServiceRoleClient(): SupabaseClient | null {
  if (!supabaseUrl || !serviceKey) return null
  if (!serviceClient) {
    serviceClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return serviceClient
}
