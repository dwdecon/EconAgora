#!/usr/bin/env tsx
/**
 * Auto-generate cover images for all blog posts
 * Scans content/blog/ for posts without covers and generates them
 *
 * Usage:
 *   tsx scripts/content-pipeline/generate-all-covers.ts
 */

import * as fs from "fs/promises";
import * as path from "path";
import matter from "gray-matter";
import { spawn } from "child_process";

const CONTENT_DIR = path.join(process.cwd(), "content/blog");
const COVER_DIR = path.join(process.cwd(), "public/blog-covers");

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  cover?: string;
  locale: string;
}

async function scanPosts(): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];

  try {
    const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const slug = entry.name;
        const mdPath = path.join(CONTENT_DIR, slug, "index.zh.md");

        try {
          const raw = await fs.readFile(mdPath, "utf-8");
          const { data } = matter(raw);

          posts.push({
            slug,
            title: data.title || slug,
            excerpt: data.excerpt || "",
            cover: data.cover,
            locale: "zh",
          });
        } catch {
          // Skip if file doesn't exist
        }
      }
    }
  } catch (error) {
    console.error("Error scanning posts:", error);
  }

  return posts;
}

function runGenerateCover(title: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "generate-cover-simple.ts");
    const child = spawn("npx", ["tsx", scriptPath, title, outputPath], {
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Cover generation exited with code ${code}`));
      }
    });

    child.on("error", reject);
  });
}

async function generateMissingCovers(): Promise<void> {
  console.log("🔍 Scanning blog posts for missing covers...\n");

  const posts = await scanPosts();
  console.log(`Found ${posts.length} blog posts\n`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const post of posts) {
    // Check if cover already exists
    const coverPath = post.cover
      ? path.join(process.cwd(), "public", post.cover)
      : null;

    if (coverPath) {
      try {
        await fs.access(coverPath);
        console.log(`⏭️  Skipped: ${post.slug} (cover exists)`);
        skipped++;
        continue;
      } catch {
        // Cover doesn't exist, generate it
      }
    }

    // Generate cover
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const outputPath = path.join(
      COVER_DIR,
      String(year),
      month,
      `${post.slug}.png`
    );

    try {
      console.log(`🎨 Generating cover for: ${post.title}`);
      await runGenerateCover(post.title, outputPath);
      generated++;

      // Update frontmatter with new cover path
      const mdPath = path.join(CONTENT_DIR, post.slug, "index.zh.md");
      const raw = await fs.readFile(mdPath, "utf-8");
      const { data, content } = matter(raw);

      data.cover = `/blog-covers/${year}/${month}/${post.slug}.png`;

      const newFrontmatter = Object.entries(data)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}:\n${value.map((v) => `  - ${v}`).join("\n")}`;
          }
          return `${key}: "${value}"`;
        })
        .join("\n");

      const newContent = `---\n${newFrontmatter}\n---\n\n${content}`;
      await fs.writeFile(mdPath, newContent);
      console.log(`✅ Updated frontmatter for: ${post.slug}\n`);
    } catch (error) {
      console.error(`❌ Failed to generate cover for ${post.slug}:`, error);
      failed++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   Generated: ${generated}`);
  console.log(`   Skipped:   ${skipped}`);
  console.log(`   Failed:    ${failed}`);
}

// Run if called directly
if (require.main === module) {
  generateMissingCovers().catch(console.error);
}

export { generateMissingCovers, scanPosts };
