"use client"

import { useEffect, useState } from "react"

/** 跟随 `html.dark`（与外观设置切换同步），用于少量需随主题变化的内联样式。 */
export function useHtmlDarkClass(): boolean {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const sync = () => setDark(root.classList.contains("dark"))
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => mo.disconnect()
  }, [])

  return dark
}
