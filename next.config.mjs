import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /** 避免 Next 16 + Turbopack 将 `app/` 误判为项目根导致 build 失败（见 nextjs.org/docs turbopack root） */
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
