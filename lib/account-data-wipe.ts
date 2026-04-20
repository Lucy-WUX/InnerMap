import type { SupabaseClient } from "@supabase/supabase-js"

const TABLES_WITH_USER_ID = ["entries", "relationships", "ai_usage"] as const

export async function deleteAllUserDataRows(
  admin: SupabaseClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  for (const table of TABLES_WITH_USER_ID) {
    const { error } = await admin.from(table).delete().eq("user_id", userId)
    if (error) return { ok: false, message: `${table}: ${error.message}` }
  }
  return { ok: true }
}
