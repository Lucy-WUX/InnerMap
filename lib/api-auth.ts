import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function getUserIdFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization") || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
  if (!token) return null
  const serverSupabase = getSupabaseServerClient()
  const { data, error } = await serverSupabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}
