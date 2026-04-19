import { NextResponse } from "next/server"

import { getMissingAiEnv } from "@/lib/ai"
import { getMissingPublicSupabaseEnv } from "@/lib/supabase-server"

export async function GET() {
  const missing = Array.from(new Set([...getMissingPublicSupabaseEnv(), ...getMissingAiEnv()]))
  const vercelGuide =
    "请在 Vercel 项目 Settings -> Environment Variables 配置缺失项，然后重新部署。"

  return NextResponse.json({
    ok: missing.length === 0,
    missing,
    message: missing.length === 0 ? "环境变量配置完整。" : `检测到缺失环境变量：${missing.join(", ")}。${vercelGuide}`,
  })
}
