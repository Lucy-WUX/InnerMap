/** 封面/定价/支付页统一的付款与承诺提醒（图1 样式） */
export function PricingPaymentReminderCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-[16px] border border-[#d8c9b9] bg-[#fffdf9] px-6 py-8 text-center shadow-[0_6px_18px_rgba(95,73,53,0.08)] ${className}`}
    >
      <p className="text-base font-semibold text-[#6B3F2E]">所有核心功能永久免费，无广告，无强制注册</p>
      <p className="mt-2 text-sm font-medium leading-relaxed text-[#6B3F2E]">
        Pro 版为自愿支持，兑换码一经发放无法退款，请谨慎付费
      </p>
    </div>
  )
}
