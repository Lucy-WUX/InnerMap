import fs from "node:fs/promises"
import path from "node:path"
import OpenAI from "openai"

const projectRoot = process.cwd()
const aiTsPath = path.join(projectRoot, "lib", "ai.ts")
const evalSetPath = path.join(projectRoot, "data", "ai-coach", "eval-set.json")

function getEnv(name, fallback = "") {
  return process.env[name] || fallback
}

async function loadDotEnv(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8")
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith("#")) continue
      const idx = line.indexOf("=")
      if (idx <= 0) continue
      const key = line.slice(0, idx).trim()
      let value = line.slice(idx + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // ignore missing env files
  }
}

function pickModel(baseUrl) {
  if (process.env.AI_MODEL?.trim()) return process.env.AI_MODEL.trim()
  if (baseUrl.toLowerCase().includes("deepseek")) return "deepseek-chat"
  return "gpt-4o-mini"
}

function extractCoachPrompt(source) {
  const match = source.match(/export const coachCorePrompt = `([\s\S]*?)`/)
  if (!match?.[1]) {
    throw new Error("无法从 lib/ai.ts 提取 coachCorePrompt，请检查文件格式。")
  }
  return match[1]
}

function hitAnyKeywordGroups(reply, groups) {
  return groups.map((group) => group.some((kw) => reply.includes(kw)))
}

function hasForbidden(reply, forbidden) {
  return forbidden.filter((item) => reply.includes(item))
}

function scoreCase(reply, testCase) {
  const keywordHits = hitAnyKeywordGroups(reply, testCase.keywordsAny || [])
  const forbiddenHits = hasForbidden(reply, testCase.forbidden || [])
  const hitCount = keywordHits.filter(Boolean).length
  const baseScore = testCase.keywordsAny?.length ? Math.round((hitCount / testCase.keywordsAny.length) * 100) : 100
  const penalty = forbiddenHits.length * 20
  return {
    score: Math.max(0, baseScore - penalty),
    keywordHits,
    forbiddenHits,
  }
}

async function main() {
  await loadDotEnv(path.join(projectRoot, ".env.local"))
  await loadDotEnv(path.join(projectRoot, ".env.server.local"))

  const aiKey = getEnv("AI_API_KEY", getEnv("OPENAI_API_KEY"))
  const baseURL = getEnv("AI_BASE_URL", getEnv("OPENAI_BASE_URL"))
  if (!aiKey) {
    throw new Error("缺少 AI_API_KEY（或 OPENAI_API_KEY）。")
  }

  const model = pickModel(baseURL)
  const aiSource = await fs.readFile(aiTsPath, "utf8")
  const coachPrompt = extractCoachPrompt(aiSource)
  const evalSet = JSON.parse(await fs.readFile(evalSetPath, "utf8"))

  const client = new OpenAI({
    apiKey: aiKey,
    ...(baseURL ? { baseURL } : {}),
  })

  const report = []
  for (const item of evalSet) {
    const userPayload = JSON.stringify(
      {
        user_message: item.userMessage,
        relation_context: item.context || null,
      },
      null,
      2
    )
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.3,
      messages: [
        { role: "system", content: coachPrompt },
        { role: "user", content: `${userPayload}\n请给出咨询师式关系分析，120字以内。` },
      ],
    })
    const reply = completion.choices[0]?.message?.content?.trim() ?? ""
    const scored = scoreCase(reply, item)
    report.push({
      id: item.id,
      category: item.category,
      score: scored.score,
      reply,
      keywordHits: scored.keywordHits,
      forbiddenHits: scored.forbiddenHits,
      mustInclude: item.mustInclude || [],
    })
  }

  const avg = report.length
    ? Math.round(report.reduce((sum, item) => sum + item.score, 0) / report.length)
    : 0
  const now = new Date().toISOString()
  const summary = {
    generatedAt: now,
    provider: baseURL || "default-openai",
    model,
    averageScore: avg,
    count: report.length,
    report,
  }

  const outDir = path.join(projectRoot, "data", "ai-coach", "reports")
  await fs.mkdir(outDir, { recursive: true })
  const outPath = path.join(outDir, `eval-${now.replace(/[:.]/g, "-")}.json`)
  await fs.writeFile(outPath, JSON.stringify(summary, null, 2), "utf8")

  console.log(`AI Coach Eval 完成: 平均分 ${avg}, 样本 ${report.length}`)
  console.log(`模型: ${model}`)
  console.log(`报告: ${outPath}`)
}

main().catch((error) => {
  console.error("AI Coach Eval 失败:", error instanceof Error ? error.message : String(error))
  process.exit(1)
})
