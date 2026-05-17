#!/usr/bin/env tsx
/**
 * 博客数据迁移脚本：将 Markdown 文件导入 CloudBase 文档数据库
 * 用法: npx tsx scripts/migrate-to-cloudbase.ts [--dry-run]
 */

import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";
import { execSync } from "child_process";

const CLOUDBASE_ENV_ID = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID || "agora-8glrfnss7758021c";

// 博客内容目录
const BLOG_DIR = path.join(process.cwd(), "content/blog");

interface BlogPost {
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

/**
 * 读取所有博客文章
 */
function readAllBlogPosts(): BlogPost[] {
  const posts: BlogPost[] = [];
  
  if (!fs.existsSync(BLOG_DIR)) {
    console.error(`❌ Blog directory not found: ${BLOG_DIR}`);
    return posts;
  }

  const entries = fs.readdirSync(BLOG_DIR, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const slug = entry.name;
    const postDir = path.join(BLOG_DIR, slug);
    const zhPath = path.join(postDir, "index.zh.md");
    const enPath = path.join(postDir, "index.en.md");
    
    if (!fs.existsSync(zhPath)) {
      console.warn(`⚠️  Missing Chinese version: ${slug}`);
      continue;
    }

    try {
      // 读取中文版本
      const zhFile = fs.readFileSync(zhPath, "utf-8");
      const zhParsed = matter(zhFile);
      
      let enData: Record<string, any> = {};
      let enContent = "";
      if (fs.existsSync(enPath)) {
        const enFile = fs.readFileSync(enPath, "utf-8");
        const enParsed = matter(enFile);
        enData = enParsed.data;
        enContent = enParsed.content;
      }

      const post: BlogPost = {
        _id: slug,
        slug,
        title: {
          zh: zhParsed.data.title || slug,
          en: enData.title || zhParsed.data.title || slug,
        },
        excerpt: {
          zh: zhParsed.data.excerpt || "",
          en: enData.excerpt || zhParsed.data.excerpt || "",
        },
        content: {
          zh: zhParsed.content,
          en: enContent || zhParsed.content,
        },
        cover: zhParsed.data.cover || `/blog-covers/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${slug}.png`,
        category: zhParsed.data.category || "未分类",
        date: zhParsed.data.date || new Date().toISOString().split('T')[0],
        readTime: zhParsed.data.readTime || "5 分钟",
        tags: zhParsed.data.tags || [],
        author: zhParsed.data.author || "戴伟德",
        authorRole: zhParsed.data.authorRole || "经济学研究者",
        issue: zhParsed.data.issue || "",
        status: "published",
        createdAt: new Date(zhParsed.data.date || Date.now()).toISOString(),
        updatedAt: new Date(zhParsed.data.date || Date.now()).toISOString(),
        viewCount: 0,
        likeCount: 0,
      };

      posts.push(post);
      console.log(`✓ Read: ${slug}`);
      
    } catch (error) {
      console.error(`❌ Error reading ${slug}:`, error);
    }
  }

  return posts;
}

/**
 * 使用 CloudBase MCP 导入单篇数据
 */
async function importPostToCloudbase(post: BlogPost): Promise<boolean> {
  try {
    // 将文档转为 JSON 字符串
    const document = JSON.stringify(post);
    
    // 使用 mcporter 调用 MCP 工具
    const cmd = `npx mcporter call cloudbase.writeNoSqlDatabaseContent action=insert collectionName=blog_posts documents='[${document}]' --output json 2>&1`;
    
    const result = execSync(cmd, { encoding: "utf-8", timeout: 30000 });
    const response = JSON.parse(result);
    
    if (response.success) {
      console.log(`✅ Imported: ${post.slug}`);
      return true;
    } else {
      console.error(`❌ Failed to import ${post.slug}:`, response.message || response.error);
      return false;
    }
  } catch (error: any) {
    // 检查是否是重复键错误（文档已存在）
    if (error.message && error.message.includes("E11000")) {
      console.log(`⚠️  Skipped (exists): ${post.slug}`);
      return true; // 视为成功，因为数据已存在
    } else {
      console.error(`❌ Error importing ${post.slug}:`, error.message || error);
      return false;
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const skipExisting = process.argv.includes("--skip-existing");
  
  console.log("🚀 Blog Migration Tool");
  console.log(`   Environment: ${CLOUDBASE_ENV_ID}`);
  console.log(`   Mode: ${isDryRun ? 'DRY RUN (preview only)' : 'LIVE'}`);
  console.log(`   Skip existing: ${skipExisting}
`);

  // 读取所有博客文章
  console.log("📖 Reading blog posts from Markdown files...");
  const posts = readAllBlogPosts();
  
  if (posts.length === 0) {
    console.error("❌ No blog posts found!");
    process.exit(1);
  }

  console.log(`\n📊 Found ${posts.length} blog posts`);

  // 显示预览
  console.log("\n📋 Preview:");
  posts.forEach((post, i) => {
    console.log(`   ${i + 1}. ${post.slug} - ${post.title.zh}`);
  });

  if (isDryRun) {
    console.log("\n🏃 Dry run completed. No data was imported.");
    console.log("\nNext steps:");
    console.log("1. Review the preview above");
    console.log("2. Run without --dry-run to import to CloudBase");
    return;
  }

  // 确认导入
  console.log("\n⚠️  This will import all posts to CloudBase collection 'blog_posts'");
  console.log("   Press Ctrl+C to cancel, or wait 3 seconds to continue...");
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 执行导入
  console.log(`\n☁️  Importing ${posts.length} posts to CloudBase...`);
  let successCount = 0;
  let failCount = 0;
  
  for (const post of posts) {
    // 如果跳过已存在的文档，先检查
    if (skipExisting) {
      try {
        const checkCmd = `npx mcporter call cloudbase.readNoSqlDatabaseContent collectionName=blog_posts query='{"_id":"${post.slug}"}' limit=1 --output json 2>&1`;
        const checkResult = execSync(checkCmd, { encoding: "utf-8", timeout: 10000 });
        const checkResponse = JSON.parse(checkResult);
        
        if (checkResponse.data && checkResponse.data.length > 0) {
          console.log(`⏭️  Skipped (exists): ${post.slug}`);
          successCount++;
          continue;
        }
      } catch (e) {
        // 检查失败，继续导入
      }
    }
    
    const success = await importPostToCloudbase(post);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // 添加小延迟避免 API 限流
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log("\n✅ Migration completed!");
  console.log(`   Success: ${successCount}/${posts.length}`);
  console.log(`   Failed: ${failCount}/${posts.length}`);
  
  if (failCount === 0) {
    console.log("\nNext steps:");
    console.log("1. Verify data in CloudBase Console");
    console.log("   https://tcb.cloud.tencent.com/dev?envId=agora-8glrfnss7758021c#/db/doc/collection/blog_posts");
    console.log("2. Update frontend to read from database");
    console.log("3. Test blog listing and detail pages");
  }
}

main().catch(console.error);
