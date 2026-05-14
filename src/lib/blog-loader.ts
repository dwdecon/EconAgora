import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type BlogFrontmatter = {
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
  illustration: string;
  cover?: string;
  source?: string;
};

export type BlogEntry = BlogFrontmatter & {
  content: string;
  locale: string;
};

const BLOG_DIR = path.join(process.cwd(), "content/blog");

/**
 * Load all blog entries for a given locale
 */
export function loadBlogEntries(locale: string = "zh"): BlogEntry[] {
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }

  const entries: BlogEntry[] = [];
  const slugs = fs.readdirSync(BLOG_DIR);

  for (const slug of slugs) {
    const entryDir = path.join(BLOG_DIR, slug);
    const mdPath = path.join(entryDir, `index.${locale}.md`);

    if (!fs.existsSync(mdPath)) {
      continue;
    }

    const fileContent = fs.readFileSync(mdPath, "utf-8");
    const { data, content } = matter(fileContent);

    entries.push({
      ...(data as BlogFrontmatter),
      content,
      locale,
    });
  }

  // Sort by date descending
  return entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Load a single blog entry by slug
 */
export function loadBlogEntryBySlug(
  slug: string,
  locale: string = "zh"
): BlogEntry | null {
  const mdPath = path.join(BLOG_DIR, slug, `index.${locale}.md`);

  if (!fs.existsSync(mdPath)) {
    return null;
  }

  const fileContent = fs.readFileSync(mdPath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    ...(data as BlogFrontmatter),
    content,
    locale,
  };
}

/**
 * Get related blog entries (excluding the given slug)
 */
export function getRelatedBlogEntries(
  slug: string,
  locale: string = "zh",
  limit: number = 3
): BlogEntry[] {
  return loadBlogEntries(locale)
    .filter((entry) => entry.slug !== slug)
    .slice(0, limit);
}

/**
 * Format blog date for display
 */
export function formatBlogDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Get all unique tags across all entries
 */
export function getAllTags(locale: string = "zh"): string[] {
  const entries = loadBlogEntries(locale);
  const tagSet = new Set<string>();

  for (const entry of entries) {
    for (const tag of entry.tags) {
      tagSet.add(tag);
    }
  }

  return Array.from(tagSet).sort();
}

/**
 * Get entries by tag
 */
export function getEntriesByTag(
  tag: string,
  locale: string = "zh"
): BlogEntry[] {
  return loadBlogEntries(locale).filter((entry) => entry.tags.includes(tag));
}
