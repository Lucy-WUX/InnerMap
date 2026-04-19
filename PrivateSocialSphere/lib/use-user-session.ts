"use client"

import { useEffect, useState } from "react"

import { getSupabaseBrowserClient, isBrowserSupabaseReady } from "@/lib/supabase-browser"

export function useUserSession() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (!isBrowserSupabaseReady()) {
      setLoading(false)
      return
    }
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null)
      setToken(data.session?.access_token ?? null)
      setLoading(false)
    })
  }, [])

  return { loading, userId, token }
}
