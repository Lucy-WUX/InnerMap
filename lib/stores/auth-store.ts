import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

/** localStorage key for persisted access token + user id（与 Supabase 会话同步） */
export const AUTH_STORAGE_KEY = "innermap-auth"

type AuthState = {
  accessToken: string | null
  userId: string | null
  setAuth: (payload: { accessToken: string | null; userId: string | null }) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      userId: null,
      setAuth: (payload) => set(payload),
      clearAuth: () => set({ accessToken: null, userId: null }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ accessToken: s.accessToken, userId: s.userId }),
    },
  ),
)

/** 退出登录时清空 store 与持久化条目 */
export function clearPersistedAuth() {
  useAuthStore.getState().clearAuth()
  void useAuthStore.persist.clearStorage()
}
