import { useState } from "react"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import type { Dispatch, SetStateAction } from "react"

import type { GroupKey, RelationContact } from "./types"

type RelationHealthItem = {
  label: string
  count: number
  color: string
  ratio: number
}

type RelationsSectionProps = {
  relationHealthData: RelationHealthItem[]
  healthChartReady: boolean
  healthPulseStrength: number
  activeHealthLabel: string | null
  activeHealth: RelationHealthItem | null
  setHoveredHealthLabel: (value: string | null) => void
  animatedHealthRatios: number[]
  openPage4WithContact: (contactId: string) => void
  openInteractionForContact: (contactId: string) => void
  openCreateContact: () => void
  setShowNewGroupDialog: (value: boolean) => void
  relationsFocusGroup: GroupKey | "全部"
  setRelationsFocusGroup: (value: GroupKey | "全部") => void
  contacts: RelationContact[]
  groupsWithContacts: GroupKey[]
  allGroups: GroupKey[]
  relationVisibleContacts: RelationContact[]
  relationsSearchQuery: string
  setRelationsSearchQuery: (value: string) => void
  relationsSortBy: "recent" | "intimacy" | "trueFriend"
  setRelationsSortBy: (value: "recent" | "intimacy" | "trueFriend") => void
  selectedRelationIds: string[]
  setSelectedRelationIds: Dispatch<SetStateAction<string[]>>
  setContacts: Dispatch<SetStateAction<RelationContact[]>>
  energySpotlightItems: { id: string; title: string; desc: string; alert: boolean }[]
}

export function RelationsSection({
  relationHealthData,
  healthChartReady,
  healthPulseStrength,
  activeHealthLabel,
  activeHealth,
  setHoveredHealthLabel,
  animatedHealthRatios,
  openPage4WithContact,
  openInteractionForContact,
  openCreateContact,
  setShowNewGroupDialog,
  relationsFocusGroup,
  setRelationsFocusGroup,
  contacts,
  groupsWithContacts,
  allGroups,
  relationVisibleContacts,
  relationsSearchQuery,
  setRelationsSearchQuery,
  relationsSortBy,
  setRelationsSortBy,
  selectedRelationIds,
  setSelectedRelationIds,
  setContacts,
  energySpotlightItems,
}: RelationsSectionProps) {
  const [bulkMode, setBulkMode] = useState(false)
  const [batchMoveTarget, setBatchMoveTarget] = useState<GroupKey>(allGroups[0] ?? "朋友")

  const getTrueFriendBarStyle = (score: number) => {
    const width = `${Math.min(100, Math.max(0, (score / 10) * 100))}%`
    let color = "#BDBDBD"
    if (score >= 7.5) color = "#66BB6A"
    else if (score >= 6) color = "#8BC34A"
    else if (score >= 4.5) color = "#FFA726"
    else if (score >= 3) color = "#FFB74D"
    return { width, color }
  }

  return (
    <section className="grid gap-ds-md lg:grid-cols-[320px_1fr]">
      <aside className="space-y-ds-xs">
        <Card className="rounded-ds border border-warm-base bg-paper p-ds-lg">
          <h3 className="text-ds-title">关系健康度</h3>
          <div className="mt-ds-xs flex items-center gap-ds-md">
            <div
              className="relative h-28 w-28 transition-all duration-500"
              style={{
                opacity: healthChartReady ? 1 : 0,
                transform: healthChartReady ? "scale(1)" : "scale(0.92)",
                filter:
                  activeHealth
                    ? `drop-shadow(0 0 ${6 + healthPulseStrength * 8}px rgba(99,102,241,${0.14 + healthPulseStrength * 0.18}))`
                    : "none",
              }}
            >
              <div
                className="h-full w-full rounded-full transition-transform duration-500"
                style={{
                  background: "conic-gradient(#66BB6A 0 26.7%, #FFA726 26.7% 66.7%, #BDBDBD 66.7% 100%)",
                  transform: healthChartReady ? "rotate(-90deg)" : "rotate(-240deg)",
                }}
              />
              <div className="absolute inset-[14px] flex items-center justify-center rounded-full bg-white text-center">
                {activeHealth ? (
                  <div className="-translate-y-0.5 leading-tight">
                    <p className="text-ds-caption text-soft">{activeHealth.label}</p>
                    <p className="text-lg font-semibold text-ink">{activeHealth.count}</p>
                  </div>
                ) : (
                  <div className="-translate-y-0.5 leading-tight">
                    <p className="text-ds-caption text-soft">总联系</p>
                    <p className="text-lg font-semibold text-ink">15</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-ds-xs">
              {relationHealthData.map((item, index) => (
                <div
                  key={item.label}
                  className="rounded-md px-1 py-0.5 transition-colors duration-200 hover:bg-slate-50"
                  onMouseEnter={() => setHoveredHealthLabel(item.label)}
                  onMouseLeave={() => setHoveredHealthLabel(null)}
                  style={{
                    boxShadow:
                      activeHealthLabel === item.label
                        ? `0 0 0 ${1 + healthPulseStrength * 4}px ${item.color}22`
                        : "none",
                  }}
                >
                  <div className="flex items-center justify-between text-ds-caption text-soft">
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full transition-transform duration-300"
                        style={{
                          backgroundColor: item.color,
                          transform: activeHealthLabel === item.label ? `scale(${1 + healthPulseStrength * 0.24})` : "scale(1)",
                          boxShadow:
                            activeHealthLabel === item.label
                              ? `0 0 0 ${1 + healthPulseStrength * 4}px ${item.color}30`
                              : "none",
                        }}
                      />
                      {item.label} {item.count}人
                    </span>
                    <span>{Math.round(animatedHealthRatios[index] ?? 0)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full transition-all duration-700"
                      style={{
                        width: `${animatedHealthRatios[index] ?? 0}%`,
                        backgroundColor: item.color,
                        transitionDelay: `${120 + index * 90}ms`,
                        opacity: activeHealthLabel && activeHealthLabel !== item.label ? 0.45 : 1,
                        boxShadow:
                          activeHealthLabel === item.label
                            ? `0 0 ${4 + healthPulseStrength * 10}px ${item.color}66`
                            : "none",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-ds-xs rounded-ds border border-warm-soft bg-surface-warm-soft px-3 py-2 text-ds-caption text-soft">
            <div className="flex flex-wrap items-center gap-ds-xs">
              <span
                className="inline-flex items-center gap-1 rounded-btn-ds bg-[#E8F5E9] px-2 py-0.5 text-[#2E7D32]"
                title="因与张三互动能量 +2，真朋友指数上升"
              >
                ↑ 真朋友 +1
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-btn-ds bg-[#FDECEC] px-2 py-0.5 text-[#C62828]"
                title="与赵航本周互动减少，暂列入需观察"
              >
                ↓ 需观察 -1
              </span>
              <span className="text-slate-500">整体关系稳定度提升。</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-ds border border-[#E9D5B8] bg-[#FFF8EA] p-ds-lg">
          <p className="text-ds-title text-[#6d5433]">👑 解锁无限 AI 分析与完整报告</p>
          <p className="mt-1 text-ds-caption text-[#8a6a45]">
            免费版含 20 位联系人与每日 15 次 AI；开通 Pro 可无限问答、导出完整报告、自动更新评分。
          </p>
          <button
            className="mt-ds-xs rounded-btn-ds border border-[#b6905e] bg-surface-warm-soft px-3 py-1.5 text-ds-caption font-medium text-[#7a5a2e] hover:bg-[#fff3dc]"
            onClick={() => window.dispatchEvent(new Event("open-pro-modal"))}
          >
            立即查看 Pro 方案
          </button>
        </Card>

        <Card className="rounded-ds border border-warm-base bg-paper p-ds-lg">
          <h3 className="text-ds-title">⚡ 近期能量消耗</h3>
          <p className="mt-1 text-ds-caption text-soft">结合互动能量与 AI 预警，优先关注标红条目。</p>
          <div className="mt-ds-xs space-y-ds-xs">
            {energySpotlightItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-ds-xs rounded-ds border p-ds-xs ${
                  item.alert ? "border-[#f5c2c7] bg-[#FDECEC]" : "border-warm-soft"
                }`}
              >
                <button
                  className="flex-1 text-left"
                  onClick={() => openPage4WithContact(item.id)}
                >
                  <p className="text-ds-caption font-medium">
                    {item.alert ? "⚠️ " : ""}
                    {item.title} ⬇️
                  </p>
                  <p className="mt-1 text-ds-caption text-soft">{item.desc}</p>
                </button>
                <button
                  className="rounded-btn-ds border border-warm-soft px-1.5 py-1 text-ds-caption hover:bg-surface-warm-soft"
                  title="快捷记录互动"
                  onClick={() => openInteractionForContact(item.id)}
                >
                  📝
                </button>
              </div>
            ))}
          </div>
        </Card>
      </aside>

      <div className="space-y-ds-xs">
        <div className="rounded-ds border border-warm-base bg-paper p-ds-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-ds-title">联系人概览</h3>
            <div className="flex items-center gap-ds-xs">
              <Button size="sm" variant="outline" onClick={() => setShowNewGroupDialog(true)}>
                +分组
              </Button>
              <Button size="sm" variant="outline" onClick={openCreateContact}>
                新建联系人
              </Button>
            </div>
          </div>
          <div className="mt-ds-xs flex flex-wrap items-center gap-ds-xs">
            <input
              className="w-56 rounded-btn-ds border border-warm-soft bg-paper px-2 py-1 text-ds-caption"
              placeholder="搜索姓名/分组/标签"
              value={relationsSearchQuery}
              onChange={(e) => setRelationsSearchQuery(e.target.value)}
            />
            <select
              className="rounded-btn-ds border border-warm-soft bg-paper px-2 py-1 text-ds-caption"
              value={relationsSortBy}
              onChange={(e) => setRelationsSortBy(e.target.value as "recent" | "intimacy" | "trueFriend")}
            >
              <option value="recent">按最近互动</option>
              <option value="intimacy">按亲密度</option>
              <option value="trueFriend">按真朋友指数</option>
            </select>
            <button
              className={`rounded-btn-ds border px-2 py-1 text-ds-caption ${
                bulkMode ? "border-[#6366F1] bg-[#EEF2FF] text-[#3730A3]" : "border-warm-soft bg-paper text-soft"
              }`}
              onClick={() => {
                setBulkMode((prev) => {
                  const next = !prev
                  if (!next) setSelectedRelationIds([])
                  return next
                })
              }}
            >
              批量模式 {bulkMode ? "开" : "关"}
            </button>
            {bulkMode ? (
              <>
                <button
                  className="rounded-btn-ds border border-warm-soft px-2 py-1 text-ds-caption"
                  onClick={() => {
                    if (selectedRelationIds.length === 0) return
                    if (!window.confirm(`确认删除选中的 ${selectedRelationIds.length} 位联系人吗？删除后无法恢复。`)) return
                    setContacts((prev) => prev.filter((c) => !selectedRelationIds.includes(c.id)))
                    setSelectedRelationIds([])
                  }}
                >
                  批量删除
                </button>
                <select
                  className="rounded-btn-ds border border-warm-soft bg-paper px-2 py-1 text-ds-caption"
                  value={batchMoveTarget}
                  onChange={(e) => setBatchMoveTarget(e.target.value as GroupKey)}
                >
                  {allGroups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-btn-ds border border-warm-soft px-2 py-1 text-ds-caption"
                  onClick={() => {
                    if (selectedRelationIds.length === 0) return
                    setContacts((prev) =>
                      prev.map((c) => (selectedRelationIds.includes(c.id) ? { ...c, group: batchMoveTarget } : c))
                    )
                    setSelectedRelationIds([])
                  }}
                >
                  批量移动到此分组
                </button>
              </>
            ) : null}
          </div>
          <div className="mt-ds-xs flex flex-wrap gap-ds-xs">
            <button
                className={`rounded-btn-ds border px-3 py-1 text-ds-caption ${
                relationsFocusGroup === "全部"
                  ? "border-[#6366F1] bg-[#EEF2FF] text-[#3730A3]"
                  : "border-warm-soft bg-surface-warm-soft text-slate-600"
              }`}
              onClick={() => setRelationsFocusGroup("全部")}
            >
              全部 {contacts.length}
            </button>
            {groupsWithContacts.map((group) => {
              const count = contacts.filter((c) => c.group === group).length
              const isActive = relationsFocusGroup === group
              return (
                <button
                  key={group}
                  className={`rounded-btn-ds border px-3 py-1 text-ds-caption ${
                    isActive
                      ? "border-[#6366F1] bg-[#EEF2FF] text-[#3730A3]"
                      : "border-warm-soft bg-surface-warm-soft text-slate-600"
                  }`}
                  onClick={() => setRelationsFocusGroup(group)}
                >
                  {group} {count}
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-ds border border-warm-base bg-paper p-ds-lg">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-ds-caption text-soft">已显示 {relationVisibleContacts.length} 位联系人</p>
            <p className="hidden text-ds-caption text-soft sm:block">点击卡片查看详情与 AI 建议</p>
          </div>
          {relationVisibleContacts.length === 0 ? (
            <div className="rounded-ds border border-dashed border-warm-soft bg-surface-warm-soft p-ds-md text-ds-body text-soft">
              {contacts.length === 0
                ? "你还没有添加任何联系人，点击右上角 ' 新建联系人 ' 开始使用"
                : "当前筛选条件下暂无联系人"}
            </div>
          ) : (
            <div className="grid gap-ds-xs md:grid-cols-2">
              {relationVisibleContacts.map((c) => (
              <button
                key={c.id}
                className="group w-full rounded-xl bg-surface-warm-soft p-3 text-left shadow-ds-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-warm-hover hover:shadow-ds-card-hover"
                onClick={() => openPage4WithContact(c.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-btn-ds bg-[#efe4d3] text-ds-caption text-slate-700">
                      {c.name.slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-ds-body font-medium">{c.name}</p>
                      <div className="mt-1 w-20">
                        <div className="h-1.5 rounded-full bg-[#eadfce]">
                          <div
                            className="h-1.5 origin-left rounded-full transition-all duration-200 group-hover:scale-x-[1.03] group-hover:brightness-110"
                            style={getTrueFriendBarStyle(c.trueFriendScore)}
                          />
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">真朋友 {c.trueFriendScore.toFixed(1)}/10</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-btn-ds bg-surface-warm-soft px-2 py-0.5 text-ds-caption text-slate-500">{c.group}</span>
                    {bulkMode ? (
                      <button
                        className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${
                          selectedRelationIds.includes(c.id)
                            ? "border-[#6366F1] bg-[#6366F1] text-white"
                            : "border-warm-soft bg-paper text-soft"
                        }`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSelectedRelationIds((prev) =>
                            prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                          )
                        }}
                        title={selectedRelationIds.includes(c.id) ? "取消选择" : "选择此联系人"}
                      >
                        {selectedRelationIds.includes(c.id) ? "✓" : "○"}
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="mt-ds-xs line-clamp-2 text-ds-caption text-soft">💬 {c.note}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  最近联系：{c.lastContact?.trim() ? c.lastContact : "暂未联系"}
                </p>
              </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
