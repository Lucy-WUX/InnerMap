/** 免费版联系人上限（与付费页文案一致） */
export const FREE_CONTACT_LIMIT = 20

const PRO_KEY = "pss-subscription"

/** 演示：localStorage 写入 pro 可解除限制；接入支付后由服务端/收据校验替换 */
export function isProSubscriber(): boolean {
  if (typeof localStorage === "undefined") return false
  return localStorage.getItem(PRO_KEY) === "pro"
}

export function setProSubscriberDemo(value: boolean) {
  if (typeof localStorage === "undefined") return
  if (value) localStorage.setItem(PRO_KEY, "pro")
  else localStorage.removeItem(PRO_KEY)
}
