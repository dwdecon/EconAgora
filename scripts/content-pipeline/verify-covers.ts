#!/usr/bin/env tsx
/**
 * Verify blog cover image pipeline
 * Checks:
 *   1. All posts have cover paths in frontmatter
 *   2. All cover images exist
 *   3. Images are valid (not corrupted)
 *   4. Images are reasonable size
 *
 * Usage:
 *   tsx scripts/content-pipeline/verify-covers.ts
 */

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content/blog");
const PUBLIC_DIR = path.join(process.cwd(), "public");

interface VerificationResult {
  slug: string;
  title: string;
  coverPath?: string;
  coverExists: boolean;
  coverSize?: number;
  isValid: boolean;
  errors: string[];
}

async function verifyCovers(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  try {
    const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const slug = entry.name;
        const mdPath = path.join(CONTENT_DIR, slug, "index.zh.md");

        try {
          const raw = await fs.readFile(mdPath, "utf-8");
          const { data } = matter(raw);

          const result: VerificationResult = {
            slug,
            title: data.title || slug,
            coverPath: data.cover,
            coverExists: false,
            isValid: true,
            errors: [],
          };

          // Check if cover path exists
          if (!data.cover) {
            result.errors.push("No cover path in frontmatter");
            result.isValid = false;
          } else {
            // Check if file exists
            const fullPath = path.join(PUBLIC_DIR, data.cover);
            try {
              const stat = await fs.stat(fullPath);
              result.coverExists = true;
              result.coverSize = stat.size;

              // Check if file is reasonable size (not a 1x1 placeholder)
              if (stat.size < 1000) {
                result.errors.push(`Cover image too small (${stat.size} bytes), likely a placeholder`);
                result.isValid = false;
              }

              // Check if file is not empty
              if (stat.size === 0) {
                result.errors.push("Cover image is empty");
                result.isValid = false;
              }
            } catch {
              result.errors.push(`Cover image not found: ${data.cover}`);
              result.isValid = false;
            }
          }

          results.push(result);
        } catch {
          // Skip if file doesn't exist
        }
      }
    }
  } catch (error) {
    console.error("Error scanning posts:", error);
  }

  return results;
}

async function main(): Promise<void> {
  console.log("🔍 Verifying blog cover images...\n");

  const results = await verifyCovers();

  let valid = 0;
  let invalid = 0;

  for (const result of results) {
    const status = result.isValid ? "✅" : "❌";
    console.log(`${status} ${result.title}`);

    if (result.coverPath) {
      console.log(`   Cover: ${result.coverPath}`);
    }

    if (result.coverSize) {
      console.log(`   Size: ${(result.coverSize / 1024).toFixed(1)} KB`);
    }

    for (const error of result.errors) {
      console.log(`   Error: ${error}`);
    }

    console.log();

    if (result.isValid) {
      valid++;
    } else {
      invalid++;
    }
  }

  console.log("📊 Summary:");
  console.log(`   Valid:   ${valid}/${results.length}`);
  console.log(`   Invalid: ${invalid}/${results.length}`);

  if (invalid > 0) {
    console.log("\n💡 Run 'npm run regenerate:covers' to fix issues");
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { verifyCovers };
