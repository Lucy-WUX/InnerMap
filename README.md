# InnerMap

Next.js 应用（App Router）在**仓库根目录**（与 `package.json`、`app/` 同级），不再使用子文件夹部署。

## 本地运行

```bash
npm install
npm run dev
```

浏览器：<http://localhost:5173>

## 环境变量

复制 `.env.local.example` 为 `.env.local` 并填写配置（勿提交 `.env.local`）。

## 部署到 Vercel

1. **Root Directory**：留空，或填 **`.`**（表示仓库根目录）。**不要**再填 `PrivateSocialSphere`。  
2. **Framework**：**Next.js**。  
3. **Build / Install**：使用默认，或 `npm run build` / `npm install`，**不要**写 `cd PrivateSocialSphere`。  
4. 在仓库根目录执行：`npx vercel` / `npx vercel --prod`。

若 Vercel 项目里仍保存了旧的 Root Directory 或错误的 `cd` 命令，请 **清空 Root Directory** 并 **删除自定义 Install/Build**，或 **删除项目后重新 Import**。

## 说明

若本地仍存在空的 **`PrivateSocialSphere`** 文件夹（旧构建缓存锁占），可关闭编辑器/终端后手动删除；已加入 `.gitignore` 忽略。

更多应用说明见 **`APP-README.md`**。
