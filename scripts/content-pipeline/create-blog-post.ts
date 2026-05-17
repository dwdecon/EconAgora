#!/usr/bin/env tsx
/**
 * Unified Blog Post Creation Script with Web Research
 *
 * Complete workflow:
 *   1. Research topic via web content fetching
 *   2. Generate structured content based on research (Chinese + English + English title)
 *   3. Generate cover image and upload to CloudBase Storage
 *   4. Publish to CloudBase NoSQL (primary) + local Markdown (optional)
 *
 * Usage:
 *   # Full workflow: research + generate + cover + publish to CloudBase
 *   tsx scripts/content-pipeline/create-blog-post.ts \\
 *     --title "AI Agent 连接 Zotero 文献管理" \\
 *     --slug "agent-zotero-integration" \\
 *     --category "AI 工具" \\
 *     --tags "AI Agent,Zotero,文献管理" \\
 *     --topic "如何使用 AI Agent 连接 Zotero 进行经济学文献管理" \\
 *     --research \\
 *     --cloudbase
 *
 *   # CloudBase only (no local files)
 *   tsx scripts/content-pipeline/create-blog-post.ts ... --cloudbase --skip-local
 *
 *   # Local files only (legacy mode)
 *   tsx scripts/content-pipeline/create-blog-post.ts ... --topic "..."
 */

import fs from "fs";
import path from "path";
import { spawn, execSync } from "child_process";

const API_URL = "https://coding.rexai.top/openai/v1/chat/completions";
const CONTENT_DIR = path.join(process.cwd(), "content/blog");
const COVER_DIR = path.join(process.cwd(), "public/blog-covers");
const CLOUDBASE_STORAGE_DOMAIN = "6167-agora-8glrfnss7758021c-1386493538.tcb.qcloud.la";

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
  cloudbase?: boolean;
  skipLocal?: boolean;
}

interface BlogPostDocument {
  _id: string;
  slug: string;
  title: { zh: string; en: string };
  excerpt: { zh: string; en: string };
  content: { zh: string; en: string };
  cover: string;
  category: string;
  date: string;
  readTime: string;
  tags: string[];
  author: string;
  authorRole: string;
  issue: string;
  status: "published" | "draft" | "archived";
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
}

interface GeneratedContent {
  zh: string;
  en: string;
  titleEn: string;
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
      model: "gemini-2.5-pro",
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
  console.log("🔍 Step 1/5: Researching topic via web content fetching...");
  console.log(`   Topic: ${topic}`);
  console.log("");

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

async function generateContent(topic: string, researchSummary: string): Promise<GeneratedContent> {
  console.log("📝 Step 2/5: Generating blog content...");

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

  let zhDraft: string;
  try {
    zhDraft = await callAI(zhPrompt, systemPrompt);
    console.log("  ✓ Chinese draft generated");
  } catch (error: any) {
    console.error("  ✗ Chinese draft generation failed:", error.message);
    throw new Error(`Content generation failed: ${error.message}`);
  }

  // Generate English draft with title
  const enPrompt = `Translate the following Chinese blog post into natural, professional English.

Original topic: ${topic}

Chinese draft:
${zhDraft}

Requirements:
1. Natural, professional English suitable for academic researchers
2. Maintain all technical details and code examples
3. Adapt for international readers
4. Output in Markdown format
5. Do not include the title

Additionally, please provide a concise, professional English title for this article (5-10 words). 
Output the title on the FIRST line in this exact format:
TITLE: <Your English Title>

Then output the translated content.`;

  let enDraft: string;
  let titleEn: string;

  try {
    const enResult = await callAI(enPrompt, `You are an expert in economics research methods and AI tools.`);
    console.log("  ✓ English draft generated");

    // Extract English title from the response
    titleEn = topic; // fallback
    enDraft = enResult;
    
    const titleMatch = enResult.match(/^TITLE:\s*(.+?)\n/);
    if (titleMatch) {
      titleEn = titleMatch[1].trim();
      enDraft = enResult.slice(titleMatch[0].length).trim();
      console.log(`  ✓ English title (AI): "${titleEn}"`);
    }
  } catch (error: any) {
    console.warn("  ⚠️  English generation failed:", error.message);
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚠️  API unavailable for English title generation");
    console.log("");
    console.log("Please provide an English title manually.");
    console.log("Suggested format: 'How to [Action] with [Tool]'");
    console.log("Examples:");
    console.log('  - "How to Connect AI Agents to Zotero"');
    console.log('  - "AI-Assisted Literature Reviews in Practice"');
    console.log('  - "Setting Up VSCode for AI-Assisted Research"');
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    
    // For now, use a placeholder that clearly indicates it needs updating
    titleEn = `[EN: ${topic}]`;
    enDraft = "[English translation pending — please update when API is available]\n\n" + zhDraft;
    console.log(`  ✓ Using placeholder title: "${titleEn}"`);
    console.log(`  ✓ Remember to update the English title later!`);
  }
  console.log("");

  return { zh: zhDraft, en: enDraft, titleEn };
}

/**
 * Skill-based English title generation (fallback when API is unavailable)
 * Uses pattern matching and templates to generate professional English titles
 */
function generateEnglishTitleSkill(chineseTitle: string): string {
  // Pattern 1: "如何..." / "怎么..." → "How to..."
  if (/^(如何|怎么|怎样)/.test(chineseTitle)) {
    const rest = chineseTitle.replace(/^(如何|怎么|怎样)/, '').trim();
    return `How to ${translateFragment(rest)}`;
  }
  
  // Pattern 2: "什么是..." → "What Is..."
  if (/^(什么是)/.test(chineseTitle)) {
    const rest = chineseTitle.replace(/^(什么是)/, '').trim();
    return `What Is ${translateFragment(rest)}?`;
  }
  
  // Pattern 3: "...入门" / "...基础" → "... Explained" / "Getting Started with..."
  if (/入门/.test(chineseTitle)) {
    const rest = chineseTitle.replace(/入门/, '').trim();
    return `${translateFragment(rest)} Explained`;
  }
  
  // Pattern 4: "...技巧" / "...最佳实践" → "Tips for..."
  if (/技巧/.test(chineseTitle)) {
    const rest = chineseTitle.replace(/技巧/, '').trim();
    return `Tips for ${translateFragment(rest)}`;
  }
  
  // Pattern 5: "...配置" / "...安装" / "...搭建" → "Setting Up..."
  if (/配置|安装|搭建/.test(chineseTitle)) {
    const rest = chineseTitle.replace(/配置|安装|搭建/, '').trim();
    return `Setting Up ${translateFragment(rest)}`;
  }
  
  // Pattern 6: "...对比" / "... vs ..." → "... vs ..."
  if (/对比|vs|VS/.test(chineseTitle)) {
    return chineseTitle
      .replace(/对比/, 'vs')
      .replace(/和|与/, 'vs');
  }
  
  // Default: translate key terms and construct title
  return translateFragment(chineseTitle);
}

/**
 * Translate common Chinese fragments to English
 */
function translateFragment(chinese: string): string {
  const dictionary: Record<string, string> = {
    'AI Agent': 'AI Agent',
    'AI': 'AI',
    'Zotero': 'Zotero',
    'Stata': 'Stata',
    'Python': 'Python',
    'VSCode': 'VSCode',
    '文献管理': 'Reference Management',
    '文献综述': 'Literature Review',
    '论文写作': 'Paper Writing',
    '经济学': 'Economics',
    '计量经济学': 'Econometric',
    '数据分析': 'Data Analysis',
    '回归分析': 'Regression Analysis',
    '编程': 'Programming',
    '配置': 'Configuration',
    '使用': 'Using',
    '连接': 'Connecting',
    '辅助': 'Assisted',
    '自动化': 'Automation',
    '工具': 'Tools',
    '插件': 'Plugins',
    '教程': 'Tutorial',
    '指南': 'Guide',
    '实战': 'in Practice',
    '案例': 'Case Study',
    '技巧': 'Tips',
    '最佳实践': 'Best Practices',
    '入门': 'Getting Started',
    '基础': 'Basics',
    '高级': 'Advanced',
    '快速': 'Quick',
    '完整': 'Complete',
    '全面': 'Comprehensive',
  };
  
  let result = chinese;
  for (const [cn, en] of Object.entries(dictionary)) {
    result = result.replace(new RegExp(cn, 'g'), en);
  }
  
  // Clean up and format
  return result
    .replace(/[的之]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w/g, (c) => c.toUpperCase()); // Title case
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
  console.log("🎨 Step 3/5: Generating cover image...");

  try {
    const scriptPath = path.join(__dirname, "generate-cover-simple.ts");
    execSync(`npx tsx "${scriptPath}" ${JSON.stringify(title)} ${JSON.stringify(outputPath)}`, {
      encoding: "utf-8",
      timeout: 300000,
      stdio: "inherit",
      shell: "/bin/bash",
    });
    console.log("  ✓ Cover generated\n");
    return true;
  } catch (error: any) {
    console.error(`  ✗ Cover generation failed:`, error.message);
    return false;
  }
}

/**
 * Upload cover image to CloudBase Storage
 */
async function uploadCoverToCloudbase(
  localPath: string,
  cloudPath: string,
  dryRun: boolean
): Promise<string | undefined> {
  console.log("☁️  Uploading cover to CloudBase Storage...");

  if (dryRun) {
    const publicUrl = `https://${CLOUDBASE_STORAGE_DOMAIN}/${cloudPath}`;
    console.log(`[DRY RUN] Would upload to: ${cloudPath}`);
    console.log(`[DRY RUN] Public URL: ${publicUrl}`);
    return publicUrl;
  }

  if (!fs.existsSync(localPath)) {
    console.error(`  ✗ Cover file not found: ${localPath}`);
    return undefined;
  }

  try {
    const cmd = `npx mcporter call cloudbase.manageStorage action=upload localPath=${localPath} cloudPath=${cloudPath} --output json 2>&1`;
    const result = execSync(cmd, { encoding: "utf-8", timeout: 60000 });
    const response = JSON.parse(result);

    if (response.success) {
      const publicUrl = response.data?.publicUrl || `https://${CLOUDBASE_STORAGE_DOMAIN}/${cloudPath}`;
      console.log(`  ✓ Cover uploaded: ${publicUrl}`);
      return publicUrl;
    } else {
      console.error(`  ✗ Upload failed:`, response.error || response.message);
      return undefined;
    }
  } catch (error: any) {
    console.error(`  ✗ Upload error:`, error.message || error);
    return undefined;
  }
}

/**
 * Publish blog post to CloudBase NoSQL document database
 */
async function publishToCloudbase(
  post: BlogPostDocument,
  dryRun: boolean
): Promise<boolean> {
  console.log("☁️  Publishing to CloudBase NoSQL...");

  if (dryRun) {
    console.log(`[DRY RUN] Would upsert document to blog_posts collection:`);
    console.log(`   _id: ${post._id}`);
    console.log(`   title.zh: ${post.title.zh}`);
    console.log(`   title.en: ${post.title.en}`);
    console.log(`   slug: ${post.slug}`);
    return true;
  }

  try {
    // Check if document already exists
    const checkCmd = `npx mcporter call cloudbase.readNoSqlDatabaseContent collectionName=blog_posts query='{"_id":"${post._id}"}' limit=1 --output json 2>&1`;
    const checkResult = execSync(checkCmd, { encoding: "utf-8", timeout: 15000 });
    const checkResponse = JSON.parse(checkResult);

    const exists = checkResponse.data && checkResponse.data.length > 0;

    if (exists) {
      // Update existing document
      const updateCmd = `npx mcporter call cloudbase.writeNoSqlDatabaseContent action=update collectionName=blog_posts query='{"_id":"${post._id}"}' documents='[${JSON.stringify(post)}]' --output json 2>&1`;
      const updateResult = execSync(updateCmd, { encoding: "utf-8", timeout: 15000 });
      const updateResponse = JSON.parse(updateResult);

      if (updateResponse.success) {
        console.log(`  ✓ Updated in CloudBase: ${post.slug}`);
        return true;
      } else {
        console.error(`  ✗ CloudBase update failed:`, updateResponse.message || updateResponse.error);
        return false;
      }
    } else {
      // Insert new document
      const document = JSON.stringify(post);
      const insertCmd = `npx mcporter call cloudbase.writeNoSqlDatabaseContent action=insert collectionName=blog_posts documents='[${document}]' --output json 2>&1`;
      const insertResult = execSync(insertCmd, { encoding: "utf-8", timeout: 15000 });
      const insertResponse = JSON.parse(insertResult);

      if (insertResponse.success) {
        console.log(`  ✓ Inserted to CloudBase: ${post.slug}`);
        return true;
      } else {
        console.error(`  ✗ CloudBase insert failed:`, insertResponse.message || insertResponse.error);
        return false;
      }
    }
  } catch (error: any) {
    console.error(`  ✗ CloudBase publish error:`, error.message || error);
    return false;
  }
}

/**
 * Write blog post to local Markdown files (legacy mode)
 */
async function publishToLocalFiles(
  options: CreateOptions,
  zhContent: string,
  enContent: string,
  coverPath?: string
): Promise<void> {
  console.log("📦 Publishing to local files...");

  const entryDir = path.join(CONTENT_DIR, options.slug);
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

  console.log(`  ✓ Files written`);
  console.log(`     ${zhPath}`);
  console.log(`     ${enPath}`);
}

async function createBlogPost(options: CreateOptions): Promise<void> {
  console.log("🚀 Creating blog post...");
  console.log(`   Title (zh): ${options.title}`);
  console.log(`   Slug: ${options.slug}`);
  console.log(`   Category: ${options.category}`);
  console.log(`   Tags: ${options.tags.join(", ")}`);
  if (options.research) console.log(`   Research: enabled`);
  if (options.cloudbase) console.log(`   CloudBase: enabled`);
  if (options.skipLocal) console.log(`   Skip local: enabled`);
  console.log("");

  // Step 1: Get or generate content
  let zhContent: string;
  let enContent: string;
  let titleEn: string = options.title;

  if (options.zhContent && options.enContent) {
    console.log("📄 Using provided content files...");
    zhContent = fs.readFileSync(options.zhContent, "utf-8");
    enContent = fs.readFileSync(options.enContent, "utf-8");
    
    // Try to extract English title from en content or generate one
    const enLines = enContent.split("\n");
    const firstHeading = enLines.find(l => l.startsWith("# "));
    if (firstHeading) {
      titleEn = firstHeading.replace("# ", "").trim();
    }
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
    titleEn = generated.titleEn;
  } else {
    throw new Error("Either --topic or both --zh-content and --en-content must be provided");
  }

  // Step 2: Generate cover
  let coverUrl: string | undefined;
  let localCoverPath: string | undefined;
  
  if (!options.noCover) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const coverFileName = `${options.slug}.png`;
    const coverOutputPath = path.join(COVER_DIR, String(year), month, coverFileName);
    const cloudPath = `blog-covers/${year}/${month}/${coverFileName}`;
    
    // Always generate cover locally first (the script needs a local path)
    if (!options.dryRun) {
      const success = await generateCover(options.title, coverOutputPath);
      if (success) {
        localCoverPath = coverOutputPath;
        
        // Upload to CloudBase if cloudbase mode is enabled
        if (options.cloudbase) {
          const uploadedUrl = await uploadCoverToCloudbase(coverOutputPath, cloudPath, false);
          if (uploadedUrl) {
            coverUrl = uploadedUrl;
          }
        }
        
        // If not using CloudBase or upload failed, use local path
        if (!coverUrl) {
          coverUrl = `/blog-covers/${year}/${month}/${coverFileName}`;
        }
      } else {
        console.warn("⚠️  Cover generation failed, continuing without cover...");
      }
    } else {
      console.log(`[DRY RUN] Would generate cover: ${coverOutputPath}`);
      if (options.cloudbase) {
        coverUrl = await uploadCoverToCloudbase(coverOutputPath, cloudPath, true);
      } else {
        coverUrl = `/blog-covers/${year}/${month}/${coverFileName}`;
      }
    }
  }

  // Step 3: Prepare blog post document
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const zhExcerpt = extractExcerpt(zhContent);
  const enExcerpt = extractExcerpt(enContent);

  const postDocument: BlogPostDocument = {
    _id: options.slug,
    slug: options.slug,
    title: { zh: options.title, en: titleEn },
    excerpt: { zh: zhExcerpt, en: enExcerpt },
    content: { zh: zhContent, en: enContent },
    cover: coverUrl || `/blog-covers/${year}/${month}/${options.slug}.png`,
    category: options.category,
    date: dateStr,
    readTime: "10 分钟",
    tags: options.tags,
    author: options.author || "戴伟德",
    authorRole: "经济学研究者",
    issue: `Volume ${String(year).slice(-2)}${month}`,
    status: "published",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    viewCount: 0,
    likeCount: 0,
  };

  // Step 4: Publish to CloudBase (if enabled)
  let cloudbaseSuccess = false;
  if (options.cloudbase) {
    cloudbaseSuccess = await publishToCloudbase(postDocument, options.dryRun || false);
  }

  // Step 5: Publish to local files (if not skipped)
  if (!options.skipLocal) {
    if (!options.dryRun) {
      await publishToLocalFiles(options, zhContent, enContent, coverUrl);
    } else {
      console.log("\n[DRY RUN] Would create local files:");
      console.log(`   ${path.join(CONTENT_DIR, options.slug, "index.zh.md")}`);
      console.log(`   ${path.join(CONTENT_DIR, options.slug, "index.en.md")}`);
    }
  }

  // Step 6: Summary
  console.log("\n✅ Blog post creation completed!");
  if (options.cloudbase) {
    console.log(`   CloudBase DB: ${cloudbaseSuccess ? '✓ Published' : '✗ Failed'}`);
  }
  if (!options.skipLocal) {
    console.log(`   Local files: ✓ Written`);
  }
  if (coverUrl) {
    console.log(`   Cover: ${coverUrl}`);
  }

  // Step 7: Next steps
  console.log("\n📋 Next steps:");
  if (options.dryRun) {
    console.log("   Remove --dry-run to publish");
  } else {
    if (options.cloudbase && !cloudbaseSuccess) {
      console.log("   ⚠️  CloudBase publish failed — check credentials and retry");
    }
    if (!options.skipLocal) {
      console.log("   1. Review content in local files");
      console.log("   2. Run: npm run verify:covers");
      console.log("   3. Run: npm run build");
      console.log("   4. Deploy: sudo systemctl restart econagora");
    }
    if (options.cloudbase && cloudbaseSuccess && options.skipLocal) {
      console.log("   ✓ Post is live on CloudBase — no build needed");
    }
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
      case "--cloudbase":
        options.cloudbase = true;
        break;
      case "--skip-local":
        options.skipLocal = true;
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
  --title "Title"          Article title (Chinese)
  --slug "article-slug"    URL slug (lowercase, hyphenated)
  --category "Category"    Article category
  --tags "tag1,tag2"       Comma-separated tags

Content (one of):
  --topic "Description"    Generate content (with optional --research)
  --zh-content path        Use existing Chinese content file
  --en-content path        Use existing English content file

Publishing:
  --cloudbase              Publish to CloudBase (NoSQL DB + Storage)
  --skip-local             Skip writing local Markdown files

Optional:
  --research               Enable web content fetching for research
  --source "URL"           Source URL (arXiv, etc.)
  --author "Name"          Author name (default: 戴伟德)
  --no-cover               Skip cover image generation
  --dry-run                Show what would be done without writing
  --help, -h               Show this help

Examples:
  # Full CloudBase workflow with research
  tsx create-blog-post.ts \\
    --title "AI Agent 连接 Zotero" \\
    --slug "agent-zotero" \\
    --category "AI 工具" \\
    --tags "AI Agent,Zotero" \\
    --topic "如何使用 AI Agent 连接 Zotero 文献管理工具" \\
    --research \\
    --cloudbase

  # CloudBase only (no local files)
  tsx create-blog-post.ts ... --cloudbase --skip-local

  # Local files only (legacy)
  tsx create-blog-post.ts ... --topic "..."
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
