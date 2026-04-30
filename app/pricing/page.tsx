"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { PricingPaymentReminderCard } from "@/components/pricing-payment-reminder"
import { FEATURE_ROWS, PRICING_PLANS, TRUST_PROMISES, type PlanKey } from "@/lib/pricing-config"

export default function PricingPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("lifetime")

  const currentPlan = useMemo(
    () => PRICING_PLANS.find((plan) => plan.key === selectedPlan) ?? PRICING_PLANS[0],
    [selectedPlan]
  )

  return (
    <main className="min-h-screen bg-[#faf8f5] px-4 py-8 text-[#4a3026] sm:px-6 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-[1200px] space-y-8">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 rounded-full border border-[#d8c9b8] bg-[#fffdf9] px-4 py-2 text-sm font-medium text-[#3d2a22] transition-colors hover:bg-[#f8f1e7]"
          >
            ← 返回上一页
          </button>
        </div>
        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 shadow-[0_6px_18px_rgba(95,73,53,0.08)] md:p-8">
          <h1 className="text-3xl font-bold text-[#3d2a22] md:text-4xl">💛 嗨，我是晓观</h1>
          <p className="mt-3 text-base font-medium leading-relaxed text-[#4a3026] md:text-lg">
            很开心能陪你走过人际关系里的每一段细碎旅程，接住你的情绪内耗，帮你看清每一段关系里的真心与距离。
          </p>
          <p className="mt-3 text-base leading-relaxed text-[#4a3026]">
            如果你觉得我的陪伴对你有帮助，可以选一份小小的心意支持我，我会用更长时间的专属陪伴，来回馈你的信任。
          </p>
          <p className="mt-3 text-sm font-semibold text-[#9a3329]">所有心意均为自愿赠与，不强制、不自动续费、不退款。</p>
        </section>

        <section className="overflow-x-auto rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] shadow-[0_6px_18px_rgba(95,73,53,0.08)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#f0e7dd] px-4 py-3 text-xs text-[#6e5c4d]">
            <span className="inline-flex items-center rounded-full bg-[#f3e3cd] px-2.5 py-1 font-semibold text-[#7a4b2f]">永久</span>
            <span className="inline-flex items-center rounded-full bg-[#e7f4ea] px-2.5 py-1 font-semibold text-[#1f6a36]">含 / 免费可用</span>
            <span className="inline-flex items-center rounded-full bg-[#f9e5e4] px-2.5 py-1 font-semibold text-[#9a3329]">不含</span>
            <span className="ml-auto text-[#8a7564]">一眼看清不同档位权益范围</span>
          </div>
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#eee2d5] bg-[#f9f2e8] text-sm text-[#3d2a22]">
                <th className="px-4 py-3 font-semibold">功能对比</th>
                <th className="px-4 py-3 font-semibold">一生挚友</th>
                <th className="px-4 py-3 font-semibold">四季相伴</th>
                <th className="px-4 py-3 font-semibold">一季同行</th>
                <th className="px-4 py-3 font-semibold">一月同行</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map((row) => (
                <tr key={row[0]} className="border-b border-[#f0e7dd] text-sm md:text-base">
                  <td className="px-4 py-3 text-[#4a3026]">{row[0]}</td>
                  {row.slice(1).map((cell, index) => (
                    <td key={`${row[0]}-${index}`} className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold md:text-sm ${
                          cell === "永久"
                            ? "bg-[#f3e3cd] text-[#7a4b2f]"
                            : cell === "含" || cell === "免费可用"
                              ? "bg-[#e7f4ea] text-[#1f6a36]"
                              : "bg-[#f9e5e4] text-[#9a3329]"
                        }`}
                      >
                        {cell}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {PRICING_PLANS.map((plan) => {
            const active = selectedPlan === plan.key
            const isLifetime = plan.key === "lifetime"
            return (
              <button
                key={plan.key}
                type="button"
                className={`cursor-pointer rounded-[16px] p-[1px] text-left transition-all duration-150 hover:-translate-y-0.5 ${
                  isLifetime && active
                    ? "bg-gradient-to-r from-[#d0a64b] via-[#f3d992] to-[#b88b2a] shadow-[0_10px_24px_rgba(180,132,38,0.24)]"
                    : "bg-[#e7dacc] shadow-[0_6px_18px_rgba(95,73,53,0.08)]"
                }`}
                onClick={() => setSelectedPlan(plan.key)}
              >
                <div className={`h-full rounded-[16px] border bg-[#fffdf9] p-5 ${active ? "border-[#ceb498]" : "border-transparent"}`}>
                  {isLifetime ? <span className="mb-3 inline-flex rounded-full bg-[#fff1c7] px-3 py-1 text-xs font-semibold text-[#6b4a18]">💛 最长陪伴</span> : null}
                  <h3 className="text-[32px] font-semibold leading-tight text-[#3d2a22]">{plan.title}</h3>
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <span className="text-[24px] font-bold text-[#3d2a22]">{plan.price}</span>
                    {plan.originalPrice ? <span className="text-sm text-[#6e5c4d] line-through">{plan.originalPrice}</span> : null}
                    {plan.saveText ? <span className="text-sm font-semibold text-[#b32d26]">{plan.saveText}</span> : null}
                  </div>
                  <p className="mt-3 text-xl font-semibold text-[#4a3026]">{plan.subtitle}</p>
                  <p className="mt-3 border-l-4 border-[#c4b5a4] pl-4 text-lg text-[#4a3026]">{plan.quote}</p>
                  <ul className="mt-4 space-y-2 text-lg text-[#4a3026]">
                    {plan.bullets.map((item) => (
                      <li key={item} className="leading-relaxed">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </button>
            )
          })}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TRUST_PROMISES.map((item) => (
            <div
              key={item.title}
              className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-4 shadow-[0_6px_18px_rgba(95,73,53,0.08)]"
            >
              <p className="text-lg font-semibold text-[#3d2a22]">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#4a3026]">{item.desc}</p>
            </div>
          ))}
        </section>

        <PricingPaymentReminderCard />

        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 text-center shadow-[0_6px_18px_rgba(95,73,53,0.08)] md:p-8">
          <p className="text-base leading-relaxed text-[#4a3026]">
            <span className="font-medium text-[#3d2a22]">当前心意：</span>
            <span className="font-semibold text-[#3d2a22]">{currentPlan.title}</span>
          </p>
          <button
            type="button"
            className="mt-4 w-full cursor-pointer rounded-[16px] border border-[#b8a090] bg-[#f0e4d6] px-6 py-3 text-lg font-semibold text-[#3d2a22] transition-colors hover:bg-[#e8d8c4] md:w-auto"
            onClick={() => router.push(`/pricing/pay/${selectedPlan}`)}
          >
            去开启专属陪伴
          </button>
        </section>
      </div>
    </main>
  )
}
