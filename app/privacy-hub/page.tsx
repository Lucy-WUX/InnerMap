import Link from "next/link"

export default function PrivacyHubPage() {
  return (
    <div className="min-h-screen bg-base px-4 py-10 text-ink sm:px-6">
      <div className="mx-auto max-w-2xl space-y-8">
        <header>
          <p className="text-sm font-medium text-[#6d5443]">InnerMap</p>
          <h1 className="mt-2 text-2xl font-bold text-[#5d4037]">隐私与信任中心</h1>
          <p className="mt-3 text-sm leading-7 text-soft">
            这里用你能读懂的方式，说明我们如何把「比你银行密码更敏感的心事」当作最高优先级。细节与法律效力以
            <Link href="/privacy" className="mx-1 font-medium text-ink underline-offset-2 hover:underline">
              《隐私政策》
            </Link>
            及
            <Link href="/terms" className="mx-1 font-medium text-ink underline-offset-2 hover:underline">
              《使用条款》
            </Link>
            为准。
          </p>
        </header>

        <section className="rounded-landing-card border border-land-border bg-white p-6 shadow-landing sm:p-8">
          <h2 className="text-base font-bold leading-snug text-ink">我们为什么把隐私当作生死线</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-soft">
            <li>你会在这里记录：谁值得深交、谁让你消耗、矛盾与不满、脆弱与秘密、对职场关系的真实看法。</li>
            <li>任何「可能被他人看见」的怀疑，都会摧毁信任；我们把<strong className="font-medium text-ink">杜绝非授权访问</strong>当作产品底线。</li>
            <li>营销与功能描述必须与真实架构一致；夸大或隐瞒同样会击穿信任。</li>
          </ul>
        </section>

        <section className="rounded-landing-card border border-land-border bg-white p-6 shadow-landing sm:p-8">
          <h2 className="text-base font-bold leading-snug text-ink">四条信任支柱（用户感知 → 产品 → 技术 → 合规）</h2>
          <ol className="mt-4 list-decimal space-y-4 pl-5 text-sm leading-7 text-soft">
            <li>
              <strong className="font-medium text-ink">你能感知</strong>
              ：登录前后说明清楚数据去哪、谁能看；敏感操作二次确认；公共设备风险提示。
            </li>
            <li>
              <strong className="font-medium text-ink">产品默认克制</strong>
              ：不向其他用户展示你的记录；AI 与分享类能力遵循最小暴露；能力边界写进界面与政策。
            </li>
            <li>
              <strong className="font-medium text-ink">技术最小泄露面</strong>
              ：加密传输、账户隔离（Supabase）、密钥不进前端；日志与观测尽量不落正文与全量提示词（持续收紧中）。
            </li>
            <li>
              <strong className="font-medium text-ink">法律可追溯</strong>
              ：政策与真实处理一致并可持续更新；第三方（认证、模型、邮件）委托关系在《隐私政策》中说明。
            </li>
          </ol>
        </section>

        <section className="rounded-landing-card border border-[#d7e7d9] bg-[#f3fbf4] p-6 sm:p-8">
          <h2 className="text-base font-bold leading-snug text-ink">你现在已经可以做的事</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-soft">
            <li>
              <strong className="font-medium text-ink">未登录（仅本机）</strong>
              时，联系人、日记与互动默认只存在你的浏览器里；在「我的」中仍可
              <strong className="font-medium text-ink">导出 JSON / CSV</strong> 与
              <strong className="font-medium text-ink">一键清除本机数据</strong>，无需任何服务端账号。
            </li>
            <li>
              若已<strong className="font-medium text-ink">注册并同步</strong>，同一入口还可清空云端同步数据，或通过「永久注销账号」删除账户及关联库表（需在部署环境配置服务端密钥）。
            </li>
            <li>
              退出登录、勿在公共电脑保持登录；已注册用户可通过登录页「忘记密码」按邮件指引重置密码。
            </li>
            <li>
              完整数据处理说明见
              <Link href="/privacy" className="mx-1 font-medium text-ink underline-offset-2 hover:underline">
                《隐私政策》
              </Link>
              。
            </li>
          </ul>
        </section>

        <section className="rounded-landing-card border border-land-border bg-[#fffaf5] p-6 sm:p-8">
          <h2 className="text-base font-bold leading-snug text-ink">路线图（诚实预告）</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-soft">
            <li>
              <strong className="font-medium text-ink">更细粒度的按条目删除与审计日志</strong>：便于在保留账号的前提下精确管理单条记录（规划中）。
            </li>
            <li>
              <strong className="font-medium text-ink">AI 与日志策略白皮书</strong>：对外说明哪些字段会经服务端、保留多久、如何脱敏（持续文档化）。
            </li>
            <li>
              <strong className="font-medium text-ink">独立安全与漏洞披露渠道</strong>：便于白帽与严重问题直达（规划中）。
            </li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d3c3b1] bg-white px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-[#f8f1e7]"
          >
            返回晓观页
          </Link>
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2 text-sm font-medium text-[#fffdf9] shadow-sm transition-colors hover:bg-[#6d4c41] hover:text-[#fffdf9]"
          >
            阅读完整隐私政策
          </Link>
        </div>
      </div>
    </div>
  )
}
