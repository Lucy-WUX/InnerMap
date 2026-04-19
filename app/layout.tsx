import type { Metadata } from "next"
import { Suspense } from "react"

import { AppShell } from "@/components/app-shell"

import "./globals.css"

export const metadata: Metadata = {
  title: "PrivateSocialSphere",
  description: "私密关系认知教练工具",
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
