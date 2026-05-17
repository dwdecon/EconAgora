#!/usr/bin/env tsx
/**
 * AI Content Generation Pipeline
 * 
 * Usage:
 *   tsx scripts/content-pipeline/generate-content.ts <topic> <source-url>
 * 
 * Generates:
 *   1. Outline
 *   2. Chinese draft
 *   3. English translation
 *   4. Final polished version
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const API_URL = "https://coding.rexai.top/openai/v1/chat/completions";

interface ContentPipeline {
  topic: string;
  sourceUrl: string;
  outline: string;
  chineseDraft: string;
  englishDraft: string;
  finalVersion: string;
}

function getApiKey(): string {
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    const match = content.match(/OPENAI_API_KEY=([^\n]+)/);
    if (match) return match[1].trim();
  }

  throw new Error("OPENAI_API_KEY not found");
}

async function callClaude(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = getApiKey();
  
  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateOutline(topic: string, sourceUrl: string): Promise<string> {
  const systemPrompt = `你是一位经济学研究方法专家，专注于 AI 工具在经济学研究中的应用。
你的任务是为一篇工具型博客文章生成详细大纲。
文章面向经济学研究者和研究生，风格实用、可操作。`;

  const prompt = `请为以下主题生成一篇工具型博客文章的详细大纲：

主题：${topic}
灵感来源：${sourceUrl}

要求：
1. 文章结构清晰，包含引言、方法、案例、总结
2. 每个部分有具体的要点说明
3. 强调可操作性和复现性
4. 适合经济学研究者阅读

请输出 Markdown 格式的大纲。`;

  return callClaude(prompt, systemPrompt);
}

async function generateChineseDraft(outline: string, topic: string): Promise<string> {
  const systemPrompt = `你是一位经济学技术写作专家，擅长将复杂的 AI 工具应用转化为清晰的中文教程。
你的文章风格：
- 实用导向，步骤清晰
- 包含代码示例和配置说明
- 解释"为什么"而不仅是"怎么做"
- 适合有经济学背景但技术能力中等的读者`;

  const prompt = `基于以下大纲，生成一篇完整的中文博客文章初稿。

主题：${topic}

大纲：
${outline}

要求：
1. 文章长度约 2000-3000 字
2. 包含具体的工具名称和使用场景
3. 提供代码片段或命令示例
4. 解释该方法在经济学研究中的价值
5. 使用 Markdown 格式

请直接输出文章内容（不需要包含标题，标题会在 frontmatter 中）。`;

  return callClaude(prompt, systemPrompt);
}

async function generateEnglishDraft(chineseDraft: string, topic: string): Promise<string> {
  const systemPrompt = `You are an expert in economics research methods and AI tools.
Translate and adapt Chinese technical content into natural, professional English.
Your style:
- Clear and actionable
- Accessible to economics researchers with moderate technical skills
- Include code examples where relevant
- Explain "why" not just "how"`;

  const prompt = `Translate the following Chinese blog post into English.
Adapt the content for an international audience while maintaining technical accuracy.

Original topic: ${topic}

Chinese draft:
${chineseDraft}

Requirements:
1. Natural, professional English
2. Maintain all technical details and code examples
3. Adapt cultural references for international readers
4. Output in Markdown format
5. Do not include the title (it will be in frontmatter)`;

  return callClaude(prompt, systemPrompt);
}

async function polishContent(
  chineseDraft: string,
  englishDraft: string,
  topic: string
): Promise<{ zh: string; en: string }> {
  const systemPrompt = `你是一位资深编辑，负责最终润色经济学技术博客文章。
你的任务是确保文章质量，检查：
1. 技术准确性
2. 逻辑连贯性
3. 语言流畅度
4. 格式规范性`;

  const prompt = `请对以下中英双语文章进行最终润色。

主题：${topic}

中文版本：
${chineseDraft}

英文版本：
${englishDraft}

要求：
1. 检查并修正技术错误
2. 优化表达，使其更流畅
3. 确保中英内容对应一致
4. 返回润色后的两个版本

请按以下格式输出：

=== CHINESE ===
[润色后的中文内容]

=== ENGLISH ===
[润色后的英文内容]`;

  const result = await callClaude(prompt, systemPrompt);
  
  // Parse the result
  const chineseMatch = result.match(/=== CHINESE ===\n([\s\S]*?)(?=\n=== ENGLISH ===|$)/);
  const englishMatch = result.match(/=== ENGLISH ===\n([\s\S]*$)/);
  
  return {
    zh: chineseMatch ? chineseMatch[1].trim() : chineseDraft,
    en: englishMatch ? englishMatch[1].trim() : englishDraft,
  };
}

async function runPipeline(topic: string, sourceUrl: string): Promise<ContentPipeline> {
  console.log("🚀 Starting content generation pipeline...");
  console.log(`Topic: ${topic}`);
  console.log(`Source: ${sourceUrl}\n`);

  // Step 1: Generate outline
  console.log("📝 Step 1/4: Generating outline...");
  const outline = await generateOutline(topic, sourceUrl);
  console.log("✅ Outline generated\n");

  // Step 2: Generate Chinese draft
  console.log("🇨🇳 Step 2/4: Generating Chinese draft...");
  const chineseDraft = await generateChineseDraft(outline, topic);
  console.log("✅ Chinese draft generated\n");

  // Step 3: Generate English draft
  console.log("🇺🇸 Step 3/4: Generating English draft...");
  const englishDraft = await generateEnglishDraft(chineseDraft, topic);
  console.log("✅ English draft generated\n");

  // Step 4: Polish
  console.log("✨ Step 4/4: Polishing content...");
  const polished = await polishContent(chineseDraft, englishDraft, topic);
  console.log("✅ Content polished\n");

  return {
    topic,
    sourceUrl,
    outline,
    chineseDraft: polished.zh,
    englishDraft: polished.en,
    finalVersion: polished.zh,
  };
}

// CLI entry
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: tsx generate-content.ts <topic> <source-url>");
    console.error("Example: tsx generate-content.ts 'Using LLM for Causal Inference' 'https://arxiv.org/abs/2405.xxxxx'");
    process.exit(1);
  }

  const [topic, sourceUrl] = args;

  runPipeline(topic, sourceUrl)
    .then((result) => {
      console.log("🎉 Pipeline complete!");
      console.log("\n=== OUTLINE ===");
      console.log(result.outline);
      console.log("\n=== CHINESE DRAFT (first 500 chars) ===");
      console.log(result.chineseDraft.slice(0, 500) + "...");
      console.log("\n=== ENGLISH DRAFT (first 500 chars) ===");
      console.log(result.englishDraft.slice(0, 500) + "...");
    })
    .catch((error) => {
      console.error("❌ Pipeline failed:", error);
      process.exit(1);
    });
}

export { runPipeline, generateOutline, generateChineseDraft, generateEnglishDraft, polishContent };
