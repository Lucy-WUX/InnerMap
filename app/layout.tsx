import type { Metadata } from "next"
import { Suspense } from "react"

import { AppShell } from "@/components/app-shell"

import "./globals.css"

export const metadata: Metadata = {
  title: "InnerMap",
  description: "私密关系认知空间 · AI 辅助人际关系复盘",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Suspense fallback={<div className="min-h-screen bg-base" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  )
}
