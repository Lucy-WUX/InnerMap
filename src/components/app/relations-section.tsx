import { MoreVertical } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"

import { useHtmlDarkClass } from "@/lib/use-html-dark-class"

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
  const isHtmlDark = useHtmlDarkClass()

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
      return isHtmlDark ? "conic-gradient(#44403c 0% 100%)" : "conic-gradient(#e8e4de 0% 100%)"
    }
    let acc = 0
    const stops = parts.map(({ color, ratio }) => {
      const start = acc
      acc += ratio
      return `${color} ${start}% ${Math.min(100, acc)}%`
    })
    return `conic-gradient(${stops.join(", ")})`
  }, [relationHealthData, animatedHealthRatios, isHtmlDark])

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
        <Card className="rounded-ds border border-warm-base bg-paper p-ds-lg dark:border-stone-700/80">
          <h3 className="text-ds-title dark:text-stone-100">关系健康度</h3>
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
                <div className="absolute inset-[14px] flex items-center justify-center rounded-full bg-white text-center dark:bg-stone-800">
                  {activeHealth ? (
                    <div className="-translate-y-0.5 leading-tight">
                      <p className="text-ds-caption text-soft dark:text-stone-400">{activeHealth.label}</p>
                      <p className="text-lg font-semibold text-ink dark:text-stone-100">{activeHealth.count}</p>
                    </div>
                  ) : (
                    <div className="-translate-y-0.5 leading-tight">
                      <p className="text-ds-caption text-soft dark:text-stone-400">总联系</p>
                      <p className="text-lg font-semibold text-ink dark:text-stone-100">{contacts.length}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-ds-xs">
                {relationHealthData.map((item, index) => (
                  <div
                    key={item.label}
                    className="rounded-md px-1 py-0.5 transition-colors duration-200 hover:bg-surface-warm-hover dark:hover:bg-stone-800/90"
                    onMouseEnter={() => setHoveredHealthLabel(item.label)}
                    onMouseLeave={() => setHoveredHealthLabel(null)}
                    style={{
                      boxShadow:
                        activeHealthLabel === item.label
                          ? `0 0 0 ${1 + healthPulseStrength * 4}px ${item.color}22`
                          : "none",
                    }}
                  >
                    <div className="flex items-center justify-between text-ds-caption text-soft dark:text-stone-400">
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
            <div className="mt-ds-xs rounded-ds border border-dashed border-warm-soft bg-surface-warm-soft px-3 py-4 text-ds-caption text-soft dark:border-stone-600 dark:bg-stone-800/50 dark:text-stone-400">
              <p>暂无联系人时，健康度保持空白。</p>
              <p className="mt-1">添加第一位联系人后，会显示分布与趋势。</p>
            </div>
          )}
          <div className="mt-ds-xs rounded-ds border border-warm-soft bg-surface-warm-soft px-3 py-2 text-ds-caption text-[#5c4d42] dark:border-stone-600 dark:bg-stone-800/40 dark:text-stone-300">
            {!hasContacts ? (
              <ul className="list-inside list-disc space-y-1">
                <li>添加联系人后，按真心 / 表面关系指数自动归入三类。</li>
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

        <Card className="rounded-ds border border-warm-base bg-paper p-ds-lg dark:border-stone-700/80">
          <h3 className="text-ds-title dark:text-stone-100">⚡ 近期能量消耗</h3>
          <p className="mt-1 text-ds-caption text-soft">结合互动能量与 AI 预警，优先关注标红条目。</p>
          <div className="mt-ds-xs space-y-ds-xs">
            {energySpotlightItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-ds-xs rounded-ds border p-ds-xs ${
                  item.alert
                    ? "border-[#f5c2c7] bg-[#FDECEC] dark:border-red-900/45 dark:bg-red-950/30"
                    : "border-warm-soft dark:border-stone-700 dark:bg-stone-900/35"
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
                  <p className="mt-1 text-ds-caption text-soft dark:text-stone-400">{item.desc}</p>
                </button>
                <button
                  className="rounded-btn-ds border border-warm-soft px-1.5 py-1 text-ds-caption hover:bg-surface-warm-soft dark:border-stone-600 dark:hover:bg-stone-800"
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
        <div className="rounded-ds border border-warm-base bg-paper p-ds-lg dark:border-stone-700/80 dark:bg-stone-900/50">
          <div className="flex items-center justify-between">
            <h3 className="text-ds-title dark:text-stone-100">联系人概览</h3>
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
              className="w-56 rounded-btn-ds border border-warm-soft bg-paper px-2 py-1 text-ds-caption dark:border-stone-600 dark:bg-stone-900/90 dark:text-stone-200 dark:placeholder:text-stone-500"
              placeholder="搜索姓名/分组/标签"
              value={relationsSearchQuery}
              onChange={(e) => setRelationsSearchQuery(e.target.value)}
            />
            <select
              className="rounded-btn-ds border border-warm-soft bg-paper px-2 py-1 text-ds-caption dark:border-stone-600 dark:bg-stone-900/90 dark:text-stone-200"
              value={relationsSortBy}
              onChange={(e) => setRelationsSortBy(e.target.value as "recent" | "intimacy" | "trueFriend")}
            >
              <option value="recent">按最近互动</option>
              <option value="intimacy">按亲密度</option>
              <option value="trueFriend">按真心指数</option>
            </select>
            <button
              className={`rounded-btn-ds border px-2 py-1 text-ds-caption ${
                bulkMode
                  ? "border-[#b6905e] bg-[#fff3dc] text-[#7a5a2e] dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100"
                  : "border-warm-soft bg-paper text-soft dark:border-stone-600 dark:bg-stone-900/80 dark:text-stone-400"
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
                  className="rounded-btn-ds border border-warm-soft px-2 py-1 text-ds-caption dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
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
                  className="rounded-btn-ds border border-warm-soft bg-paper px-2 py-1 text-ds-caption dark:border-stone-600 dark:bg-stone-900/90 dark:text-stone-200"
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
                  className="rounded-btn-ds border border-warm-soft px-2 py-1 text-ds-caption dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
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
                  ? "border-[#b6905e] bg-[#fff3dc] text-[#7a5a2e] dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100"
                  : "border-warm-soft bg-surface-warm-soft text-muted dark:border-stone-600 dark:bg-stone-800/60 dark:text-stone-400"
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
                      ? "border-[#b6905e] bg-[#fff3dc] text-[#7a5a2e] dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100"
                      : "border-warm-soft bg-surface-warm-soft text-muted dark:border-stone-600 dark:bg-stone-800/60 dark:text-stone-400"
                  }`}
                >
                  <button
                    type="button"
                    className="min-h-8 px-3 py-1 text-left hover:brightness-[0.98] dark:hover:brightness-110"
                    onClick={() => setRelationsFocusGroup(group)}
                  >
                    {group} {count}
                  </button>
                  {canManage ? (
                    <div
                      className="relative flex shrink-0 border-l border-[#e7dfd4] dark:border-stone-600"
                      ref={openMenuFor === group ? menuRef : undefined}
                    >
                      <button
                        type="button"
                        className="flex h-full w-8 items-center justify-center text-[#6d5e54] hover:bg-black/[0.04] dark:text-stone-400 dark:hover:bg-white/5"
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
                        <div className="absolute right-0 top-full z-30 mt-1 min-w-[8.5rem] rounded-ds border border-warm-soft bg-paper py-1 shadow-ds-card dark:border-stone-600 dark:bg-stone-900 dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-ds-caption hover:bg-surface-warm-soft dark:hover:bg-stone-800"
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
                            className="block w-full px-3 py-2 text-left text-ds-caption text-[#b42318] hover:bg-[#fef2f2] dark:text-red-300 dark:hover:bg-red-950/40"
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

        <div className="rounded-ds border border-warm-base bg-paper p-ds-lg dark:border-stone-700/80 dark:bg-stone-900/50">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-ds-caption text-soft dark:text-stone-400">已显示 {relationVisibleContacts.length} 位联系人</p>
            <p className="hidden text-ds-caption text-soft dark:text-stone-500 sm:block">点击卡片查看详情与 AI 建议</p>
          </div>
          {relationVisibleContacts.length === 0 ? (
            <div className="rounded-ds border border-dashed border-warm-soft bg-surface-warm-soft p-ds-md dark:border-stone-600 dark:bg-stone-800/40">
              {contacts.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-ds-body font-medium text-ink dark:text-stone-100">还没有联系人，从这里开始更清晰：</p>
                  <p className="text-ds-caption text-soft dark:text-stone-400">建议顺序：先新建联系人 → 再建分组 → 然后记录一次互动。</p>
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
                <p className="text-ds-body text-soft dark:text-stone-400">当前筛选条件下暂无联系人，请切换筛选或搜索关键词。</p>
              )}
            </div>
          ) : (
            <div className="grid gap-ds-xs md:grid-cols-2">
              {relationVisibleContacts.map((c) => (
                <div
                  key={c.id}
                  className="group relative w-full cursor-pointer rounded-xl border border-transparent bg-surface-warm-soft p-3 text-left shadow-ds-card transition-all duration-200 hover:-translate-y-0.5 hover:border-warm-soft/50 hover:bg-[#f2e8db] hover:shadow-ds-card-hover active:translate-y-0 active:border-warm-soft/60 active:bg-[#dfd3c4] active:shadow-[inset_0_2px_8px_rgba(80,60,40,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-stone-700/60 dark:bg-stone-900/55 dark:shadow-none dark:hover:border-stone-600 dark:hover:bg-stone-800/80 dark:active:border-stone-600 dark:active:bg-stone-800/90 dark:active:shadow-[inset_0_2px_8px_rgba(0,0,0,0.35)]"
                  onClick={() => openPage4WithContact(c.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-1 items-center gap-2 rounded-btn-ds p-1">
                      <span className="flex h-8 w-8 items-center justify-center rounded-btn-ds bg-[#efe4d3] text-ds-caption text-soft dark:bg-stone-700 dark:text-stone-200">
                        {c.name.slice(0, 1)}
                      </span>
                      <div>
                        <p className="text-ds-body font-medium dark:text-stone-100">{c.name}</p>
                        <div className="mt-1 w-20">
                          <div className="h-1.5 rounded-full bg-[#eadfce] dark:bg-stone-700">
                            <div
                              className="h-1.5 origin-left rounded-full transition-all duration-200 group-hover:scale-x-[1.03] group-hover:brightness-110"
                              style={getTrueFriendBarStyle(c.trueFriendScore)}
                            />
                          </div>
                          <p className="mt-0.5 text-ds-caption text-muted dark:text-stone-400">真心 {c.trueFriendScore.toFixed(1)}/10</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-btn-ds bg-[#f8f1e8] px-2 py-0.5 text-ds-caption text-muted dark:bg-stone-800 dark:text-stone-300">
                        {c.group}
                      </span>
                      {bulkMode ? (
                        <button
                          className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${
                            selectedRelationIds.includes(c.id)
                              ? "border-[#8B5A42] bg-[#8B5A42] text-[#fffdf9]"
                              : "border-warm-soft bg-paper text-soft dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300"
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
                            className="flex h-7 w-7 items-center justify-center rounded-btn-ds text-soft transition-colors hover:bg-[#f5e9d9] dark:text-stone-400 dark:hover:bg-stone-800"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenContactMenuFor((prev) => (prev === c.id ? null : c.id))
                            }}
                            aria-label={`${c.name} 操作菜单`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openContactMenuFor === c.id ? (
                            <div
                              className="absolute right-0 top-full z-30 mt-1 min-w-[8.5rem] rounded-ds border border-warm-soft bg-paper py-1 shadow-ds-card dark:border-stone-600 dark:bg-stone-900 dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="block w-full px-3 py-2 text-left text-ds-caption hover:bg-surface-warm-soft dark:hover:bg-stone-800"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenContactMenuFor(null)
                                  onEditContact(c.id)
                                }}
                              >
                                编辑档案
                              </button>
                              <button
                                type="button"
                                className="block w-full px-3 py-2 text-left text-ds-caption text-[#b42318] hover:bg-[#fef2f2] dark:text-red-300 dark:hover:bg-red-950/40"
                                onClick={(e) => {
                                  e.stopPropagation()
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
                  <p className="mt-ds-xs line-clamp-2 text-ds-caption text-soft dark:text-stone-400">💬 {c.note}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-ds-caption text-muted dark:text-stone-500">
                      最近联系：{c.lastContact?.trim() ? c.lastContact : "暂未联系"}
                    </p>
                    {!bulkMode ? (
                      <button
                        type="button"
                        className="rounded-btn-ds border border-warm-soft bg-paper/80 px-2 py-1 text-ds-caption text-soft transition-colors hover:bg-[#f5e9d9] dark:border-stone-600 dark:bg-stone-800/90 dark:text-stone-300 dark:hover:bg-stone-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          openInteractionForContact(c.id)
                        }}
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
