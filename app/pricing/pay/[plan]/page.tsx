"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"

import { PricingPaymentReminderCard } from "@/components/pricing-payment-reminder"
import { getPlanByKey, PLAN_TITLE_MAP, type PayChannel } from "@/lib/pricing-config"
import { useAuthStore } from "@/lib/stores/auth-store"
import { activateLocalProOffline } from "@/src/lib/local-pro-license"
import { setProSubscriberDemo } from "@/src/lib/product-limits"

type PayPageProps = {
  params: Promise<{ plan: string }>
}

export default function PricingPayPage({ params }: PayPageProps) {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const { plan: planParam } = use(params)
  const plan = getPlanByKey(planParam)
  const [redeemCode, setRedeemCode] = useState("")
  const [redeemBusy, setRedeemBusy] = useState(false)
  const [redeemTip, setRedeemTip] = useState("")
  const [payTip, setPayTip] = useState("")

  async function openChannel(channel: PayChannel) {
    setPayTip("")
    try {
      const res = await fetch(`/api/billing/payment-link?plan=${encodeURIComponent(planParam)}&channel=${channel}`)
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setPayTip(data.error ?? "支付链接暂不可用，请稍后再试。")
        return
      }
      window.open(data.url, "_blank", "noopener,noreferrer")
    } catch {
      setPayTip("支付链接暂不可用，请稍后再试。")
    }
  }

  async function redeemNow() {
    const code = redeemCode.trim()
    if (!code) {
      setRedeemTip("请输入兑换码。")
      return
    }
    setRedeemBusy(true)
    setRedeemTip("")
    try {
      const localActivated = await activateLocalProOffline(code)
      if (!localActivated.ok) {
        setRedeemTip(localActivated.error)
        return
      }
      setProSubscriberDemo(true)
      setRedeemTip("本地激活成功：当前设备已解锁 Pro 功能。可注册账号，将 Pro 状态同步到所有设备。")

      if (accessToken) {
        void fetch("/api/billing/sync-local-license", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ code }),
        }).catch(() => undefined)
      }
      setTimeout(() => router.push("/?tab=mine"), 900)
    } finally {
      setRedeemBusy(false)
    }
  }

  if (!plan) {
    return (
      <main className="min-h-screen bg-[#faf8f5] px-4 py-10 text-[#4f3a2c]">
        <div className="mx-auto max-w-[760px] rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 shadow-[0_6px_18px_rgba(95,73,53,0.08)]">
          <p className="text-lg">未找到对应套餐，请返回定价页重新选择。</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] px-4 py-8 text-[#4f3a2c] md:px-8">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 shadow-[0_6px_18px_rgba(95,73,53,0.08)]">
          <h1 className="text-2xl font-bold text-[#2f251d] md:text-3xl">💛 InnerMap Pro・一次支持，长期陪伴</h1>
          <p className="mt-3 text-base leading-7 text-[#5c4637]">
            重要承诺：所有核心功能永久免费，无广告，无强制注册。<br />
            Pro 版仅为支持开发、解锁高级能力，你可以一直免费使用到完全满意再升级。
          </p>
          <p className="mt-4 rounded-[12px] border border-[#f0cbc8] bg-[#fff5f4] px-4 py-3 text-sm font-semibold text-[#b3473f]">
            ⚠️ 重要提示：兑换码一经发放，无法退款，请谨慎付费。
          </p>
        </section>

        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 shadow-[0_6px_18px_rgba(95,73,53,0.08)]">
          <h2 className="text-xl font-semibold text-[#2f251d]">📱 扫码付款，领取专属兑换码</h2>
          <div className="mt-4 space-y-2 text-base leading-7 text-[#5c4637]">
            <p>选择上方套餐，查看对应价格（当前已选：{PLAN_TITLE_MAP[plan.key]} {plan.price}）</p>
            <p>扫描下方微信 / 支付宝付款码完成支付</p>
            <p>添加企业微信发送「付款截图 + 购买套餐」</p>
            <p>客服将在 5 分钟内 为你发送专属兑换码</p>
            <p className="font-medium text-[#b3473f]">
              ⚠️ 重要说明：兑换码为虚拟数字产品，一经发出无法退款，请确认后再付款。
            </p>
            <p>客服企业微信：我的企业微信号/二维码</p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <button
              type="button"
              className="cursor-pointer rounded-[16px] border border-[#e7dacc] bg-[#fff8ee] px-4 py-3 text-left shadow-[0_4px_12px_rgba(95,73,53,0.08)] transition-colors hover:bg-[#fff1df]"
              onClick={() => openChannel("wechat")}
            >
              <p className="text-base font-semibold text-[#2f251d]">微信支付</p>
              <p className="mt-1 text-sm text-[#725948]">点击打开对应套餐付款码</p>
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-[16px] border border-[#e7dacc] bg-[#fff8ee] px-4 py-3 text-left shadow-[0_4px_12px_rgba(95,73,53,0.08)] transition-colors hover:bg-[#fff1df]"
              onClick={() => openChannel("alipay")}
            >
              <p className="text-base font-semibold text-[#2f251d]">支付宝</p>
              <p className="mt-1 text-sm text-[#725948]">点击打开对应套餐付款码</p>
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-[16px] border border-[#e7dacc] bg-[#fff8ee] px-4 py-3 text-left shadow-[0_4px_12px_rgba(95,73,53,0.08)] transition-colors hover:bg-[#fff1df]"
              onClick={() => openChannel("stripe")}
            >
              <p className="text-base font-semibold text-[#2f251d]">Stripe</p>
              <p className="mt-1 text-sm text-[#725948]">国际卡支付通道（Checkout）</p>
            </button>
          </div>
          {payTip ? <p className="mt-3 text-sm text-[#b3473f]">{payTip}</p> : null}
        </section>

        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 shadow-[0_6px_18px_rgba(95,73,53,0.08)]">
          <h2 className="text-xl font-semibold text-[#2f251d]">🔑 已有兑换码？直接激活</h2>
          <p className="mt-2 text-base text-[#5c4637]">
            输入你的兑换码，点击激活即可解锁 Pro 功能。无需注册账号，支持纯本地离线激活。
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.trim())}
              className="h-11 w-full rounded-[16px] border border-[#d8c9b9] bg-paper px-4 text-base text-[#795548] outline-none ring-0 transition-shadow placeholder:text-soft focus:border-[#c3ae98] focus:shadow-[0_0_0_3px_rgba(121,85,72,0.12)]"
              placeholder="请输入兑换码"
            />
            <button
              type="button"
              className="cursor-pointer rounded-[16px] bg-[#7a5a2e] px-6 py-3 text-base font-semibold text-[#5C4B3E] transition-colors hover:bg-[#694d27] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={redeemNow}
              disabled={redeemBusy}
            >
              {redeemBusy ? "激活中..." : "立即激活"}
            </button>
          </div>
          {redeemTip ? <p className="mt-3 text-sm text-[#725948]">{redeemTip}</p> : null}
        </section>
      </div>
    </main>
  )
}
