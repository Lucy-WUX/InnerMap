import { NextRequest, NextResponse } from "next/server"

import { isBillingAdminRequest } from "@/lib/billing-admin-auth"
import { signLocalProLicense, type LocalProLicensePayload } from "@/lib/local-pro-license-server"
import type { PlanKey } from "@/lib/pricing-config"

type Body = {
  plan?: PlanKey
  count?: number
  validDays?: number | null
}

function isPlanKey(plan: string): plan is PlanKey {
  return plan === "lifetime" || plan === "year" || plan === "quarter" || plan === "month"
}

export async function POST(req: NextRequest) {
  if (!isBillingAdminRequest(req)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as Body
  const plan = body.plan ?? "month"
  if (!isPlanKey(plan)) {
    return NextResponse.json({ error: "plan 参数无效" }, { status: 400 })
  }
  const count = Math.max(1, Math.min(200, Math.floor(body.count ?? 1)))
  const validDays = body.validDays ?? null
  const now = Date.now()

  try {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      const payload: LocalProLicensePayload = {
        v: 1,
        licenseId: crypto.randomUUID(),
        plan,
        issuedAt: now,
        expiresAt: validDays && validDays > 0 ? now + validDays * 24 * 60 * 60 * 1000 : null,
        maxDevices: 3,
      }
      codes.push(signLocalProLicense(payload))
    }
    return NextResponse.json({
      ok: true,
      plan,
      count,
      mode: "offline-local",
      codes,
      note: "该兑换码可离线校验并本地激活；设备上限策略为 maxDevices=3（离线模式下为策略声明，联网同步后可强校验）。",
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "生成失败"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
