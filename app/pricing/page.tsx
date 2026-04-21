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
    <main className="min-h-screen bg-[#faf8f5] px-4 py-8 text-[#4f3a2c] sm:px-6 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-[1200px] space-y-8">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 rounded-full border border-[#d8c9b8] bg-[#fffdf9] px-4 py-2 text-sm font-medium text-[#5C4B3E] transition-colors hover:bg-[#f8f1e7]"
          >
            ← 返回上一页
          </button>
        </div>
        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 shadow-[0_6px_18px_rgba(95,73,53,0.08)] md:p-8">
          <h1 className="text-3xl font-bold text-[#3e2e22] md:text-4xl">四档付费方案（主推终身版）</h1>
          <p className="mt-3 text-base font-medium leading-relaxed text-[#5C4B3E] md:text-lg">
            温和透明的订阅设计，核心原则是「永久免费」与「数据属于用户」。
          </p>
          <p className="mt-3 text-sm font-semibold text-[#b3473f]">⚠️ 重要提示：兑换码一经发放，无法退款，请谨慎付费。</p>
        </section>

        <section className="overflow-x-auto rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] shadow-[0_6px_18px_rgba(95,73,53,0.08)]">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#eee2d5] bg-[#f9f2e8] text-sm text-[#6c5441]">
                <th className="px-4 py-3 font-semibold">功能对比</th>
                <th className="px-4 py-3 font-semibold">终身</th>
                <th className="px-4 py-3 font-semibold">年付</th>
                <th className="px-4 py-3 font-semibold">季付</th>
                <th className="px-4 py-3 font-semibold">月付</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map((row) => (
                <tr key={row[0]} className="border-b border-[#f0e7dd] text-sm md:text-base">
                  <td className="px-4 py-3 text-[#4f3a2c]">{row[0]}</td>
                  {row.slice(1).map((cell, index) => (
                    <td key={`${row[0]}-${index}`} className={`px-4 py-3 font-medium ${cell === "✅" ? "text-[#1f7a3d]" : "text-[#9c8f83]"}`}>
                      {cell}
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
                  {isLifetime ? (
                    <span className="mb-3 inline-flex rounded-full bg-[#fff1c7] px-3 py-1 text-xs font-semibold text-[#8a6520]">🔥 最推荐</span>
                  ) : null}
                  <h3 className="text-[32px] font-semibold leading-tight text-[#2f251d]">{plan.title}</h3>
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <span className="text-[24px] font-bold text-[#2f251d]">{plan.price}</span>
                    {plan.originalPrice ? <span className="text-sm text-[#9c8f83] line-through">{plan.originalPrice}</span> : null}
                    {plan.saveText ? <span className="text-sm font-semibold text-[#c63f38]">{plan.saveText}</span> : null}
                  </div>
                  <p className="mt-3 text-xl font-semibold text-[#2f251d]">{plan.subtitle}</p>
                  <p className="mt-3 border-l-4 border-[#d8cfc3] pl-4 text-lg text-[#4f3a2c]">{plan.quote}</p>
                  <ul className="mt-4 space-y-2 text-lg text-[#3f3127]">
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
              <p className="text-lg font-semibold text-[#2f251d]">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#6b5342]">{item.desc}</p>
            </div>
          ))}
        </section>

        <PricingPaymentReminderCard />

        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-6 text-center shadow-[0_6px_18px_rgba(95,73,53,0.08)] md:p-8">
          <p className="text-base leading-relaxed">
            <span className="font-medium text-[#5C4B3E]">当前选择：</span>
            <span className="font-semibold text-[#2f251d]">{currentPlan.title}</span>
          </p>
          <button
            type="button"
            className="mt-4 w-full cursor-pointer rounded-[16px] bg-[#7a5a2e] px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-[#694d27] md:w-auto"
            onClick={() => router.push(`/pricing/pay/${selectedPlan}`)}
          >
            立即购买
          </button>
        </section>
      </div>
    </main>
  )
}
