"use client"

import { useEffect, useMemo, useState } from "react"

import { PLAN_TITLE_MAP, type PlanKey } from "@/lib/pricing-config"

type RedeemCodeRow = {
  id: string
  plan_key: PlanKey
  code_mask: string
  status: "issued" | "redeemed" | "disabled"
  used_by: string | null
  used_at: string | null
  issued_at: string
  expires_at: string | null
  order_ref: string | null
  channel: "wechat" | "alipay" | "stripe" | "manual" | null
  note: string | null
}

type AuditRow = {
  id: number
  code_id: string | null
  event_type: string
  actor_user_id: string | null
  request_id: string | null
  ip: string | null
  user_agent: string | null
  detail: Record<string, unknown>
  created_at: string
}

function toIsoOrEmpty(v: string) {
  if (!v) return ""
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString()
}

export default function BillingAdminPage() {
  const [adminKey, setAdminKey] = useState("")

  const [issuePlan, setIssuePlan] = useState<PlanKey>("month")
  const [issueCount, setIssueCount] = useState(10)
  const [issueChannel, setIssueChannel] = useState<"wechat" | "alipay" | "stripe" | "manual">("manual")
  const [issueExpiresAt, setIssueExpiresAt] = useState("")
  const [issueNote, setIssueNote] = useState("")
  const [issueResult, setIssueResult] = useState<string[]>([])
  const [issueTip, setIssueTip] = useState("")
  const [issueBusy, setIssueBusy] = useState(false)
  const [issueLocalMode, setIssueLocalMode] = useState(false)
  const [issueValidDays, setIssueValidDays] = useState<number>(30)

  const [codeRows, setCodeRows] = useState<RedeemCodeRow[]>([])
  const [codeTip, setCodeTip] = useState("")
  const [codeBusy, setCodeBusy] = useState(false)
  const [codeStatus, setCodeStatus] = useState("")
  const [codePlan, setCodePlan] = useState("")
  const [codeUserId, setCodeUserId] = useState("")
  const [codeOrderRef, setCodeOrderRef] = useState("")
  const [codeFrom, setCodeFrom] = useState("")
  const [codeTo, setCodeTo] = useState("")

  const [auditRows, setAuditRows] = useState<AuditRow[]>([])
  const [auditTip, setAuditTip] = useState("")
  const [auditBusy, setAuditBusy] = useState(false)
  const [auditUserId, setAuditUserId] = useState("")
  const [auditRequestId, setAuditRequestId] = useState("")
  const [auditEventType, setAuditEventType] = useState("")
  const [auditFrom, setAuditFrom] = useState("")
  const [auditTo, setAuditTo] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("billing-admin-key")
    if (saved) setAdminKey(saved)
  }, [])

  useEffect(() => {
    if (adminKey) localStorage.setItem("billing-admin-key", adminKey)
  }, [adminKey])

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-billing-admin-key": adminKey,
    }),
    [adminKey]
  )

  async function issueCodes() {
    if (!adminKey) return setIssueTip("请先输入 BILLING_ADMIN_KEY")
    setIssueBusy(true)
    setIssueTip("")
    setIssueResult([])
    try {
      const endpoint = issueLocalMode ? "/api/billing/admin/issue-local-codes" : "/api/billing/admin/issue-codes"
      const payload = issueLocalMode
        ? {
            plan: issuePlan,
            count: issueCount,
            validDays: issueValidDays > 0 ? issueValidDays : null,
          }
        : {
            plan: issuePlan,
            count: issueCount,
            channel: issueChannel,
            expiresAt: toIsoOrEmpty(issueExpiresAt) || null,
            note: issueNote.trim() || null,
          }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; codes?: string[] }
      if (!res.ok) return setIssueTip(data.error ?? "发码失败")
      setIssueResult(data.codes ?? [])
      setIssueTip(`发码成功，共 ${data.codes?.length ?? 0} 个。请立即保存。`)
      void loadRedeemCodes()
    } finally {
      setIssueBusy(false)
    }
  }

  async function loadRedeemCodes() {
    if (!adminKey) return setCodeTip("请先输入 BILLING_ADMIN_KEY")
    setCodeBusy(true)
    setCodeTip("")
    try {
      const qs = new URLSearchParams()
      if (codeStatus) qs.set("status", codeStatus)
      if (codePlan) qs.set("plan", codePlan)
      if (codeUserId.trim()) qs.set("userId", codeUserId.trim())
      if (codeOrderRef.trim()) qs.set("orderRef", codeOrderRef.trim())
      if (toIsoOrEmpty(codeFrom)) qs.set("from", toIsoOrEmpty(codeFrom))
      if (toIsoOrEmpty(codeTo)) qs.set("to", toIsoOrEmpty(codeTo))
      const res = await fetch(`/api/billing/admin/redeem-codes?${qs.toString()}`, {
        headers: { "x-billing-admin-key": adminKey },
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; rows?: RedeemCodeRow[] }
      if (!res.ok) return setCodeTip(data.error ?? "查询失败")
      setCodeRows(data.rows ?? [])
      setCodeTip(`已加载 ${data.rows?.length ?? 0} 条`)
    } finally {
      setCodeBusy(false)
    }
  }

  async function patchCodeStatus(id: string, action: "disable" | "enable") {
    if (!adminKey) return setCodeTip("请先输入 BILLING_ADMIN_KEY")
    const res = await fetch(`/api/billing/admin/redeem-codes/${id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ action }),
    })
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    if (!res.ok) return setCodeTip(data.error ?? "操作失败")
    void loadRedeemCodes()
  }

  async function loadAuditLogs() {
    if (!adminKey) return setAuditTip("请先输入 BILLING_ADMIN_KEY")
    setAuditBusy(true)
    setAuditTip("")
    try {
      const qs = new URLSearchParams()
      if (auditUserId.trim()) qs.set("userId", auditUserId.trim())
      if (auditRequestId.trim()) qs.set("requestId", auditRequestId.trim())
      if (auditEventType.trim()) qs.set("eventType", auditEventType.trim())
      if (toIsoOrEmpty(auditFrom)) qs.set("from", toIsoOrEmpty(auditFrom))
      if (toIsoOrEmpty(auditTo)) qs.set("to", toIsoOrEmpty(auditTo))
      const res = await fetch(`/api/billing/admin/audit-logs?${qs.toString()}`, {
        headers: { "x-billing-admin-key": adminKey },
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; rows?: AuditRow[] }
      if (!res.ok) return setAuditTip(data.error ?? "查询失败")
      setAuditRows(data.rows ?? [])
      setAuditTip(`已加载 ${data.rows?.length ?? 0} 条`)
    } finally {
      setAuditBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] px-4 py-6 text-[#4f3a2c] md:px-8">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-5 shadow-[0_6px_18px_rgba(95,73,53,0.08)]">
          <h1 className="text-2xl font-bold text-[#2f251d]">运营后台 · 兑换码管理</h1>
          <p className="mt-2 text-sm text-[#6b5342]">用于批量发码、核销查询、审计检索、失效/禁用操作。</p>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className="mt-3 h-11 w-full rounded-[12px] border border-[#d8c9b9] bg-paper px-3 text-sm"
            placeholder="请输入 BILLING_ADMIN_KEY"
          />
        </section>

        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-5 shadow-[0_6px_18px_rgba(95,73,53,0.08)]">
          <h2 className="text-xl font-semibold text-[#2f251d]">批量发码</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setIssueLocalMode(false)}
              className={`rounded px-3 py-1 ${issueLocalMode ? "bg-[#f2e9df] text-[#6b5342]" : "bg-[#7a5a2e] text-[#5C4B3E]"}`}
            >
              联网核销码
            </button>
            <button
              type="button"
              onClick={() => setIssueLocalMode(true)}
              className={`rounded px-3 py-1 ${issueLocalMode ? "bg-[#7a5a2e] text-[#5C4B3E]" : "bg-[#f2e9df] text-[#6b5342]"}`}
            >
              本地离线码
            </button>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-5">
            <select className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3" value={issuePlan} onChange={(e) => setIssuePlan(e.target.value as PlanKey)}>
              {Object.entries(PLAN_TITLE_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3" type="number" min={1} max={500} value={issueCount} onChange={(e) => setIssueCount(Number(e.target.value))} placeholder="数量" />
            {issueLocalMode ? (
              <>
                <input
                  className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3"
                  type="number"
                  min={1}
                  max={3650}
                  value={issueValidDays}
                  onChange={(e) => setIssueValidDays(Number(e.target.value))}
                  placeholder="有效天数（0=永久）"
                />
                <div className="h-11 rounded-[12px] border border-dashed border-[#d8c9b9] bg-[#fff8ee] px-3 py-2 text-xs text-[#6b5342]">
                  本地离线码采用签名校验，不依赖网络。
                </div>
                <div className="h-11 rounded-[12px] border border-dashed border-[#d8c9b9] bg-[#fff8ee] px-3 py-2 text-xs text-[#6b5342]">
                  每个码包含 maxDevices=3 的策略声明。
                </div>
              </>
            ) : (
              <>
                <select className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3" value={issueChannel} onChange={(e) => setIssueChannel(e.target.value as "wechat" | "alipay" | "stripe" | "manual")}>
                  <option value="manual">manual</option>
                  <option value="wechat">wechat</option>
                  <option value="alipay">alipay</option>
                  <option value="stripe">stripe</option>
                </select>
                <input className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3" type="datetime-local" value={issueExpiresAt} onChange={(e) => setIssueExpiresAt(e.target.value)} />
                <input className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3" value={issueNote} onChange={(e) => setIssueNote(e.target.value)} placeholder="备注" />
              </>
            )}
          </div>
          <button disabled={issueBusy} onClick={issueCodes} className="mt-3 rounded-[12px] bg-[#7a5a2e] px-4 py-2 text-[#5C4B3E] disabled:opacity-60">
            {issueBusy ? "发码中..." : "生成兑换码"}
          </button>
          {issueTip ? <p className="mt-2 text-sm text-[#6b5342]">{issueTip}</p> : null}
          {issueResult.length > 0 ? (
            <textarea readOnly value={issueResult.join("\n")} className="mt-3 h-40 w-full rounded-[12px] border border-[#d8c9b9] bg-[#fff8ee] p-3 text-sm" />
          ) : null}
        </section>

        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-5 shadow-[0_6px_18px_rgba(95,73,53,0.08)]">
          <h2 className="text-xl font-semibold text-[#2f251d]">已核销查询 / 失效禁用</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-6">
            <select className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3" value={codeStatus} onChange={(e) => setCodeStatus(e.target.value)}>
              <option value="">全部状态</option>
              <option value="issued">issued</option>
              <option value="redeemed">redeemed</option>
              <option value="disabled">disabled</option>
            </select>
            <select className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3" value={codePlan} onChange={(e) => setCodePlan(e.target.value)}>
              <option value="">全部套餐</option>
              {Object.entries(PLAN_TITLE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3" value={codeUserId} onChange={(e) => setCodeUserId(e.target.value)} placeholder="用户ID" />
            <input className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3" value={codeOrderRef} onChange={(e) => setCodeOrderRef(e.target.value)} placeholder="订单号" />
            <input className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3" type="datetime-local" value={codeFrom} onChange={(e) => setCodeFrom(e.target.value)} />
            <input className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3" type="datetime-local" value={codeTo} onChange={(e) => setCodeTo(e.target.value)} />
          </div>
          <button disabled={codeBusy} onClick={loadRedeemCodes} className="mt-3 rounded-[12px] bg-[#7a5a2e] px-4 py-2 text-[#5C4B3E] disabled:opacity-60">
            {codeBusy ? "查询中..." : "查询兑换码"}
          </button>
          {codeTip ? <p className="mt-2 text-sm text-[#6b5342]">{codeTip}</p> : null}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#eee2d5] bg-[#f9f2e8]">
                  <th className="px-2 py-2 text-left">code_mask</th>
                  <th className="px-2 py-2 text-left">plan</th>
                  <th className="px-2 py-2 text-left">status</th>
                  <th className="px-2 py-2 text-left">used_by</th>
                  <th className="px-2 py-2 text-left">used_at</th>
                  <th className="px-2 py-2 text-left">order_ref</th>
                  <th className="px-2 py-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {codeRows.map((row) => (
                  <tr key={row.id} className="border-b border-[#f2e9df]">
                    <td className="px-2 py-2">{row.code_mask}</td>
                    <td className="px-2 py-2">{row.plan_key}</td>
                    <td className="px-2 py-2">{row.status}</td>
                    <td className="px-2 py-2">{row.used_by ?? "-"}</td>
                    <td className="px-2 py-2">{row.used_at ?? "-"}</td>
                    <td className="px-2 py-2">{row.order_ref ?? "-"}</td>
                    <td className="px-2 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => patchCodeStatus(row.id, "disable")}
                          disabled={row.status === "disabled"}
                          className="rounded bg-[#b75247] px-2 py-1 text-[#5C4B3E] disabled:opacity-50"
                        >
                          禁用
                        </button>
                        <button
                          onClick={() => patchCodeStatus(row.id, "enable")}
                          disabled={row.status === "redeemed" || row.status === "issued"}
                          className="rounded bg-[#5a7c4d] px-2 py-1 text-[#5C4B3E] disabled:opacity-50"
                        >
                          启用
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[16px] border border-[#e7dacc] bg-[#fffdf9] p-5 shadow-[0_6px_18px_rgba(95,73,53,0.08)]">
          <h2 className="text-xl font-semibold text-[#2f251d]">按用户/订单/时间审计检索</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-5">
            <input className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3" value={auditUserId} onChange={(e) => setAuditUserId(e.target.value)} placeholder="用户ID" />
            <input className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3" value={auditRequestId} onChange={(e) => setAuditRequestId(e.target.value)} placeholder="request_id" />
            <input className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3" value={auditEventType} onChange={(e) => setAuditEventType(e.target.value)} placeholder="event_type" />
            <input className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3" type="datetime-local" value={auditFrom} onChange={(e) => setAuditFrom(e.target.value)} />
            <input className="h-11 rounded-[12px] border border-[#d8c9b9] bg-paper px-3" type="datetime-local" value={auditTo} onChange={(e) => setAuditTo(e.target.value)} />
          </div>
          <button disabled={auditBusy} onClick={loadAuditLogs} className="mt-3 rounded-[12px] bg-[#7a5a2e] px-4 py-2 text-[#5C4B3E] disabled:opacity-60">
            {auditBusy ? "查询中..." : "查询审计日志"}
          </button>
          {auditTip ? <p className="mt-2 text-sm text-[#6b5342]">{auditTip}</p> : null}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#eee2d5] bg-[#f9f2e8]">
                  <th className="px-2 py-2 text-left">time</th>
                  <th className="px-2 py-2 text-left">event</th>
                  <th className="px-2 py-2 text-left">actor_user</th>
                  <th className="px-2 py-2 text-left">request_id</th>
                  <th className="px-2 py-2 text-left">ip</th>
                  <th className="px-2 py-2 text-left">code_id</th>
                </tr>
              </thead>
              <tbody>
                {auditRows.map((row) => (
                  <tr key={row.id} className="border-b border-[#f2e9df]">
                    <td className="px-2 py-2">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="px-2 py-2">{row.event_type}</td>
                    <td className="px-2 py-2">{row.actor_user_id ?? "-"}</td>
                    <td className="px-2 py-2">{row.request_id ?? "-"}</td>
                    <td className="px-2 py-2">{row.ip ?? "-"}</td>
                    <td className="px-2 py-2">{row.code_id ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
