"use client"

import { useEffect, useState } from "react"

import { useAuthStore } from "@/lib/stores/auth-store"

/** Zustand persist 是否已从 localStorage 恢复（与 Supabase 写入 store 无关，仅避免闪断） */
export function useAuthHydration() {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated())

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })
    return unsub
  }, [])

  return hydrated
}

/**
 * 认证状态只读自全局 `useAuthStore`（由 AppShell 同步 Supabase 会话）。
 */
export function useUserSession() {
  const userId = useAuthStore((s) => s.userId)
  const token = useAuthStore((s) => s.accessToken)
  const hydrated = useAuthHydration()

  return {
    loading: !hydrated,
    userId,
    token,
  }
}
