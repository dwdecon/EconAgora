/**
 * CloudBase 文档数据库访问层
 * 提供博客数据的增删改查接口
 */

import cloudbase from "@cloudbase/js-sdk";

// 初始化 CloudBase
const app = cloudbase.init({
  env: "agora-8glrfnss7758021c",
});

const db = app.database();
const collection = db.collection("blog_posts");

// 博客数据类型（与数据库结构一致）
export interface BlogPostDB {
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

// 前端使用的博客类型（单语言）
export interface BlogPostFrontend {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover: string;
  category: string;
  date: string;
  readTime: string;
  tags: string[];
  author: string;
  authorRole: string;
  issue: string;
  status: "published" | "draft" | "archived";
  viewCount: number;
  likeCount: number;
}

/**
 * 将数据库记录转换为前端格式
 */
function toFrontend(post: BlogPostDB, locale: string): BlogPostFrontend {
  return {
    slug: post.slug,
    title: post.title[locale as "zh" | "en"] || post.title.zh,
    excerpt: post.excerpt[locale as "zh" | "en"] || post.excerpt.zh,
    content: post.content[locale as "zh" | "en"] || post.content.zh,
    cover: post.cover,
    category: post.category,
    date: post.date,
    readTime: post.readTime,
    tags: post.tags,
    author: post.author,
    authorRole: post.authorRole,
    issue: post.issue,
    status: post.status,
    viewCount: post.viewCount,
    likeCount: post.likeCount,
  };
}

/**
 * 获取所有已发布的博客文章
 */
export async function getBlogPostsFromDB(
  locale: string = "zh"
): Promise<BlogPostFrontend[]> {
  try {
    const { data } = await collection
      .where({ status: "published" })
      .orderBy("date", "desc")
      .get();

    return data.map((doc: any) => toFrontend(doc as BlogPostDB, locale));
  } catch (error) {
    console.error("[BlogDB] Error fetching posts:", error);
    return [];
  }
}

/**
 * 根据 slug 获取单篇博客
 */
export async function getBlogPostBySlugFromDB(
  slug: string,
  locale: string = "zh"
): Promise<BlogPostFrontend | null> {
  try {
    const { data } = await collection.doc(slug).get();

    if (!data || data.length === 0) return null;

    return toFrontend(data[0] as BlogPostDB, locale);
  } catch (error) {
    console.error(`[BlogDB] Error fetching post ${slug}:`, error);
    return null;
  }
}

/**
 * 获取所有博客 slug（用于静态生成）
 */
export async function getAllBlogSlugsFromDB(): Promise<
  { slug: string; locale: string }[]
> {
  try {
    const { data } = await collection
      .where({ status: "published" })
      .field({ _id: true, slug: true })
      .get();

    const slugs: { slug: string; locale: string }[] = [];

    for (const doc of data) {
      // 为每种语言生成一个条目
      slugs.push({ slug: doc.slug, locale: "zh" });
      slugs.push({ slug: doc.slug, locale: "en" });
    }

    return slugs;
  } catch (error) {
    console.error("[BlogDB] Error fetching slugs:", error);
    return [];
  }
}

/**
 * 增加浏览次数
 */
export async function incrementViewCount(slug: string): Promise<void> {
  try {
    await collection.doc(slug).update({
      viewCount: db.command.inc(1),
    });
  } catch (error) {
    console.error(`[BlogDB] Error incrementing view count for ${slug}:`, error);
  }
}

/**
 * 增加点赞次数
 */
export async function incrementLikeCount(slug: string): Promise<void> {
  try {
    await collection.doc(slug).update({
      likeCount: db.command.inc(1),
    });
  } catch (error) {
    console.error(`[BlogDB] Error incrementing like count for ${slug}:`, error);
  }
}

/**
 * 根据分类获取相关文章
 */
export async function getRelatedPostsFromDB(
  currentSlug: string,
  category: string,
  locale: string = "zh",
  limit: number = 3
): Promise<BlogPostFrontend[]> {
  try {
    const { data } = await collection
      .where({
        status: "published",
        category,
        slug: db.command.neq(currentSlug),
      })
      .orderBy("date", "desc")
      .limit(limit)
      .get();

    return data.map((doc: any) => toFrontend(doc as BlogPostDB, locale));
  } catch (error) {
    console.error("[BlogDB] Error fetching related posts:", error);
    return [];
  }
}
