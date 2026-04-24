import Link from "next/link"

import { BackNavButton } from "@/components/back-nav-button"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-base px-4 py-10 text-ink sm:px-6">
      <div className="mx-auto max-w-2xl rounded-landing-card border border-land-border bg-white p-8 shadow-landing sm:p-10">
        <p className="text-sm font-medium text-[#6d5443]">InnerMap</p>
        <h1 className="mt-2 text-2xl font-bold text-[#5d4037]">隐私政策</h1>
        <p className="mt-4 text-sm leading-7 text-soft">
          本页说明 InnerMap 实际产品中的信息处理方式。使用 InnerMap 即表示你理解并同意相关约定；应用内营销与功能介绍均不应与本页及《使用条款》相冲突。
        </p>
        <div className="mt-6 rounded-ds border-2 border-energy-positive/30 bg-[#e8f0ea] px-ds-md py-ds-md text-center shadow-sm">
          <p className="text-sm font-semibold leading-[1.5] text-energy-positive">
            🔒 内容与账户绑定，经 Supabase 同步至云端，仅你本人可访问。
          </p>
          <p className="mt-1 text-xs leading-[1.6] text-energy-positive">
            晓观等 AI 与数据处理以本页（隐私政策）说明为准。
          </p>
        </div>
        <ul className="mt-6 list-disc space-y-3 pl-5 text-sm leading-7 text-soft">
          <li>
            <strong className="font-medium text-ink">登录与账户：</strong>
            你使用邮箱注册/登录时，身份认证与账户会话由 <strong className="font-medium text-ink">Supabase</strong>{" "}
            按其服务条款与安全实践提供（含加密传输、常见隔离与访问控制）。InnerMap 依赖该服务完成登录态校验与账户关联。
          </li>
          <li>
            <strong className="font-medium text-ink">你的内容如何存放：</strong>
            你在应用内填写的联系人、日记、互动等记录与你的账户绑定；为在已登录设备间保持一致体验，相关数据会经安全连接
            <strong className="font-medium text-ink">同步至由 Supabase 托管的后端</strong>。
            这些内容<strong className="font-medium text-ink">不会向其他 InnerMap 用户公开展示</strong>，仅供你在登录后于自己的空间内使用与复盘。
          </li>
          <li>
            <strong className="font-medium text-ink">本地与缓存：</strong>
            为流畅使用，浏览器中可能存在本地缓存或草稿；其与云端数据的关系以你当前登录账户及同步逻辑为准，不以「仅本地、不上传」作为产品承诺。
          </li>
          <li>
            <strong className="font-medium text-ink">AI 功能：</strong>
            若你开启 AI 相关能力，请求可能经 <strong className="font-medium text-ink">InnerMap 服务端</strong>{" "}
            转发至模型提供商；请避免在内容中提交高度敏感的个人数据，并知悉第三方模型服务有其独立条款。
          </li>
          <li>
            <strong className="font-medium text-ink">通用安全提示：</strong>
            请勿在公共或他人设备上长期保持登录；退出登录可减少他人接触你账户的风险。
          </li>
        </ul>
        <p className="mt-6 text-sm leading-7 text-soft">
          若本页与具体功能界面表述不一致，以本页及后续更新为准。如有疑问，可通过应用内渠道或仓库联系方式反馈。
        </p>
        <BackNavButton className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-[#d3c3b1] bg-white px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-[#f8f1e7]" />
      </div>
    </div>
  )
}
