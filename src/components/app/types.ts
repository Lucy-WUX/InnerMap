export type TabKey = "home" | "relations" | "mine"
export type OverlayPage = "none" | "ai-analysis" | "person-detail"
export type GroupKey = string

export type RelationContact = {
  id: string
  name: string
  group: GroupKey
  stars: number
  /** 0–10，与人物详情页「真朋友指数」一致 */
  trueFriendScore: number
  /** 0–10，与人物详情页「表面关系指数」一致 */
  surfaceRelationScore: number
  lastContact: string
  note: string
  tags?: string[]
  traits?: string
  background?: string
  privateNote?: string
}

/** 唯一内置分组名：新用户无预设「家人/朋友…」列表，需自行新建分组；联系人默认归入此类直至用户调整 */
export const DEFAULT_CONTACT_GROUP = "未分组" as const

export function sortContactGroupsForUi(groups: Iterable<GroupKey>): GroupKey[] {
  const arr = Array.from(new Set(groups))
  const rest = arr.filter((g) => g !== DEFAULT_CONTACT_GROUP).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))
  return arr.includes(DEFAULT_CONTACT_GROUP) ? [DEFAULT_CONTACT_GROUP, ...rest] : rest
}
