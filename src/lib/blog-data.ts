/**
 * Unified blog data layer for EconAgora
 * Reads content/blog/[slug]/index.{zh,en}.md and content/blog/series.yaml
 */

import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import matter from "gray-matter";
import * as yaml from "js-yaml";

export interface BlogFrontmatter {
  slug: string;
  series?: string;
  seriesOrder?: number;
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

export interface SeriesInfo {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  updateFrequency: string;
  updateFrequencyEn?: string;
  cover?: string;
  color?: string;
}

export interface ParsedBlogPost {
  frontmatter: BlogFrontmatter;
  content: string;
  slug: string;
  locale: string;
}

function getContentDir(): string {
  const cwd = process.cwd();
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
    const { data, content } = matter(raw);

    return {
      frontmatter: data as BlogFrontmatter,
      content,
      slug: data.slug || path.basename(path.dirname(filePath)),
      locale: path.basename(filePath).includes(".en.") ? "en" : "zh",
    };
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      console.error(`[Blog] Error parsing ${filePath}:`, error);
    }
    return null;
  }
}

/**
 * Get all published blog posts for a locale
 */
export async function getBlogPosts(
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

        let post = await parseBlogFile(mdPath);

        if (!post && locale !== "zh") {
          const fallbackPath = path.join(contentDir, slug, `index.zh.md`);
          post = await parseBlogFile(fallbackPath);
        }

        if (post && post.frontmatter.status !== "draft") {
          posts.push(post);
        }
      }
    }

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
 */
export async function getBlogPostBySlug(
  slug: string,
  locale: string = "zh"
): Promise<ParsedBlogPost | null> {
  const contentDir = getContentDir();
  const filePath = path.join(contentDir, slug, `index.${locale}.md`);

  const post = await parseBlogFile(filePath);
  if (post) return post;

  if (locale !== "zh") {
    const fallbackPath = path.join(contentDir, slug, `index.zh.md`);
    return await parseBlogFile(fallbackPath);
  }

  return null;
}

/**
 * Get all available slugs for static generation
 */
export async function getAllBlogSlugs(): Promise<
  { slug: string; locale: string }[]
> {
  const slugs: { slug: string; locale: string }[] = [];
  const seenSlugs = new Set<string>();
  const contentDir = getContentDir();

  try {
    const entries = await fs.readdir(contentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const slug = entry.name;
        const slugDir = path.join(contentDir, slug);

        for (const locale of ["zh", "en"]) {
          const filePath = path.join(slugDir, `index.${locale}.md`);
          try {
            await fs.access(filePath);
            if (!seenSlugs.has(`${slug}-${locale}`)) {
              slugs.push({ slug, locale });
              seenSlugs.add(`${slug}-${locale}`);
            }
          } catch {}
        }
      }
    }
  } catch (error) {
    console.error("Error getting slugs:", error);
  }

  return slugs;
}

/**
 * Get all unique tags
 */
export async function getAllTags(locale: string = "zh"): Promise<string[]> {
  const posts = await getBlogPosts(locale);
  const tagSet = new Set<string>();

  for (const post of posts) {
    for (const tag of post.frontmatter.tags || []) {
      tagSet.add(tag);
    }
  }

  return Array.from(tagSet).sort();
}

/**
 * Get posts by tag
 */
export async function getPostsByTag(
  tag: string,
  locale: string = "zh"
): Promise<ParsedBlogPost[]> {
  const posts = await getBlogPosts(locale);
  return posts.filter((post) => post.frontmatter.tags?.includes(tag));
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(
  category: string,
  locale: string = "zh"
): Promise<ParsedBlogPost[]> {
  const posts = await getBlogPosts(locale);
  return posts.filter((post) => post.frontmatter.category === category);
}

/**
 * Get all unique categories
 */
export async function getAllCategories(locale: string = "zh"): Promise<string[]> {
  const posts = await getBlogPosts(locale);
  const categorySet = new Set<string>();

  for (const post of posts) {
    categorySet.add(post.frontmatter.category);
  }

  return Array.from(categorySet).sort();
}

/**
 * Get related posts by shared tags
 */
export async function getRelatedPosts(
  slug: string,
  locale: string = "zh",
  limit: number = 3
): Promise<ParsedBlogPost[]> {
  const target = await getBlogPostBySlug(slug, locale);
  if (!target) return [];

  const posts = await getBlogPosts(locale);
  const targetTags = new Set(target.frontmatter.tags || []);

  return posts
    .filter((post) => post.slug !== slug)
    .map((post) => ({
      post,
      score: (post.frontmatter.tags || []).filter((tag) =>
        targetTags.has(tag)
      ).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);
}

/**
 * Load series definitions from content/blog/series.yaml
 */
export async function getSeriesDefinitions(): Promise<SeriesInfo[]> {
  const seriesPath = path.join(getContentDir(), "series.yaml");

  try {
    const raw = await fs.readFile(seriesPath, "utf-8");
    const data = yaml.load(raw) as { series: SeriesInfo[] } | undefined;
    return data?.series || [];
  } catch (error) {
    console.error("Error reading series.yaml:", error);
    return [];
  }
}

/**
 * Get a single series by id
 */
export async function getSeriesById(id: string): Promise<SeriesInfo | null> {
  const series = await getSeriesDefinitions();
  return series.find((s) => s.id === id) || null;
}

/**
 * Get posts in a series, sorted by seriesOrder
 */
export async function getPostsBySeries(
  seriesId: string,
  locale: string = "zh"
): Promise<ParsedBlogPost[]> {
  const posts = await getBlogPosts(locale);
  return posts
    .filter((post) => post.frontmatter.series === seriesId)
    .sort((a, b) => (a.frontmatter.seriesOrder || 0) - (b.frontmatter.seriesOrder || 0));
}

/**
 * Get next/prev posts within a series
 */
export async function getSeriesNeighbors(
  slug: string,
  seriesId: string,
  locale: string = "zh"
): Promise<{ prev: ParsedBlogPost | null; next: ParsedBlogPost | null }> {
  const posts = await getPostsBySeries(seriesId, locale);
  const index = posts.findIndex((post) => post.slug === slug);

  return {
    prev: index > 0 ? posts[index - 1] : null,
    next: index >= 0 && index < posts.length - 1 ? posts[index + 1] : null,
  };
}

/**
 * Format date for display
 */
export function formatBlogDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Check if a cover image exists (for build-time validation)
 */
export function coverExists(coverPath: string): boolean {
  if (!coverPath) return false;
  const fullPath = path.join(process.cwd(), "public", coverPath);
  return fsSync.existsSync(fullPath);
}
