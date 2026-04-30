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
| `npm run ai:eval` | 运行“晓观”咨询师风格评测 |

## 环境变量

复制 `.env.local.example` 为 `.env.local` 并填写 Supabase / AI 等配置。若单独配置服务端密钥，可使用 `.env.server.local`（见 `.env.server.example`）。勿将含真实密钥的文件提交到 Git。

## 晓观模型训练闭环（提示词迭代）

项目内置了一个轻量评测闭环，帮助持续把“晓观”优化为更专业的人际/亲密关系咨询风格。

### 1) 准备样本

- 评测样本文件：`data/ai-coach/eval-set.json`
- 每条样本包含：
  - `userMessage`：用户问题
  - `context`：关系上下文
  - `keywordsAny`：理想回答关键词组（命中越多分越高）
  - `forbidden`：禁用表达（命中会扣分）

### 2) 配置 AI（DeepSeek 示例）

在 `.env.local` 配置：

```env
AI_API_KEY=sk-xxxx
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-chat
```

### 3) 运行自动评测

```bash
npm run ai:eval
```

输出：

- 控制台打印平均分
- 报告文件写入：`data/ai-coach/reports/eval-*.json`

### 4) 迭代方法（推荐）

1. 调整 `lib/ai.ts` 中 `coachCorePrompt`
2. 重新执行 `npm run ai:eval`
3. 对比 `reports` 的平均分与低分样本
4. 针对低分场景补样本、改提示词，再次评测

## 部署到 Vercel

1. **Root Directory**：留空或 **`.`**。  
2. **Framework**：**Next.js**。  
3. **Build / Install**：使用默认，不要写 `cd …` 自定义命令。  
4. 在仓库根目录：`npx vercel` / `npx vercel --prod`。

若仍沿用旧的子目录配置，请在 Vercel 中**清空 Root Directory**并去掉错误的 `cd PrivateSocialSphere`，或删除项目后重新 Import。
