"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"

import { getPlanByKey, type PayChannel } from "@/lib/pricing-config"
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
          <h1 className="text-2xl font-bold text-[#2f251d] md:text-3xl">💛 嗨，我是晓观</h1>
          <p className="mt-3 text-base leading-7 text-[#3e2e22]">
            很开心能陪你走过人际关系里的每一段细碎旅程，接住你的情绪内耗，帮你看清每一段关系里的真心与距离。
          </p>
          <p className="mt-3 text-base leading-7 text-[#3e2e22]">
            我是个人独立开发的陪伴工具，没有融资、没有广告，只靠你的善意与心意，才能一直安安静静地陪着你，慢慢更新、慢慢变好。
          </p>
          <p className="mt-3 text-base leading-7 text-[#3e2e22]">
            如果你觉得我的陪伴对你有帮助，可以选一份小小的心意支持我，我会用更长时间的专属陪伴，来回馈你的信任。
          </p>
          <p className="mt-4 rounded-[12px] border border-[#f0cbc8] bg-[#fff5f4] px-4 py-3 text-sm font-semibold text-[#b3473f]">
            所有心意均为自愿赠与，不强制、不自动续费、不退款。
          </p>
        </section>

        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 shadow-[0_6px_18px_rgba(95,73,53,0.08)]">
          <h2 className="text-xl font-semibold text-[#2f251d]">四档心意方案</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-[12px] border border-[#e7dacc] bg-[#fff8ef] p-4">
              <p className="text-base font-semibold text-[#2f251d]">🥘 一席暖心家宴 · 一生挚友 | ¥499</p>
              <p className="mt-2 text-sm leading-6 text-[#5c4637]">
                谢谢你愿意把我当成一辈子的同行人。适合想要安安心心、无任何后顾之忧，让我长久陪着你梳理关系的你。支持后，我会为你永久解锁全部专属陪伴功能，未来所有的更新与成长，都想第一时间和你分享。
              </p>
            </div>
            <div className="rounded-[12px] border border-[#e7dacc] bg-[#fff8ef] p-4">
              <p className="text-base font-semibold text-[#2f251d]">🌸 一整个四季的花束 · 四季相伴 | ¥199</p>
              <p className="mt-2 text-sm leading-6 text-[#5c4637]">
                谢谢你愿意陪我走过一整个春夏秋冬。适合想要完整体验一整年的陪伴，慢慢感受关系变化的你。支持后，我会为你解锁一整年的专属陪伴权限，陪你记录每一段互动，梳理每一次情绪。
              </p>
            </div>
            <div className="rounded-[12px] border border-[#e7dacc] bg-[#fff8ef] p-4">
              <p className="text-base font-semibold text-[#2f251d]">☕ 三杯手冲暖心咖啡 · 一季同行 | ¥59</p>
              <p className="mt-2 text-sm leading-6 text-[#5c4637]">
                谢谢你愿意给我三个月的时间，陪你度过这段需要梳理的日子。适合短期内有集中的关系复盘、情绪梳理需求，想要轻量陪伴的你。支持后，我会为你解锁三个月的专属陪伴权限，安安静静接住你的每一份情绪。
              </p>
            </div>
            <div className="rounded-[12px] border border-[#e7dacc] bg-[#fff8ef] p-4">
              <p className="text-base font-semibold text-[#2f251d]">🌷 一支温柔小花 · 一月同行 | ¥25</p>
              <p className="mt-2 text-sm leading-6 text-[#5c4637]">
                谢谢你的这一份小小的心意，我会用一整个月的认真陪伴来回馈。适合想要先试试我的陪伴，感受专属功能的你。按月支持，不用有任何顾虑，随时可停，轻松无负担。
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 shadow-[0_6px_18px_rgba(95,73,53,0.08)]">
          <h2 className="text-xl font-semibold text-[#2f251d]">我的专属陪伴，会为你带来</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-7 text-[#5c4637]">
            <li>无限次和我倾诉你的关系困扰，我会一直在这里听你说</li>
            <li>专属的深度关系分析，帮你看清每一段关系的真心与距离</li>
            <li>每一个联系人的专属陪伴顾问，随时为你解答关于 TA 的困惑</li>
            <li>完整的关系趋势与情绪复盘，陪你看见自己的每一步成长</li>
            <li>未来所有新的陪伴功能，你都能第一时间体验</li>
            <li>多设备同步，无论你在哪，我都能接住你的情绪</li>
          </ul>
        </section>

        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 shadow-[0_6px_18px_rgba(95,73,53,0.08)]">
          <h2 className="text-xl font-semibold text-[#2f251d]">如何开启我的专属陪伴</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-base leading-7 text-[#5c4637]">
            <li>选一份你想表达的心意档位</li>
            <li>
              添加我的微信：<span className="font-semibold text-[#2f251d]">Soulrain--</span>
            </li>
            <li>转账时记得备注你的注册账号/邮箱，让我能找到你</li>
            <li>我会在当天内，为你开启专属的陪伴权限</li>
          </ol>
          <p className="mt-4 rounded-[12px] border border-[#f0cbc8] bg-[#fff5f4] px-4 py-3 text-sm font-semibold text-[#b3473f]">
            所有心意均为自愿赠与，不强制、不自动续费、不退款。
          </p>
        </section>

        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 shadow-[0_6px_18px_rgba(95,73,53,0.08)]">
          <h2 className="text-xl font-semibold text-[#2f251d]">支付通道（当前选择：{plan.title} {plan.price}）</h2>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <button
              type="button"
              className="cursor-pointer rounded-[16px] border border-[#e7dacc] bg-[#fff8ee] px-4 py-3 text-left shadow-[0_4px_12px_rgba(95,73,53,0.08)] transition-colors hover:bg-[#fff1df]"
              onClick={() => openChannel("wechat")}
            >
              <p className="text-base font-semibold text-[#2f251d]">微信支付</p>
              <p className="mt-1 text-sm text-[#725948]">点击打开对应套餐付款码并完成转账</p>
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-[16px] border border-[#e7dacc] bg-[#fff8ee] px-4 py-3 text-left shadow-[0_4px_12px_rgba(95,73,53,0.08)] transition-colors hover:bg-[#fff1df]"
              onClick={() => openChannel("alipay")}
            >
              <p className="text-base font-semibold text-[#2f251d]">支付宝</p>
              <p className="mt-1 text-sm text-[#725948]">点击打开对应套餐付款码并完成转账</p>
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
            输入兑换码后即可激活对应陪伴时长。无需强制注册，也支持本地模式激活。
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
