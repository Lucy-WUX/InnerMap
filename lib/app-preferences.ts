const KEY_THEME = "pss-theme"
const KEY_FONT = "pss-font-scale"
const KEY_LANG = "pss-lang"
const KEY_DATA_OPT = "pss-data-optimize"

export type ThemePreference = "system" | "light" | "dark"

export function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system"
  const v = localStorage.getItem(KEY_THEME)
  if (v === "light" || v === "dark" || v === "system") return v
  return "system"
}

export function setStoredTheme(theme: ThemePreference) {
  localStorage.setItem(KEY_THEME, theme)
}

export function applyTheme(theme: ThemePreference) {
  const root = document.documentElement
  root.classList.remove("dark")
  if (theme === "dark") {
    root.classList.add("dark")
    return
  }
  if (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.classList.add("dark")
  }
}

export function initThemeFromStorage() {
  applyTheme(getStoredTheme())
}

let systemMql: MediaQueryList | null = null

/** 在「跟随系统」下，系统深浅色切换时同步 `html.dark` */
export function subscribeSystemTheme(callback?: () => void) {
  if (typeof window === "undefined") return () => undefined
  systemMql = window.matchMedia("(prefers-color-scheme: dark)")
  const handler = () => {
    if (getStoredTheme() === "system") applyTheme("system")
    callback?.()
  }
  systemMql.addEventListener("change", handler)
  return () => systemMql?.removeEventListener("change", handler)
}

export function getStoredFontScale(): number {
  if (typeof window === "undefined") return 1
  const v = parseFloat(localStorage.getItem(KEY_FONT) ?? "1")
  if (Number.isFinite(v) && v >= 0.85 && v <= 1.35) return v
  return 1
}

export function setStoredFontScale(scale: number) {
  localStorage.setItem(KEY_FONT, String(scale))
}

export function applyFontScale(scale: number) {
  document.documentElement.style.setProperty("--pss-font-scale", String(scale))
}

export function initFontFromStorage() {
  applyFontScale(getStoredFontScale())
}

export type AppLang = "zh-CN"

export function getStoredLang(): AppLang {
  if (typeof window === "undefined") return "zh-CN"
  const v = localStorage.getItem(KEY_LANG)
  if (v === "zh-CN") return "zh-CN"
  return "zh-CN"
}

export function setStoredLang(lang: AppLang) {
  localStorage.setItem(KEY_LANG, lang)
}

/** 未设置键时默认关闭（含本地模式说明） */
export function getStoredDataOptimize(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(KEY_DATA_OPT) === "1"
}

export function setStoredDataOptimize(on: boolean) {
  localStorage.setItem(KEY_DATA_OPT, on ? "1" : "0")
}
