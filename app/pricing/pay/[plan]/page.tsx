"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"

import { BackNavButton } from "@/components/back-nav-button"
import { getPlanByKey } from "@/lib/pricing-config"
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

  const backBtnClass =
    "inline-flex min-h-10 items-center justify-center rounded-full border border-[#c4a882] bg-[#fffdf9] px-4 py-2 text-sm font-semibold text-[#3d2a22] shadow-[0_1px_3px_rgba(107,63,46,0.08)] transition-colors hover:bg-[#faf3eb] dark:border-[#c4a882] dark:bg-[#fffdf9] dark:text-[#3d2a22]"

  if (!plan) {
    return (
      <main className="pricing-pay-root min-h-screen bg-[#faf8f5] px-4 py-10 text-[#4a3026] [color-scheme:light] dark:bg-[#faf8f5] dark:text-[#4a3026]">
        <div className="mx-auto max-w-[760px] space-y-4">
          <BackNavButton fallbackHref="/pricing" className={backBtnClass}>
            ← 返回
          </BackNavButton>
          <div className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 shadow-[0_6px_18px_rgba(95,73,53,0.08)] dark:border-[#e7dacc] dark:bg-[#fffdf9]">
            <p className="text-lg font-medium text-[#3d2a22] dark:text-[#3d2a22]">未找到对应套餐，请返回定价页重新选择。</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="pricing-pay-root min-h-screen bg-[#faf8f5] px-4 py-8 text-[#4a3026] [color-scheme:light] dark:bg-[#faf8f5] dark:text-[#4a3026] md:px-8">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <div>
          <BackNavButton fallbackHref="/pricing" className={backBtnClass}>
            ← 返回
          </BackNavButton>
        </div>
        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 shadow-[0_6px_18px_rgba(95,73,53,0.08)] dark:border-[#e7dacc] dark:bg-[#fffdf9]">
          <h1 className="text-2xl font-bold text-[#3d2a22] dark:text-[#3d2a22] md:text-3xl">💛 嗨，我是晓观</h1>
          <p className="mt-3 text-base leading-7 text-[#4a3026] dark:text-[#4a3026]">
            很开心能陪你走过人际关系里的每一段细碎旅程，接住你的情绪内耗，帮你看清每一段关系里的真心与距离。
          </p>
          <p className="mt-3 text-base leading-7 text-[#4a3026] dark:text-[#4a3026]">
            我是个人独立开发的陪伴工具，没有融资、没有广告，只靠你的善意与心意，才能一直安安静静地陪着你，慢慢更新、慢慢变好。
          </p>
          <p className="mt-3 text-base leading-7 text-[#4a3026] dark:text-[#4a3026]">
            如果你觉得我的陪伴对你有帮助，可以选一份小小的心意支持我，我会用更长时间的专属陪伴，来回馈你的信任。
          </p>
          <p className="mt-4 rounded-[12px] border border-[#e5d0bf] bg-[#fdf7ef] px-4 py-3 text-sm font-semibold text-[#3d2a22] dark:border-[#e5d0bf] dark:bg-[#fdf7ef] dark:text-[#3d2a22]">
            所有心意均为自愿赠与，不强制、不自动续费、不退款。
          </p>
        </section>

        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 shadow-[0_6px_18px_rgba(95,73,53,0.08)] dark:border-[#e7dacc] dark:bg-[#fffdf9]">
          <h2 className="text-xl font-semibold text-[#3d2a22] dark:text-[#3d2a22]">你选择的心意方案</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#4a3026] dark:text-[#4a3026]">
            以下仅展示你从定价页进入的这一档说明。若想更换档位，可先返回定价页重新选择。
          </p>
          <div className="mt-4">
            <div className="rounded-[12px] border-2 border-[#d4bc9f] bg-[#fff8ef] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-[#d4bc9f] dark:bg-[#fff8ef]">
              <p className="text-base font-semibold text-[#3d2a22] dark:text-[#3d2a22]">
                {plan.title} · {plan.subtitle} | {plan.price}
              </p>
              <p className="mt-3 text-sm leading-7 text-[#4a3026] dark:text-[#4a3026]">{plan.quote}</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-[#4a3026] marker:text-[#6b4a18] dark:text-[#4a3026] dark:marker:text-[#6b4a18]">
                {plan.bullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 shadow-[0_6px_18px_rgba(95,73,53,0.08)] dark:border-[#e7dacc] dark:bg-[#fffdf9]">
          <h2 className="text-xl font-semibold text-[#3d2a22] dark:text-[#3d2a22]">我的专属陪伴，会为你带来</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-7 text-[#4a3026] marker:text-[#6b4a18] dark:text-[#4a3026] dark:marker:text-[#6b4a18]">
            <li className="text-[#4a3026] dark:text-[#4a3026]">AI 询问无限次，想到就能问，我会一直在这里听你说</li>
            <li className="text-[#4a3026] dark:text-[#4a3026]">按档位开放关系复盘与日记复盘推送（日/周/月/年）</li>
            <li className="text-[#4a3026] dark:text-[#4a3026]">每一个联系人的专属陪伴顾问，随时为你解答关于 TA 的困惑</li>
            <li className="text-[#4a3026] dark:text-[#4a3026]">完整的关系趋势与情绪复盘，陪你看见自己的每一步成长</li>
            <li className="text-[#4a3026] dark:text-[#4a3026]">未来所有新的陪伴功能，你都能第一时间体验</li>
            <li className="text-[#4a3026] dark:text-[#4a3026]">注册账号即可多设备同步，这不是 Pro 限定能力</li>
          </ul>
        </section>

        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 shadow-[0_6px_18px_rgba(95,73,53,0.08)] dark:border-[#e7dacc] dark:bg-[#fffdf9]">
          <h2 className="text-xl font-semibold text-[#3d2a22] dark:text-[#3d2a22]">如何开启我的专属陪伴</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-base leading-7 text-[#4a3026] dark:text-[#4a3026]">
            <li className="text-[#4a3026] dark:text-[#4a3026]">
              确认你的心意档位：
              <span className="font-semibold text-[#3d2a22] dark:text-[#3d2a22]">
                {plan.title} · {plan.subtitle}（{plan.price}）
              </span>
            </li>
            <li className="text-[#4a3026] dark:text-[#4a3026]">
              添加我的微信：<span className="font-semibold text-[#3d2a22] dark:text-[#3d2a22]">Soulrain--</span>
            </li>
            <li className="text-[#4a3026] dark:text-[#4a3026]">转账时记得备注你的注册账号/邮箱，让我能找到你</li>
            <li className="text-[#4a3026] dark:text-[#4a3026]">我会在当天内，为你开启专属的陪伴权限</li>
          </ol>
          <p className="mt-4 rounded-[12px] border border-[#e5d0bf] bg-[#fdf7ef] px-4 py-3 text-sm font-semibold text-[#3d2a22] dark:border-[#e5d0bf] dark:bg-[#fdf7ef] dark:text-[#3d2a22]">
            所有心意均为自愿赠与，不强制、不自动续费、不退款。
          </p>
        </section>

        <section className="rounded-[16px] border border-[#d8c9b8] bg-[#fffaf4] p-6 shadow-[0_8px_20px_rgba(95,73,53,0.12)] dark:border-[#d8c9b8] dark:bg-[#fffaf4]">
          <h2 className="text-xl font-semibold text-[#3d2a22] dark:text-[#3d2a22]">🔑 已有兑换码？直接激活</h2>
          <p className="mt-2 text-base text-[#4a3026] dark:text-[#4a3026]">
            输入兑换码后即可激活对应陪伴时长。无需强制注册，也支持本地模式激活。
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.trim())}
              className="h-11 w-full rounded-[16px] border border-[#c8b49f] bg-[#fffdf9] px-4 text-base text-[#3d2a22] outline-none ring-0 transition-shadow placeholder:text-[#7a5c45] focus:border-[#8b5a42] focus:shadow-[0_0_0_3px_rgba(139,90,66,0.18)] dark:border-[#c8b49f] dark:bg-[#fffdf9] dark:text-[#3d2a22] dark:placeholder:text-[#7a5c45]"
              placeholder="请输入兑换码"
            />
            <button
              type="button"
              className="cursor-pointer rounded-[16px] border border-[#b8a090] bg-[#f0e4d6] px-6 py-3 text-base font-semibold text-[#3d2a22] transition-colors hover:bg-[#e8d8c4] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#b8a090] dark:bg-[#f0e4d6] dark:text-[#3d2a22] dark:hover:bg-[#e8d8c4]"
              onClick={redeemNow}
              disabled={redeemBusy}
            >
              {redeemBusy ? "激活中..." : "立即激活"}
            </button>
          </div>
          {redeemTip ? (
            <p className="mt-3 text-sm font-medium text-[#4a3026] dark:text-[#4a3026]">{redeemTip}</p>
          ) : null}
        </section>
      </div>
    </main>
  )
}
