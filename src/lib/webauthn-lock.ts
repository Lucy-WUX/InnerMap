export const WEBAUTHN_BROWSER_USER_KEY = "pss-webauthn-user-id"

function bufferToBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  const b64 = btoa(binary)
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64urlToBuffer(b64url: string): ArrayBuffer {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/")
  while (b64.length % 4) b64 += "="
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function getOrCreateWebAuthnUserId(): ArrayBuffer {
  if (typeof localStorage === "undefined") {
    const b = new Uint8Array(16)
    crypto.getRandomValues(b)
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
  }
  let s = localStorage.getItem(WEBAUTHN_BROWSER_USER_KEY)
  if (!s) {
    const b = new Uint8Array(16)
    crypto.getRandomValues(b)
    s = bufferToBase64url(b.buffer)
    localStorage.setItem(WEBAUTHN_BROWSER_USER_KEY, s)
  }
  return base64urlToBuffer(s)
}

export function isWebAuthnAvailable(): boolean {
  return typeof window !== "undefined" && Boolean(window.PublicKeyCredential)
}

/** 注册平台密钥（指纹/面容/系统 PIN），返回 rawId 的 base64url，失败返回 null */
export async function registerWebAuthnCredential(): Promise<string | null> {
  if (!isWebAuthnAvailable()) return null
  try {
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)
    const userId = getOrCreateWebAuthnUserId()
    const hostname = window.location.hostname
    const rpId = hostname || "localhost"

    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "观系", id: rpId },
        user: {
          id: userId,
          name: "pss-local-user",
          displayName: "观系本地",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
        },
        timeout: 120000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null

    if (!cred?.rawId) return null
    return bufferToBase64url(cred.rawId)
  } catch {
    return null
  }
}

/** 使用已注册的凭证解锁 */
export async function authenticateWebAuthn(credentialIdB64url: string): Promise<boolean> {
  if (!isWebAuthnAvailable()) return false
  try {
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)
    const idBuf = base64urlToBuffer(credentialIdB64url)
    const hostname = window.location.hostname
    const rpId = hostname || "localhost"

    const cred = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId,
        allowCredentials: [
          {
            type: "public-key",
            id: new Uint8Array(idBuf.slice(0)),
            transports: ["internal", "hybrid", "usb"],
          },
        ],
        userVerification: "preferred",
        timeout: 120000,
      },
    })
    return Boolean(cred)
  } catch {
    return false
  }
}
