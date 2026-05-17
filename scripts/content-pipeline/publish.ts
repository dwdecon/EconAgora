#!/usr/bin/env tsx
/**
 * Publish blog post to content directory
 *
 * Usage:
 *   tsx scripts/content-pipeline/publish.ts \
 *     --title "文章标题" \
 *     --slug "article-slug" \
 *     --category "分类" \
 *     --tags "tag1,tag2" \
 *     --zh-content "中文内容文件路径" \
 *     --en-content "英文内容文件路径" \
 *     --cover "/blog-covers/2026/05/cover.png" \
 *     --source "arXiv:2405.xxxxx"
 */

import fs from "fs";
import path from "path";

interface PublishOptions {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  zhContent: string;
  enContent: string;
  cover?: string;
  source?: string;
  author?: string;
}

function generateFrontmatter(options: PublishOptions, locale: string): string {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  const frontmatter: Record<string, any> = {
    slug: options.slug,
    title: options.title,
    excerpt: "", // Will be filled from content
    category: options.category,
    date: dateStr,
    readTime: locale === "zh" ? "10 分钟" : "10 min",
    tags: options.tags,
    author: options.author || "戴伟德",
    authorRole: locale === "zh" ? "经济学研究者" : "Economics Researcher",
    issue: `Volume ${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}`,
    illustration: "generated",
  };

  if (options.cover) {
    frontmatter.cover = options.cover;
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
  // Remove Markdown syntax and get plain text
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

  // Try to break at sentence end
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

export function publish(options: PublishOptions): string {
  const blogDir = path.join(process.cwd(), "content/blog");
  const entryDir = path.join(blogDir, options.slug);

  // Create directory
  fs.mkdirSync(entryDir, { recursive: true });

  // Read content files
  const zhContent = fs.readFileSync(options.zhContent, "utf-8");
  const enContent = fs.readFileSync(options.enContent, "utf-8");

  // Extract excerpts
  const zhExcerpt = extractExcerpt(zhContent);
  const enExcerpt = extractExcerpt(enContent);

  // Generate frontmatter with excerpts
  const zhFrontmatter = generateFrontmatter(
    { ...options, title: options.title },
    "zh"
  ).replace('excerpt: ""', `excerpt: "${zhExcerpt}"`);

  const enFrontmatter = generateFrontmatter(
    { ...options, title: options.title },
    "en"
  ).replace('excerpt: ""', `excerpt: "${enExcerpt}"`);

  // Write files
  const zhPath = path.join(entryDir, "index.zh.md");
  const enPath = path.join(entryDir, "index.en.md");

  fs.writeFileSync(zhPath, zhFrontmatter + zhContent, "utf-8");
  fs.writeFileSync(enPath, enFrontmatter + enContent, "utf-8");

  console.log(`✅ Published to:`);
  console.log(`   ${zhPath}`);
  console.log(`   ${enPath}`);

  return entryDir;
}

// CLI entry
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: Partial<PublishOptions> = {};

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case "--title":
        options.title = value;
        break;
      case "--slug":
        options.slug = value;
        break;
      case "--category":
        options.category = value;
        break;
      case "--tags":
        options.tags = value.split(",").map((t) => t.trim());
        break;
      case "--zh-content":
        options.zhContent = value;
        break;
      case "--en-content":
        options.enContent = value;
        break;
      case "--cover":
        options.cover = value;
        break;
      case "--source":
        options.source = value;
        break;
      case "--author":
        options.author = value;
        break;
    }
  }

  if (
    !options.title ||
    !options.slug ||
    !options.category ||
    !options.zhContent ||
    !options.enContent
  ) {
    console.error("Missing required arguments");
    console.error(
      "Usage: tsx publish.ts --title \"...\" --slug \"...\" --category \"...\" --zh-content path --en-content path [--tags \"tag1,tag2\"] [--cover path] [--source url]"
    );
    process.exit(1);
  }

  publish(options as PublishOptions);
}
