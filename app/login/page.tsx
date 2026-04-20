"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

import { AuthPageClient } from "@/components/auth/auth-page-client"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      router.replace("/register")
    }
  }, [router, searchParams])

  return <AuthPageClient variant="login" />
}
