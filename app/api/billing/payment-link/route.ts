import { NextRequest, NextResponse } from "next/server"

import type { PayChannel, PlanKey } from "@/lib/pricing-config"

type LinkMap = Record<PlanKey, string>

const stripeLinks: LinkMap = {
  lifetime: process.env.STRIPE_LINK_LIFETIME ?? "",
  year: process.env.STRIPE_LINK_YEAR ?? "",
  quarter: process.env.STRIPE_LINK_QUARTER ?? "",
  month: process.env.STRIPE_LINK_MONTH ?? "",
}

const wechatLinks: LinkMap = {
  lifetime: process.env.WECHAT_QR_LIFETIME ?? "",
  year: process.env.WECHAT_QR_YEAR ?? "",
  quarter: process.env.WECHAT_QR_QUARTER ?? "",
  month: process.env.WECHAT_QR_MONTH ?? "",
}

const alipayLinks: LinkMap = {
  lifetime: process.env.ALIPAY_QR_LIFETIME ?? "",
  year: process.env.ALIPAY_QR_YEAR ?? "",
  quarter: process.env.ALIPAY_QR_QUARTER ?? "",
  month: process.env.ALIPAY_QR_MONTH ?? "",
}

function isPlanKey(value: string): value is PlanKey {
  return value === "lifetime" || value === "year" || value === "quarter" || value === "month"
}

function isChannel(value: string): value is PayChannel {
  return value === "stripe" || value === "wechat" || value === "alipay"
}

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get("plan") ?? ""
  const channel = req.nextUrl.searchParams.get("channel") ?? ""

  if (!isPlanKey(plan) || !isChannel(channel)) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 })
  }

  const source = channel === "stripe" ? stripeLinks : channel === "wechat" ? wechatLinks : alipayLinks
  const url = source[plan]
  if (!url) {
    return NextResponse.json(
      { error: `尚未配置 ${channel} - ${plan} 的支付链接，请先在环境变量中配置。` },
      { status: 404 }
    )
  }

  return NextResponse.json({ url })
}
