#!/usr/bin/env tsx
/**
 * Topic Research Script - Web Content Fetcher Integration
 *
 * Researches a topic by fetching content from multiple web sources,
 * then synthesizes the findings into a structured research report.
 *
 * Usage:
 *   tsx scripts/content-pipeline/research-topic.ts "AI Agent for academic research"
 *
 * Output:
 *   - Prints research report to stdout
 *   - Saves raw fetched content to /tmp/research-{slug}/
 */

import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const API_URL = "https://coding.rexai.top/openai/v1/chat/completions";

interface ResearchResult {
  topic: string;
  sources: { url: string; title: string; content: string }[];
  report: string;
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

async function callAI(prompt: string, systemPrompt?: string): Promise<string> {
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

async function fetchWebContent(url: string): Promise<string> {
  return new Promise((resolve) => {
    // Try jina.ai first, then fallback to markdown.new
    const tryFetch = (method: string) => {
      const serviceUrl = method === "jina"
        ? `https://r.jina.ai/${url}`
        : `https://markdown.new/${url}`;

      const curl = spawn("curl", ["-s", "-L", "--max-time", "30", serviceUrl], {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let output = "";
      let error = "";

      curl.stdout.on("data", (chunk) => {
        output += chunk.toString();
      });

      curl.stderr.on("data", (chunk) => {
        error += chunk.toString();
      });

      curl.on("close", (code) => {
        if (code === 0 && output.length > 500) {
          resolve(output);
        } else if (method === "jina") {
          console.log(`  jina.ai failed, trying markdown.new...`);
          tryFetch("markdown");
        } else {
          resolve(`[Failed to fetch ${url}: ${error || "empty response"}]`);
        }
      });
    };

    tryFetch("jina");
  });
}

async function searchAndFetch(topic: string): Promise<{ url: string; title: string; content: string }[]> {
  console.log(`🔍 Researching topic: "${topic}"`);
  console.log("");

  // Step 1: Use AI to generate search queries and source URLs
  const searchPrompt = `作为经济学研究助手，我需要为以下主题搜集全网资料：

主题：${topic}

请提供：
1. 5-8 个相关的搜索关键词（中英文）
2. 5-8 个可能包含高质量信息的网页 URL（优先选择：arXiv、GitHub、官方文档、知名博客、学术论文）
3. 每个 URL 的简要说明

格式：
关键词: keyword1, keyword2, ...
来源:
- [URL] - 说明
- [URL] - 说明
`;

  const searchResult = await callAI(searchPrompt, `你是一位经济学研究方法专家，擅长寻找高质量的学术和技术资料。`);

  // Parse URLs from AI response
  const urlMatches = searchResult.matchAll(/-\s*(https?:\/\/[^\s\]]+)/g);
  const urls: string[] = [];
  for (const match of urlMatches) {
    urls.push(match[1].trim());
  }

  if (urls.length === 0) {
    console.log("⚠️  No URLs found from AI, using default sources...");
    urls.push(
      "https://en.wikipedia.org/wiki/Artificial_intelligence",
      "https://arxiv.org/list/econ.EM/recent"
    );
  }

  console.log(`📚 Found ${urls.length} sources to fetch:`);
  for (const url of urls) {
    console.log(`   ${url}`);
  }
  console.log("");

  // Step 2: Fetch content from each URL
  const sources: { url: string; title: string; content: string }[] = [];
  const researchDir = `/tmp/research-${slugify(topic)}`;
  fs.mkdirSync(researchDir, { recursive: true });

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] Fetching: ${url}`);

    const content = await fetchWebContent(url);

    // Extract title from content or URL
    const titleMatch = content.match(/^#?\s*(.+)/);
    const title = titleMatch ? titleMatch[1].slice(0, 80) : url;

    sources.push({ url, title, content });

    // Save raw content
    const filename = `source-${String(i + 1).padStart(2, "0")}.md`;
    fs.writeFileSync(
      path.join(researchDir, filename),
      `# ${title}\n\nSource: ${url}\n\n${content}\n`,
      "utf-8"
    );

    console.log(`  ✓ Saved to ${researchDir}/${filename} (${content.length} chars)`);
  }

  console.log("");
  console.log(`💾 All raw content saved to: ${researchDir}/`);
  console.log("");

  return sources;
}

async function synthesizeReport(topic: string, sources: { url: string; title: string; content: string }[]): Promise<string> {
  console.log("🧠 Synthesizing research report...");

  // Truncate sources to fit in context
  const truncatedSources = sources.map((s, i) =>
    `=== Source ${i + 1}: ${s.title} ===\nURL: ${s.url}\n\n${s.content.slice(0, 3000)}\n[...truncated...]\n`
  ).join("\n");

  const synthesisPrompt = `基于以下搜集到的网页资料，为"${topic}"这个主题撰写一份结构化的研究报告。

搜集到的资料：
${truncatedSources}

请输出：
1. **核心概念定义** - 这个主题是什么，关键术语解释
2. **主流方法和工具** - 目前有哪些流行的工具/方法/框架
3. **在经济学研究中的应用** - 具体如何应用于经济学研究
4. **操作步骤/教程要点** - 如果要写一篇教程，应该包含哪些步骤
5. **代码示例需求** - 是否需要代码示例，用什么语言
6. **相关资源推荐** - 值得推荐的工具、文档、论文
7. **写作建议** - 针对这个主题的博客文章应该怎么组织结构

请用中文输出，结构清晰，内容实用。`;

  const report = await callAI(synthesisPrompt, `你是一位经济学研究方法专家和技术写作专家，擅长将复杂的技术概念转化为清晰的中文教程。`);

  return report;
}

async function researchTopic(topic: string): Promise<ResearchResult> {
  const sources = await searchAndFetch(topic);
  const report = await synthesizeReport(topic, sources);

  // Save report
  const researchDir = `/tmp/research-${slugify(topic)}`;
  fs.writeFileSync(path.join(researchDir, "report.md"), `# 研究报告: ${topic}\n\n${report}\n`, "utf-8");

  console.log(`📝 Research report saved to: ${researchDir}/report.md`);
  console.log("");

  return { topic, sources, report };
}

// CLI entry
if (require.main === module) {
  const topic = process.argv.slice(2).join(" ");

  if (!topic) {
    console.error("Usage: tsx research-topic.ts \"<research topic>\"");
    console.error("Example: tsx research-topic.ts \"AI Agent for academic research\"");
    process.exit(1);
  }

  researchTopic(topic)
    .then((result) => {
      console.log("=".repeat(60));
      console.log("RESEARCH REPORT");
      console.log("=".repeat(60));
      console.log("");
      console.log(result.report);
      console.log("");
      console.log("=".repeat(60));
      console.log(`Sources: ${result.sources.length}`);
      console.log(`Raw data: /tmp/research-${slugify(topic)}/`);
    })
    .catch((error) => {
      console.error("\n❌ Research failed:", error.message);
      process.exit(1);
    });
}

export { researchTopic, fetchWebContent, searchAndFetch };
