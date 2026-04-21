import { MoreVertical } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"

import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Dialog } from "../ui/dialog"
import { Input } from "../ui/input"

import { DEFAULT_CONTACT_GROUP, type GroupKey, type RelationContact } from "./types"

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
  allGroups: GroupKey[]
  onRenameGroup: (from: GroupKey, to: string) => void
  onDeleteGroup: (group: GroupKey) => void
  relationVisibleContacts: RelationContact[]
  relationsSearchQuery: string
  setRelationsSearchQuery: (value: string) => void
  relationsSortBy: "recent" | "intimacy" | "trueFriend"
  setRelationsSortBy: (value: "recent" | "intimacy" | "trueFriend") => void
  selectedRelationIds: string[]
  setSelectedRelationIds: Dispatch<SetStateAction<string[]>>
  setContacts: Dispatch<SetStateAction<RelationContact[]>>
  onEditContact: (contactId: string) => void
  onDeleteContact: (contactId: string) => void
  requestDeleteConfirm: (action: () => void) => void
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
  allGroups,
  onRenameGroup,
  onDeleteGroup,
  relationVisibleContacts,
  relationsSearchQuery,
  setRelationsSearchQuery,
  relationsSortBy,
  setRelationsSortBy,
  selectedRelationIds,
  setSelectedRelationIds,
  setContacts,
  onEditContact,
  onDeleteContact,
  requestDeleteConfirm,
  energySpotlightItems,
}: RelationsSectionProps) {
  const hasContacts = contacts.length > 0
  const [bulkMode, setBulkMode] = useState(false)
  const [batchMoveTarget, setBatchMoveTarget] = useState<GroupKey>(allGroups[0] ?? DEFAULT_CONTACT_GROUP)
  const [openMenuFor, setOpenMenuFor] = useState<GroupKey | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameFrom, setRenameFrom] = useState<GroupKey | "">("")
  const [renameValue, setRenameValue] = useState("")
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [openContactMenuFor, setOpenContactMenuFor] = useState<string | null>(null)

  useEffect(() => {
    setBatchMoveTarget((prev) =>
      allGroups.includes(prev) ? prev : allGroups[0] ?? DEFAULT_CONTACT_GROUP
    )
  }, [allGroups])

  useEffect(() => {
    if (!openMenuFor) return
    function handlePointerDown(event: MouseEvent) {
      const el = menuRef.current
      if (el && !el.contains(event.target as Node)) setOpenMenuFor(null)
    }
    window.addEventListener("mousedown", handlePointerDown)
    return () => window.removeEventListener("mousedown", handlePointerDown)
  }, [openMenuFor])

  useEffect(() => {
    if (!openContactMenuFor) return
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest?.(`[data-contact-menu="${openContactMenuFor}"]`)) return
      setOpenContactMenuFor(null)
    }
    window.addEventListener("mousedown", handlePointerDown)
    return () => window.removeEventListener("mousedown", handlePointerDown)
  }, [openContactMenuFor])

  useEffect(() => {
    if (!renameOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [renameOpen])

  const healthConicBackground = useMemo(() => {
    const parts = relationHealthData.map((item, i) => ({
      color: item.color,
      ratio: animatedHealthRatios[i] ?? 0,
    }))
    if (parts.every((p) => p.ratio === 0)) {
      return "conic-gradient(#e8e4de 0% 100%)"
    }
    let acc = 0
    const stops = parts.map(({ color, ratio }) => {
      const start = acc
      acc += ratio
      return `${color} ${start}% ${Math.min(100, acc)}%`
    })
    return `conic-gradient(${stops.join(", ")})`
  }, [relationHealthData, animatedHealthRatios])

  const getTrueFriendBarStyle = (score: number) => {
    const width = `${Math.min(100, Math.max(0, (score / 10) * 100))}%`
    let color = "#a39a91"
    if (score >= 7.5) color = "#2d7a4a"
    else if (score >= 6) color = "#3d8f55"
    else if (score >= 4.5) color = "#a67c52"
    else if (score >= 3) color = "#c45c3e"
    return { width, color }
  }

  return (
    <section className="grid gap-ds-md lg:grid-cols-[320px_1fr]">
      <Dialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="重命名分组"
        description="将同步更新该分组下所有联系人与本地存档。"
        maxWidthClassName="max-w-[400px]"
      >
        <label className="block text-ds-body font-medium">
          新名称
          <Input
            className="mt-1"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="输入新分组名"
          />
        </label>
        <div className="mt-ds-md flex justify-end gap-ds-xs">
          <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
            取消
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (renameFrom) onRenameGroup(renameFrom, renameValue)
              setRenameOpen(false)
            }}
          >
            保存
          </Button>
        </div>
      </Dialog>
      <aside className="space-y-ds-xs">
        <Card className="rounded-ds border border-warm-base bg-paper p-ds-lg">
          <h3 className="text-ds-title">关系健康度</h3>
          {hasContacts ? (
            <div className="mt-ds-xs flex items-center gap-ds-md">
              <div
                className="relative h-28 w-28 transition-all duration-500"
                style={{
                  opacity: healthChartReady ? 1 : 0,
                  transform: healthChartReady ? "scale(1)" : "scale(0.92)",
                  filter:
                    activeHealth
                      ? `drop-shadow(0 0 ${6 + healthPulseStrength * 8}px rgba(139,90,66,${0.2 + healthPulseStrength * 0.22}))`
                      : "none",
                }}
              >
                <div
                  className="h-full w-full rounded-full transition-transform duration-500"
                  style={{
                    background: healthConicBackground,
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
                      <p className="text-lg font-semibold text-ink">{contacts.length}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-ds-xs">
                {relationHealthData.map((item, index) => (
                  <div
                    key={item.label}
                    className="rounded-md px-1 py-0.5 transition-colors duration-200 hover:bg-surface-warm-hover"
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
                    <div className="mt-1 h-1.5 rounded-full bg-[#e8e0d6]">
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
          ) : (
            <div className="mt-ds-xs rounded-ds border border-dashed border-warm-soft bg-surface-warm-soft px-3 py-4 text-ds-caption text-soft">
              <p>暂无联系人时，健康度保持空白。</p>
              <p className="mt-1">添加第一位联系人后，会显示分布与趋势。</p>
            </div>
          )}
          <div className="mt-ds-xs rounded-ds border border-warm-soft bg-surface-warm-soft px-3 py-2 text-ds-caption text-[#5c4d42]">
            {!hasContacts ? (
              <ul className="list-inside list-disc space-y-1">
                <li>添加联系人后，按真朋友 / 表面关系指数自动归入三类。</li>
                <li>环形图与占比均来自你的真实数据。</li>
              </ul>
            ) : (
              <ul className="list-inside list-disc space-y-1">
                <li>占比由当前 {contacts.length} 位联系人评分实时计算。</li>
                <li>悬停某一类可查看人数与比例；记录互动后分类会更新。</li>
              </ul>
            )}
          </div>
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
                bulkMode ? "border-[#b6905e] bg-[#fff3dc] text-[#7a5a2e]" : "border-warm-soft bg-paper text-soft"
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
                    requestDeleteConfirm(() => {
                      setContacts((prev) => prev.filter((c) => !selectedRelationIds.includes(c.id)))
                      setSelectedRelationIds([])
                    })
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
                  ? "border-[#b6905e] bg-[#fff3dc] text-[#7a5a2e]"
                  : "border-warm-soft bg-surface-warm-soft text-muted"
              }`}
              onClick={() => setRelationsFocusGroup("全部")}
            >
              全部 {contacts.length}
            </button>
            {allGroups.map((group) => {
              const count = contacts.filter((c) => c.group === group).length
              const isActive = relationsFocusGroup === group
              const canManage = group !== DEFAULT_CONTACT_GROUP
              return (
                <div
                  key={group}
                  className={`inline-flex max-w-full items-stretch rounded-btn-ds border text-ds-caption ${
                    isActive
                      ? "border-[#b6905e] bg-[#fff3dc] text-[#7a5a2e]"
                      : "border-warm-soft bg-surface-warm-soft text-muted"
                  }`}
                >
                  <button
                    type="button"
                    className="min-h-8 px-3 py-1 text-left hover:brightness-[0.98]"
                    onClick={() => setRelationsFocusGroup(group)}
                  >
                    {group} {count}
                  </button>
                  {canManage ? (
                    <div className="relative flex shrink-0 border-l border-[#e7dfd4]" ref={openMenuFor === group ? menuRef : undefined}>
                      <button
                        type="button"
                        className="flex h-full w-8 items-center justify-center text-[#6d5e54] hover:bg-black/[0.04]"
                        aria-label={`「${group}」更多操作`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenMenuFor((prev) => (prev === group ? null : group))
                        }}
                      >
                        <MoreVertical className="h-4 w-4" aria-hidden />
                      </button>
                      {openMenuFor === group ? (
                        <div className="absolute right-0 top-full z-30 mt-1 min-w-[8.5rem] rounded-ds border border-warm-soft bg-paper py-1 shadow-ds-card">
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-ds-caption hover:bg-surface-warm-soft"
                            onClick={() => {
                              setRenameFrom(group)
                              setRenameValue(group)
                              setRenameOpen(true)
                              setOpenMenuFor(null)
                            }}
                          >
                            重命名…
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-ds-caption text-[#b42318] hover:bg-[#fef2f2]"
                            onClick={() => {
                              setOpenMenuFor(null)
                              requestDeleteConfirm(() => {
                                onDeleteGroup(group)
                              })
                            }}
                          >
                            删除分组
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
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
            <div className="rounded-ds border border-dashed border-warm-soft bg-surface-warm-soft p-ds-md">
              {contacts.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-ds-body font-medium text-ink">还没有联系人，从这里开始更清晰：</p>
                  <p className="text-ds-caption text-soft">建议顺序：先新建联系人 → 再建分组 → 然后记录一次互动。</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" onClick={openCreateContact}>
                      + 新建第一位联系人
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowNewGroupDialog(true)}>
                      + 新建分组
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-ds-body text-soft">当前筛选条件下暂无联系人，请切换筛选或搜索关键词。</p>
              )}
            </div>
          ) : (
            <div className="grid gap-ds-xs md:grid-cols-2">
              {relationVisibleContacts.map((c) => (
                <div
                  key={c.id}
                  className="group relative w-full rounded-xl bg-surface-warm-soft p-3 text-left shadow-ds-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ds-card-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-2 rounded-btn-ds p-1 transition-colors hover:bg-[#f5e9d9]"
                      onClick={() => openPage4WithContact(c.id)}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-btn-ds bg-[#efe4d3] text-ds-caption text-soft">
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
                          <p className="mt-0.5 text-ds-caption text-muted">真朋友 {c.trueFriendScore.toFixed(1)}/10</p>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="rounded-btn-ds bg-surface-warm-soft px-2 py-0.5 text-ds-caption text-muted">{c.group}</span>
                      {bulkMode ? (
                        <button
                          className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${
                            selectedRelationIds.includes(c.id)
                              ? "border-[#8B5A42] bg-[#8B5A42] text-[#fffdf9]"
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
                      ) : (
                        <div className="relative" data-contact-menu={c.id}>
                          <button
                            type="button"
                            className="flex h-7 w-7 items-center justify-center rounded-btn-ds text-soft transition-colors hover:bg-[#f5e9d9]"
                            onClick={() => setOpenContactMenuFor((prev) => (prev === c.id ? null : c.id))}
                            aria-label={`${c.name} 操作菜单`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openContactMenuFor === c.id ? (
                            <div className="absolute right-0 top-full z-30 mt-1 min-w-[8.5rem] rounded-ds border border-warm-soft bg-paper py-1 shadow-ds-card">
                              <button
                                type="button"
                                className="block w-full px-3 py-2 text-left text-ds-caption hover:bg-surface-warm-soft"
                                onClick={() => {
                                  setOpenContactMenuFor(null)
                                  onEditContact(c.id)
                                }}
                              >
                                编辑档案
                              </button>
                              <button
                                type="button"
                                className="block w-full px-3 py-2 text-left text-ds-caption text-[#b42318] hover:bg-[#fef2f2]"
                                onClick={() => {
                                  setOpenContactMenuFor(null)
                                  onDeleteContact(c.id)
                                }}
                              >
                                删除联系人
                              </button>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-ds-xs line-clamp-2 text-ds-caption text-soft">💬 {c.note}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-ds-caption text-muted">
                      最近联系：{c.lastContact?.trim() ? c.lastContact : "暂未联系"}
                    </p>
                    {!bulkMode ? (
                      <button
                        type="button"
                        className="rounded-btn-ds border border-warm-soft px-2 py-1 text-ds-caption text-soft transition-colors hover:bg-[#f5e9d9]"
                        onClick={() => openInteractionForContact(c.id)}
                      >
                        记录互动
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
