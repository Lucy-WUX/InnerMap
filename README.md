# InnerMap

个人项目仓库。主应用见子目录 **`PrivateSocialSphere`**（Next.js）。

## 本地运行

```bash
cd PrivateSocialSphere
npm install
npm run dev
```

浏览器打开：<http://localhost:5173>

## 环境变量

在 `PrivateSocialSphere` 下复制 `.env.local.example` 为 `.env.local` 并填入 Supabase / AI 等配置（勿将 `.env.local` 提交到 Git）。

## 部署到 Vercel（避免全站 404）

本仓库的 Next 应用在子目录 **`PrivateSocialSphere`**，根目录没有 `package.json`。若 Vercel 仍使用仓库根目录作为项目根，构建会异常短（例如几秒），线上会出现 **404: NOT_FOUND**。

请任选其一（推荐 A）：

**A. 在 Vercel 项目里设置子目录（推荐）**

1. Vercel → 项目 → **Settings** → **General** → **Root Directory** → **Edit**  
2. 填 **`PrivateSocialSphere`** 并保存。  
3. **Deployments** → 最新部署 **⋯** → **Redeploy**（建议先不勾选 “Use existing Build Cache”）。

设置后，构建时间通常会有 **数十秒**，且日志里能看到 `next build`。

**B. 使用仓库根目录的 `vercel.json`**

已提供根目录 `vercel.json`，在子目录执行 `npm install` 与 `npm run build`。推送到 Git 后重新部署；若仍 404，请再按 **A** 设置 Root Directory。

**环境变量：** 在 Vercel → **Settings** → **Environment Variables** 中配置与 `.env.local.example` 对应的变量（含 `NEXT_PUBLIC_*`），并对 **Production** 勾选保存后再 **Redeploy**。
