"use client"

import { useEffect } from "react"

import { initFontFromStorage, initThemeFromStorage, subscribeSystemTheme } from "@/lib/app-preferences"

/** 首屏从 localStorage 恢复主题与字号，并监听系统主题（跟随系统时） */
export function AppPreferencesBootstrap() {
  useEffect(() => {
    initThemeFromStorage()
    initFontFromStorage()
    return subscribeSystemTheme()
  }, [])
  return null
}
