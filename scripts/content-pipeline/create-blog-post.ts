#!/usr/bin/env tsx
/**
 * Unified Blog Post Creation Script
 * 
 * One command to create a complete blog post:
 *   - Generate or use provided content
 *   - Generate cover image
 *   - Publish with proper frontmatter
 *   - Update cover path automatically
 * 
 * Usage:
 *   # AI-generated content
 *   tsx scripts/content-pipeline/create-blog-post.ts \
 *     --title "文章标题" \
 *     --slug "article-slug" \
 *     --category "AI 工具" \
 *     --tags "tag1,tag2" \
 *     --topic "详细主题描述" \
 *     --source "https://arxiv.org/abs/2405.xxxxx"
 * 
 *   # With existing content files
 *   tsx scripts/content-pipeline/create-blog-post.ts \
 *     --title "文章标题" \
 *     --slug "article-slug" \
 *     --category "AI 工具" \
 *     --tags "tag1,tag2" \
 *     --zh-content /path/to/zh.md \
 *     --en-content /path/to/en.md
 * 
 *   # Skip cover generation
 *   tsx scripts/content-pipeline/create-blog-post.ts ... --no-cover
 * 
 *   # Dry run (don't write files)
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

async function generateContent(topic: string, source?: string): Promise<{ zh: string; en: string; outline: string }> {
  console.log("📝 Generating content with AI...");

  // Step 1: Outline
  const outlinePrompt = `请为以下主题生成一篇工具型博客文章的详细大纲：

主题：${topic}
${source ? `灵感来源：${source}` : ""}

要求：
1. 文章结构清晰，包含引言、方法、案例、总结
2. 每个部分有具体的要点说明
3. 强调可操作性和复现性
4. 适合经济学研究者阅读

请输出 Markdown 格式的大纲。`;

  const outline = await callAI(outlinePrompt, `你是一位经济学研究方法专家，专注于 AI 工具在经济学研究中的应用。`);
  console.log("  ✓ Outline generated");

  // Step 2: Chinese draft
  const zhPrompt = `基于以下大纲，生成一篇完整的中文博客文章。

主题：${topic}

大纲：
${outline}

要求：
1. 文章长度约 2000-3000 字
2. 包含具体的工具名称和使用场景
3. 提供代码片段或命令示例
4. 解释该方法在经济学研究中的价值
5. 使用 Markdown 格式
6. 不要包含标题（标题会在 frontmatter 中）`;

  const zhDraft = await callAI(zhPrompt, `你是一位经济学技术写作专家，擅长将复杂的 AI 工具应用转化为清晰的中文教程。`);
  console.log("  ✓ Chinese draft generated");

  // Step 3: English draft
  const enPrompt = `Translate the following Chinese blog post into English.
Adapt for an international audience while maintaining technical accuracy.

Original topic: ${topic}

Chinese draft:
${zhDraft}

Requirements:
1. Natural, professional English
2. Maintain all technical details and code examples
3. Adapt cultural references for international readers
4. Output in Markdown format
5. Do not include the title (it will be in frontmatter)`;

  const enDraft = await callAI(enPrompt, `You are an expert in economics research methods and AI tools.`);
  console.log("  ✓ English draft generated");

  return { zh: zhDraft, en: enDraft, outline };
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

  // Convert to YAML
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
  console.log("🎨 Generating cover image...");

  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "generate-cover-simple.ts");
    const child = spawn("npx", ["tsx", scriptPath, title, outputPath], {
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log("  ✓ Cover generated");
        resolve(true);
      } else {
        console.error(`  ✗ Cover generation failed (exit ${code})`);
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
  if (options.source) console.log(`   Source: ${options.source}`);
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
    const generated = await generateContent(options.topic, options.source);
    zhContent = generated.zh;
    enContent = generated.en;
    console.log("");
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

    console.log("\n✅ Blog post created!");
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
  --topic "Description"    Generate content with AI
  --zh-content path        Use existing Chinese content file
  --en-content path        Use existing English content file

Optional:
  --source "URL"           Source URL (arXiv, etc.)
  --author "Name"          Author name (default: 戴伟德)
  --no-cover               Skip cover image generation
  --dry-run                Show what would be done without writing files
  --help, -h               Show this help

Examples:
  # AI-generated content
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

export { createBlogPost, generateContent };
