#!/usr/bin/env tsx
/**
 * Unified Blog Post Creation Script with Web Research
 *
 * Complete workflow:
 *   1. Research topic via web content fetching
 *   2. Generate structured content based on research
 *   3. Generate cover image
 *   4. Publish with proper frontmatter
 *
 * Usage:
 *   # Full workflow: research + generate + cover + publish
 *   tsx scripts/content-pipeline/create-blog-post.ts \
 *     --title "AI Agent 连接 Zotero 文献管理" \
 *     --slug "agent-zotero-integration" \
 *     --category "AI 工具" \
 *     --tags "AI Agent,Zotero,文献管理" \
 *     --topic "如何使用 AI Agent 连接 Zotero 进行经济学文献管理" \
 *     --research
 *
 *   # Skip research, use AI generation only
 *   tsx scripts/content-pipeline/create-blog-post.ts ... --topic "..."
 *
 *   # Use pre-written content files
 *   tsx scripts/content-pipeline/create-blog-post.ts ... \
 *     --zh-content ./draft.zh.md \
 *     --en-content ./draft.en.md
 *
 *   # Dry run (preview without writing files)
 *   tsx scripts/content-pipeline/create-blog-post.ts ... --dry-run
 */

import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const API_URL = "https://coding.rexai.top/openai/v1/chat/completions";
const CONTENT_DIR = path.join(process.cwd(), "content/blog");
const COVER_DIR = path.join(process.cwd(), "public/blog-covers");

interface CreateOptions {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  topic?: string;
  source?: string;
  zhContent?: string;
  enContent?: string;
  noCover?: boolean;
  dryRun?: boolean;
  author?: string;
  research?: boolean;
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
  throw new Error("OPENAI_API_KEY not found in environment or .env.local");
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

async function fetchWebContent(url: string): Promise<string> {
  return new Promise((resolve) => {
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
          tryFetch("markdown");
        } else {
          resolve(`[Failed to fetch ${url}]`);
        }
      });
    };

    tryFetch("jina");
  });
}

async function researchTopic(topic: string): Promise<string> {
  console.log("🔍 Step 1/4: Researching topic via web content fetching...");
  console.log(`   Topic: ${topic}`);
  console.log("");

  // Generate search queries and URLs via AI
  const searchPrompt = `作为经济学研究助手，我需要为以下主题搜集全网资料：

主题：${topic}

请提供 5-8 个可能包含高质量信息的网页 URL（优先：arXiv、GitHub、官方文档、知名博客、学术论文）。
只输出 URL 列表，每行一个。`;

  const searchResult = await callAI(searchPrompt, `你是一位经济学研究方法专家。`);
  const urls = searchResult
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("http"));

  if (urls.length === 0) {
    console.log("⚠️  No URLs found, proceeding without web research...");
    return "";
  }

  console.log(`📚 Fetching ${urls.length} sources:`);
  const sources: { url: string; content: string }[] = [];

  for (let i = 0; i < Math.min(urls.length, 5); i++) {
    const url = urls[i];
    console.log(`   [${i + 1}/5] ${url}`);
    const content = await fetchWebContent(url);
    if (!content.startsWith("[Failed")) {
      sources.push({ url, content: content.slice(0, 4000) });
      console.log(`      ✓ Fetched (${content.length} chars)`);
    } else {
      console.log(`      ✗ Failed`);
    }
  }

  if (sources.length === 0) {
    return "";
  }

  // Synthesize research findings
  console.log("\n🧠 Synthesizing research findings...");
  const synthesisPrompt = `基于以下搜集到的网页资料，为"${topic}"撰写一份简要的研究摘要：

${sources.map((s, i) => `=== Source ${i + 1}: ${s.url} ===\n${s.content.slice(0, 2000)}\n`).join("\n")}

请输出：
1. 核心概念和关键术语
2. 主流工具和方法
3. 在经济学研究中的具体应用场景
4. 操作步骤概述
5. 推荐的代码/工具

用中文输出，简洁实用。`;

  const researchSummary = await callAI(synthesisPrompt, `你是一位经济学技术写作专家。`);
  console.log("  ✓ Research complete\n");

  return researchSummary;
}

async function generateContent(topic: string, researchSummary: string): Promise<{ zh: string; en: string }> {
  console.log("📝 Step 2/4: Generating blog content...");

  const systemPrompt = researchSummary
    ? `你是一位经济学技术写作专家。以下是通过全网资料搜集得到的研究背景，请基于这些资料撰写文章：\n\n${researchSummary}`
    : `你是一位经济学技术写作专家，擅长将复杂的 AI 工具应用转化为清晰的中文教程。`;

  // Generate Chinese draft
  const zhPrompt = `请为以下主题撰写一篇完整的工具型博客文章：

主题：${topic}

要求：
1. 文章长度 2000-3000 字
2. 结构：引言 → 核心概念 → 工具/方法介绍 → 操作步骤 → 实际案例 → 总结
3. 包含具体的工具名称、版本、配置方法
4. 提供可复现的命令和代码示例
5. 解释该工具/方法在经济学研究中的具体价值
6. 使用 Markdown 格式
7. 不要包含标题（标题会在 frontmatter 中）
8. 面向有经济学背景但技术能力中等的读者`;

  const zhDraft = await callAI(zhPrompt, systemPrompt);
  console.log("  ✓ Chinese draft generated");

  // Generate English draft
  const enPrompt = `Translate the following Chinese blog post into natural, professional English.

Original topic: ${topic}

Chinese draft:
${zhDraft}

Requirements:
1. Natural, professional English suitable for academic researchers
2. Maintain all technical details and code examples
3. Adapt for international readers
4. Output in Markdown format
5. Do not include the title`;

  const enDraft = await callAI(enPrompt, `You are an expert in economics research methods and AI tools.`);
  console.log("  ✓ English draft generated\n");

  return { zh: zhDraft, en: enDraft };
}

function generateFrontmatter(options: CreateOptions, locale: string, coverPath?: string): string {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const frontmatter: Record<string, any> = {
    slug: options.slug,
    title: options.title,
    excerpt: "",
    category: options.category,
    date: dateStr,
    readTime: locale === "zh" ? "10 分钟" : "10 min",
    tags: options.tags,
    author: options.author || "戴伟德",
    authorRole: locale === "zh" ? "经济学研究者" : "Economics Researcher",
    issue: `Volume ${String(year).slice(-2)}${month}`,
    illustration: "generated",
  };

  if (coverPath) {
    frontmatter.cover = coverPath;
  }

  if (options.source) {
    frontmatter.source = options.source;
  }

  const lines = ["---"];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - "${item}"`);
      }
    } else {
      lines.push(`${key}: "${value}"`);
    }
  }
  lines.push("---");
  lines.push("");

  return lines.join("\n");
}

function extractExcerpt(content: string, maxLength: number = 200): string {
  const plainText = content
    .replace(/#+ /g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  const truncated = plainText.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf("。");
  const lastExclaim = truncated.lastIndexOf("！");
  const lastQuestion = truncated.lastIndexOf("？");
  const lastSentence = Math.max(lastPeriod, lastExclaim, lastQuestion);

  if (lastSentence > maxLength * 0.5) {
    return truncated.slice(0, lastSentence + 1);
  }

  return truncated + "...";
}

async function generateCover(title: string, outputPath: string): Promise<boolean> {
  console.log("🎨 Step 3/4: Generating cover image...");

  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, "generate-cover-simple.ts");
    const child = spawn("npx", ["tsx", scriptPath, title, outputPath], {
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log("  ✓ Cover generated\n");
        resolve(true);
      } else {
        console.error(`  ✗ Cover generation failed (exit ${code})\n`);
        resolve(false);
      }
    });

    child.on("error", (err) => {
      console.error("  ✗ Cover generation error:", err);
      resolve(false);
    });
  });
}

async function createBlogPost(options: CreateOptions): Promise<void> {
  console.log("🚀 Creating blog post...");
  console.log(`   Title: ${options.title}`);
  console.log(`   Slug: ${options.slug}`);
  console.log(`   Category: ${options.category}`);
  console.log(`   Tags: ${options.tags.join(", ")}`);
  if (options.research) console.log(`   Mode: Web research enabled`);
  console.log("");

  // Step 1: Get or generate content
  let zhContent: string;
  let enContent: string;

  if (options.zhContent && options.enContent) {
    console.log("📄 Using provided content files...");
    zhContent = fs.readFileSync(options.zhContent, "utf-8");
    enContent = fs.readFileSync(options.enContent, "utf-8");
    console.log("  ✓ Content loaded\n");
  } else if (options.topic) {
    // Research phase
    let researchSummary = "";
    if (options.research) {
      researchSummary = await researchTopic(options.topic);
    }

    // Content generation phase
    const generated = await generateContent(options.topic, researchSummary);
    zhContent = generated.zh;
    enContent = generated.en;
  } else {
    throw new Error("Either --topic or both --zh-content and --en-content must be provided");
  }

  // Step 2: Generate cover
  let coverPath: string | undefined;
  if (!options.noCover) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const coverFileName = `${options.slug}.png`;
    const coverOutputPath = path.join(COVER_DIR, String(year), month, coverFileName);
    coverPath = `/blog-covers/${year}/${month}/${coverFileName}`;

    if (!options.dryRun) {
      const success = await generateCover(options.title, coverOutputPath);
      if (!success) {
        console.warn("⚠️  Cover generation failed, continuing without cover...");
        coverPath = undefined;
      }
    } else {
      console.log(`[DRY RUN] Would generate cover: ${coverOutputPath}`);
    }
  }

  // Step 3: Create blog directory and write files
  console.log("📦 Step 4/4: Publishing blog post...");
  const entryDir = path.join(CONTENT_DIR, options.slug);

  if (!options.dryRun) {
    fs.mkdirSync(entryDir, { recursive: true });

    const zhExcerpt = extractExcerpt(zhContent);
    const enExcerpt = extractExcerpt(enContent);

    const zhFrontmatter = generateFrontmatter(options, "zh", coverPath)
      .replace('excerpt: ""', `excerpt: "${zhExcerpt}"`);
    const enFrontmatter = generateFrontmatter(options, "en", coverPath)
      .replace('excerpt: ""', `excerpt: "${enExcerpt}"`);

    const zhPath = path.join(entryDir, "index.zh.md");
    const enPath = path.join(entryDir, "index.en.md");

    fs.writeFileSync(zhPath, zhFrontmatter + zhContent, "utf-8");
    fs.writeFileSync(enPath, enFrontmatter + enContent, "utf-8");

    console.log("  ✓ Files written");
    console.log("\n✅ Blog post created successfully!");
    console.log(`   ${zhPath}`);
    console.log(`   ${enPath}`);
    if (coverPath) {
      console.log(`   Cover: ${coverPath}`);
    }
  } else {
    console.log("\n[DRY RUN] Would create:");
    console.log(`   ${path.join(entryDir, "index.zh.md")}`);
    console.log(`   ${path.join(entryDir, "index.en.md")}`);
    if (coverPath) {
      console.log(`   Cover: ${coverPath}`);
    }
  }

  // Step 4: Next steps
  console.log("\n📋 Next steps:");
  if (options.dryRun) {
    console.log("   Remove --dry-run to create files");
  } else {
    console.log("   1. Review content in the files above");
    console.log("   2. Run: npm run verify:covers");
    console.log("   3. Run: npm run build");
    console.log("   4. Deploy: sudo systemctl reload econagora");
  }
}

// CLI entry
function parseArgs(): CreateOptions {
  const args = process.argv.slice(2);
  const options: Partial<CreateOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    const nextArg = args[i + 1];

    switch (flag) {
      case "--title":
        options.title = nextArg;
        i++;
        break;
      case "--slug":
        options.slug = nextArg;
        i++;
        break;
      case "--category":
        options.category = nextArg;
        i++;
        break;
      case "--tags":
        options.tags = nextArg.split(",").map((t) => t.trim());
        i++;
        break;
      case "--topic":
        options.topic = nextArg;
        i++;
        break;
      case "--source":
        options.source = nextArg;
        i++;
        break;
      case "--zh-content":
        options.zhContent = nextArg;
        i++;
        break;
      case "--en-content":
        options.enContent = nextArg;
        i++;
        break;
      case "--author":
        options.author = nextArg;
        i++;
        break;
      case "--research":
        options.research = true;
        break;
      case "--no-cover":
        options.noCover = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--help":
      case "-h":
        showHelp();
        process.exit(0);
        break;
    }
  }

  if (!options.title || !options.slug || !options.category || !options.tags) {
    console.error("Error: --title, --slug, --category, and --tags are required\n");
    showHelp();
    process.exit(1);
  }

  if (!options.topic && (!options.zhContent || !options.enContent)) {
    console.error("Error: Either --topic or both --zh-content and --en-content must be provided\n");
    showHelp();
    process.exit(1);
  }

  return options as CreateOptions;
}

function showHelp(): void {
  console.log(`
Usage: tsx create-blog-post.ts [options]

Required:
  --title "Title"          Article title
  --slug "article-slug"    URL slug (lowercase, hyphenated)
  --category "Category"    Article category
  --tags "tag1,tag2"       Comma-separated tags

Content (one of):
  --topic "Description"    Generate content (with optional --research)
  --zh-content path        Use existing Chinese content file
  --en-content path        Use existing English content file

Optional:
  --research               Enable web content fetching for research
  --source "URL"           Source URL (arXiv, etc.)
  --author "Name"          Author name (default: 戴伟德)
  --no-cover               Skip cover image generation
  --dry-run                Show what would be done without writing files
  --help, -h               Show this help

Examples:
  # Full workflow with web research
  tsx create-blog-post.ts \\
    --title "AI Agent 连接 Zotero" \\
    --slug "agent-zotero" \\
    --category "AI 工具" \\
    --tags "AI Agent,Zotero" \\
    --topic "如何使用 AI Agent 连接 Zotero 文献管理工具" \\
    --research

  # AI generation without research
  tsx create-blog-post.ts \\
    --title "AI Agent 连接 Zotero" \\
    --slug "agent-zotero" \\
    --category "AI 工具" \\
    --tags "AI Agent,Zotero" \\
    --topic "如何使用 AI Agent 连接 Zotero 文献管理工具"

  # With existing content
  tsx create-blog-post.ts \\
    --title "AI Agent 连接 Zotero" \\
    --slug "agent-zotero" \\
    --category "AI 工具" \\
    --tags "AI Agent,Zotero" \\
    --zh-content ./draft.zh.md \\
    --en-content ./draft.en.md
`);
}

// Main
if (require.main === module) {
  const options = parseArgs();
  createBlogPost(options).catch((error) => {
    console.error("\n❌ Failed:", error.message);
    process.exit(1);
  });
}

export { createBlogPost, researchTopic, generateContent };
