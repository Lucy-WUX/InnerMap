# InnerMap

Next.js 应用（App Router），主界面在 `src/App.tsx`，由 `app/page.tsx` 挂载。项目代码在**仓库根目录**（与 `package.json`、`app/` 同级）。

## 本地运行

```bash
npm install
npm run dev
```

浏览器：<http://localhost:5173>

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发（端口 5173） |
| `npm run build` | 生产构建 |
| `npm run start` | 生产启动（端口 5173） |
| `npm run lint` | ESLint |

## 环境变量

复制 `.env.local.example` 为 `.env.local` 并填写 Supabase / AI 等配置。若单独配置服务端密钥，可使用 `.env.server.local`（见 `.env.server.example`）。勿将含真实密钥的文件提交到 Git。

## 部署到 Vercel

1. **Root Directory**：留空或 **`.`**。  
2. **Framework**：**Next.js**。  
3. **Build / Install**：使用默认，不要写 `cd …` 自定义命令。  
4. 在仓库根目录：`npx vercel` / `npx vercel --prod`。

若仍沿用旧的子目录配置，请在 Vercel 中**清空 Root Directory**并去掉错误的 `cd PrivateSocialSphere`，或删除项目后重新 Import。
