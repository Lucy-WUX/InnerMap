import type { Metadata } from "next"
import { Suspense } from "react"

import { AppPreferencesBootstrap } from "@/components/app-preferences-bootstrap"
import { AppShell } from "@/components/app-shell"

import Loading from "./loading"

import "./globals.css"

export const metadata: Metadata = {
  title: "InnerMap",
  description: "私密关系认知空间 · AI 辅助人际关系复盘",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <AppPreferencesBootstrap />
        <Suspense fallback={<Loading />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  )
}
