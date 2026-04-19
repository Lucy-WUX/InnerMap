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

export const INITIAL_RELATION_CONTACTS: RelationContact[] = [
  { id: "1", name: "李晓", group: "家人", stars: 5, trueFriendScore: 8.4, surfaceRelationScore: 2.6, lastContact: "今天", note: "最近主动关心频率上升。" },
  { id: "2", name: "张晨", group: "朋友", stars: 4, trueFriendScore: 7.5, surfaceRelationScore: 3.8, lastContact: "2天前", note: "聊天质量高，但线下互动减少。" },
  { id: "3", name: "陈雨", group: "同学", stars: 3, trueFriendScore: 6.2, surfaceRelationScore: 4.5, lastContact: "3天前", note: "互动集中在学习协作。" },
  { id: "4", name: "赵航", group: "职业关系", stars: 2, trueFriendScore: 4.1, surfaceRelationScore: 6.8, lastContact: "4天前", note: "近期多为事务性沟通。" },
  { id: "5", name: "王宁", group: "同事", stars: 3, trueFriendScore: 5.3, surfaceRelationScore: 5.6, lastContact: "1周前", note: "压力场景下沟通摩擦增加。" },
  { id: "6", name: "孙可", group: "其他", stars: 2, trueFriendScore: 3.8, surfaceRelationScore: 7.2, lastContact: "2周前", note: "联系频率较低，保持观察。" },
  { id: "7", name: "刘敏", group: "朋友", stars: 5, trueFriendScore: 8.9, surfaceRelationScore: 2.1, lastContact: "昨天", note: "情绪支持稳定。" },
]

export const BASE_GROUPS: GroupKey[] = ["家人", "朋友", "同学", "职业关系", "同事", "其他"]

export const RELATION_HEALTH_DATA = [
  { label: "真朋友", count: 4, color: "#66BB6A", ratio: 27 },
  { label: "需观察", count: 6, color: "#FFA726", ratio: 40 },
  { label: "表面关系", count: 5, color: "#BDBDBD", ratio: 33 },
]
