/**
 * Backward-compatible blog content layer
 * Re-exports the unified blog-data API.
 * New code should import directly from @/lib/blog-data.
 */

export {
  getBlogPosts as getBlogPostsFromFiles,
  getBlogPostBySlug as getBlogPostBySlugFromFiles,
  getAllBlogSlugs,
  formatBlogDate,
  getSeriesDefinitions,
  getSeriesById,
  getPostsBySeries,
  getSeriesNeighbors,
  getAllTags,
  getPostsByTag,
  getAllCategories,
  getPostsByCategory,
  getRelatedPosts,
  coverExists,
} from "@/lib/blog-data";

export type {
  BlogFrontmatter,
  SeriesInfo,
  ParsedBlogPost,
} from "@/lib/blog-data";
