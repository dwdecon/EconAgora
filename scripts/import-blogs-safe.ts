#!/usr/bin/env tsx
/**
 * 安全的博客数据导入脚本 - 使用 Node.js SDK 避免 shell 转义问题
 */

import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

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
    } catch (error) {
      console.error(`❌ Error reading ${slug}:`, error);
    }
  }

  return posts;
}

async function importWithSDK(posts: BlogPost[]) {
  // 使用 CloudBase Node SDK
  const cloudbase = require("@cloudbase/node-sdk");
  
  const app = cloudbase.init({
    env: "agora-8glrfnss7758021c",
    secretId: process.env.TENCENTCLOUD_SECRET_ID,
    secretKey: process.env.TENCENTCLOUD_SECRET_KEY,
    sessionToken: process.env.TENCENTCLOUD_TOKEN
  });
  
  const db = app.database();
  const collection = db.collection("blog_posts");
  
  console.log(`\n☁️  Importing ${posts.length} posts using Node SDK...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const post of posts) {
    try {
      // 使用 set 方法（upsert - 如果不存在则插入，存在则更新）
      await collection.doc(post._id).set({
        data: post
      });
      console.log(`✅ Imported: ${post.slug}`);
      successCount++;
    } catch (error: any) {
      if (error.message && error.message.includes("E11000")) {
        console.log(`⚠️  Already exists: ${post.slug}`);
        successCount++;
      } else {
        console.error(`❌ Failed: ${post.slug} - ${error.message || error}`);
        failCount++;
      }
    }
  }
  
  console.log(`\n✅ Import completed!`);
  console.log(`   Success: ${successCount}/${posts.length}`);
  console.log(`   Failed: ${failCount}/${posts.length}`);
}

async function main() {
  console.log("🚀 Blog Import (Safe Mode)");
  console.log("   Using CloudBase Node SDK\n");

  const posts = readAllBlogPosts();
  console.log(`📊 Found ${posts.length} blog posts\n`);

  if (posts.length === 0) {
    console.error("❌ No blog posts found!");
    process.exit(1);
  }

  // 显示预览
  posts.forEach((post, i) => {
    console.log(`   ${i + 1}. ${post.slug}`);
  });

  console.log("\n⚠️  Starting import in 2 seconds... (Ctrl+C to cancel)");
  await new Promise(resolve => setTimeout(resolve, 2000));

  await importWithSDK(posts);
}

main().catch(console.error);
