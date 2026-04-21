/** 免费版联系人上限（与付费页文案一致） */
export const FREE_CONTACT_LIMIT = 20

const PRO_KEY = "pss-subscription"
const LOCAL_LICENSE_STORAGE_KEY = "innermap-local-pro-license-v1"

function localLicenseActive() {
  if (typeof localStorage === "undefined") return false
  try {
    const raw = localStorage.getItem(LOCAL_LICENSE_STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as { payload?: { expiresAt?: number | null } }
    const exp = parsed?.payload?.expiresAt
    if (typeof exp === "number" && exp <= Date.now()) return false
    return Boolean(parsed?.payload)
  } catch {
    return false
  }
}

/** 演示：localStorage 写入 pro 可解除限制；接入支付后由服务端/收据校验替换 */
export function isProSubscriber(): boolean {
  if (typeof localStorage === "undefined") return false
  return localStorage.getItem(PRO_KEY) === "pro" || localLicenseActive()
}

export function setProSubscriberDemo(value: boolean) {
  if (typeof localStorage === "undefined") return
  if (value) localStorage.setItem(PRO_KEY, "pro")
  else localStorage.removeItem(PRO_KEY)
}
