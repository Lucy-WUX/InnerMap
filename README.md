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

**在 Vercel 项目里设置子目录（必须）**

1. Vercel → 项目 → **Settings** → **General** → **Root Directory** → **Edit**  
2. 填 **`PrivateSocialSphere`** 并保存。  
3. **Framework Preset** 选 **Next.js**。  
4. **Build / Install Command**：保持默认，**不要**填写 `cd PrivateSocialSphere && ...`（工作目录已在 `PrivateSocialSphere` 内，再加 `cd` 会报错 `No such file or directory`）。  
5. **Deployments** → **Redeploy**（可先不勾选 “Use existing Build Cache”）。

设置后，构建日志里应出现 **`next build`**，耗时通常 **数十秒**。

**若网页上无法改掉带 `cd PrivateSocialSphere` 的命令：** 仓库里已在 **`PrivateSocialSphere/vercel.json`** 写明 `npm install` / `npm run build`（无 `cd`）。推送后重新部署；若仪表板仍强制旧命令，请 **删除该 Vercel 项目** 并 **重新 Import 同一 GitHub 仓库**，导入时只设 **Root Directory = `PrivateSocialSphere`**、**Next.js**，**不要**展开修改 Build/Install。

**环境变量：** 在 Vercel → **Settings** → **Environment Variables** 中配置与 `.env.local.example` 对应的变量（含 `NEXT_PUBLIC_*`），并对 **Production** 勾选保存后再 **Redeploy**。
