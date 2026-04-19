# PrivateSocialSphere

Next.js 应用（App Router），主界面在 `src/App.tsx`，由 `app/page.tsx` 挂载。

## 本地运行

```bash
npm install
npm run dev
```

浏览器：<http://localhost:5173>

## 环境变量

复制 `.env.local.example` 为 `.env.local` 并填写 Supabase / AI 等配置。若单独配置服务端密钥，可使用 `.env.server.local`（见 `.env.server.example`）。勿将含真实密钥的文件提交到 Git。

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务（端口 5173） |
| `npm run lint` | ESLint（含 `app/`、`src/`、`lib/`、`components/` 等） |
