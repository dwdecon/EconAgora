/**
 * Blog content parser for MD files
 * Reads and parses frontmatter + markdown content
 */

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

export interface BlogFrontmatter {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  tags: string[];
  author: string;
  authorRole: string;
  issue: string;
  illustration?: string;
  cover?: string;
  coverEn?: string;
  featured?: boolean;
  status?: "draft" | "published" | "archived";
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface ParsedBlogPost {
  frontmatter: BlogFrontmatter;
  content: string;
  slug: string;
  locale: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content/blog");

/**
 * Get the content directory path
 * Works in both development and standalone production mode
 */
function getContentDir(): string {
  const cwd = process.cwd();
  
  // If running from standalone directory, use the copied content
  if (cwd.includes("standalone")) {
    return path.join(cwd, "content/blog");
  }
  
  // If running from project root (dev or build time), use source content
  return path.join(cwd, "content/blog");
}

/**
 * Parse a single MD file
 */
export async function parseBlogFile(
  filePath: string
): Promise<ParsedBlogPost | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    console.log(`[Blog] Parsing: ${filePath}, size: ${raw.length}`);
    const { data, content } = matter(raw);
    console.log(`[Blog] Parsed frontmatter:`, JSON.stringify(data).slice(0, 200));

    return {
      frontmatter: data as BlogFrontmatter,
      content,
      slug: data.slug || path.basename(path.dirname(filePath)),
      locale: path.basename(filePath).includes(".en.") ? "en" : "zh",
    };
  } catch (error) {
    console.error(`[Blog] Error parsing ${filePath}:`, error);
    return null;
  }
}

/**
 * Get all blog posts from MD files (fallback when DB is not available)
 * Structure: content/blog/[slug]/index.[locale].md
 */
export async function getBlogPostsFromFiles(
  locale: string = "zh"
): Promise<ParsedBlogPost[]> {
  const posts: ParsedBlogPost[] = [];
  const contentDir = getContentDir();

  try {
    const entries = await fs.readdir(contentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const slug = entry.name;
        const mdPath = path.join(contentDir, slug, `index.${locale}.md`);
        
        // Try requested locale first
        let post = await parseBlogFile(mdPath);
        
        // Fallback to zh if locale file doesn't exist
        if (!post && locale !== "zh") {
          const fallbackPath = path.join(contentDir, slug, `index.zh.md`);
          post = await parseBlogFile(fallbackPath);
        }
        
        if (post && post.frontmatter.status !== "draft") {
          posts.push(post);
        }
      }
    }

    // Sort by date descending
    return posts.sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
    );
  } catch (error) {
    console.error("Error reading blog posts:", error);
    return [];
  }
}

/**
 * Get a single blog post by slug
 * Structure: content/blog/[slug]/index.[locale].md
 */
export async function getBlogPostBySlugFromFiles(
  slug: string,
  locale: string = "zh"
): Promise<ParsedBlogPost | null> {
  const contentDir = getContentDir();
  const filePath = path.join(contentDir, slug, `index.${locale}.md`);

  try {
    const post = await parseBlogFile(filePath);
    if (post) return post;
  } catch {
    // Ignore error, try fallback
  }
  
  // Try fallback locale
  if (locale !== "zh") {
    const fallbackPath = path.join(contentDir, slug, `index.zh.md`);
    try {
      return await parseBlogFile(fallbackPath);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Get all available slugs (for static generation)
 * Scans all MD files and returns unique slugs with their available locales
 */
export async function getAllBlogSlugs(): Promise<
  { slug: string; locale: string }[]
> {
  const slugs: { slug: string; locale: string }[] = [];
  const seenSlugs = new Set<string>();
  const contentDir = getContentDir();
  
  console.log(`[Blog] getAllBlogSlugs: contentDir=${contentDir}, cwd=${process.cwd()}`);

  try {
    const entries = await fs.readdir(contentDir, { withFileTypes: true });
    console.log(`[Blog] getAllBlogSlugs: found ${entries.length} entries`);

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const slug = entry.name;
        const slugDir = path.join(contentDir, slug);
        
        // Check for zh version
        const zhPath = path.join(slugDir, "index.zh.md");
        try {
          await fs.access(zhPath);
          if (!seenSlugs.has(`${slug}-zh`)) {
            slugs.push({ slug, locale: "zh" });
            seenSlugs.add(`${slug}-zh`);
            console.log(`[Blog] getAllBlogSlugs: added ${slug}-zh`);
          }
        } catch {}
        
        // Check for en version
        const enPath = path.join(slugDir, "index.en.md");
        try {
          await fs.access(enPath);
          if (!seenSlugs.has(`${slug}-en`)) {
            slugs.push({ slug, locale: "en" });
            seenSlugs.add(`${slug}-en`);
            console.log(`[Blog] getAllBlogSlugs: added ${slug}-en`);
          }
        } catch {}
      }
    }
  } catch (error) {
    console.error("Error getting slugs:", error);
  }
  
  console.log(`[Blog] getAllBlogSlugs: total ${slugs.length} slugs`);

  return slugs;
}

/**
 * Sync all MD files to database
 */
export async function syncAllPostsToDatabase(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const result = { success: 0, failed: 0, errors: [] as string[] };

  try {
    // Import here to avoid circular dependency
    const { getBlogPostsFromDB } = await import("@/lib/blog-db");

    const posts = await getBlogPostsFromFiles("zh");

    for (const post of posts) {
      const fm = post.frontmatter;

      // Try to get English version
      let titleEn = fm.title;
      let excerptEn = fm.excerpt;

      try {
        const enPost = await getBlogPostBySlugFromFiles(fm.slug, "en");
        if (enPost) {
          titleEn = enPost.frontmatter.title;
          excerptEn = enPost.frontmatter.excerpt;
        }
      } catch {
        // No English version
      }

      // Note: sync functionality moved to migration scripts
      // This function is kept for backward compatibility
      result.success++;
    }
  } catch (error) {
    console.error("Error syncing posts:", error);
    result.errors.push(String(error));
  }

  return result;
}
