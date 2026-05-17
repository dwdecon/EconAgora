import { Link } from "@/i18n/navigation";
import type { LocalizedBlogEntry } from "@/lib/blog";
import BlogCoverIllustration from "@/components/blog/BlogCoverIllustration";

export default function BlogBookCard({
  article,
  compact = false,
  heightClass = "min-h-[390px]",
}: {
  article: LocalizedBlogEntry;
  compact?: boolean;
  heightClass?: string;
}) {
  const coverStyle = {
    backgroundColor: article.theme.coverStart,
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(article.publishedAt));

  if (compact) {
    return (
      <Link href={`/blog/${article.slug}`} className="group block h-full">
        <article className="relative flex h-full flex-col overflow-hidden rounded-[24px] border border-gray-100/50 bg-[#fbfaf6] text-gray-800 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)]">
          <div
            className="relative h-[180px] w-full shrink-0 overflow-hidden"
            style={coverStyle}
          >
            <div className="absolute inset-[12px] rounded-[22px] border border-black/8" />

            {article.coverImage ? (
              <img
                src={article.coverImage}
                alt={article.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <BlogCoverIllustration
                variant={article.illustration}
                accentColor={article.theme.accent}
                compact
              />
            )}
          </div>

          <div className="flex flex-1 flex-col items-start gap-3 p-5 text-left sm:p-6">
            <div className="flex items-center gap-2 text-[11px] font-light tracking-wide text-gray-500">
              <span>{formattedDate}</span>
              <span>/</span>
              <span>{article.category}</span>
            </div>

            <h3 className="mb-1 mt-1 line-clamp-2 text-[16px] font-bold leading-[1.35] tracking-tight text-gray-950 sm:text-[18px]">
              {article.title}
            </h3>

            <p className="line-clamp-2 pr-2 text-[13px] font-light leading-relaxed text-gray-700 sm:text-[14px]">
              {article.excerpt}
            </p>

            <div className="mt-auto flex w-full items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-[12px] font-medium text-gray-700 transition-colors group-hover:text-gray-950">
                Read more
              </span>
              <span className="text-[11px] text-gray-500">{article.author.name}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${article.slug}`} className="group block h-full">
      <article
        className={`relative flex h-full flex-col overflow-hidden rounded-[28px] border border-gray-100/50 bg-[#fbfaf6] text-gray-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.15)] ${heightClass}`}
      >
        <div
          className="relative h-[200px] w-full shrink-0 overflow-hidden sm:h-[220px]"
          style={coverStyle}
        >
          <div className="absolute inset-[14px] rounded-[24px] border border-black/8" />

          {article.coverImage ? (
            <img
              src={article.coverImage}
              alt={article.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <BlogCoverIllustration
              variant={article.illustration}
              accentColor={article.theme.accent}
            />
          )}
        </div>

        <div className="flex flex-1 flex-col items-start gap-4 p-6 text-left sm:p-8">
          <div className="flex items-center gap-2 text-[12px] font-light tracking-wide text-gray-500">
            <span>{formattedDate}</span>
            <span>/</span>
            <span>{article.readTime}</span>
          </div>

          <h3 className="mb-1 mt-1 line-clamp-2 text-[20px] font-bold leading-[1.3] tracking-tight text-gray-950 sm:text-[22px]">
            {article.title}
          </h3>

          <p className="line-clamp-3 pr-2 text-[14px] font-light leading-relaxed text-gray-700">
            {article.excerpt}
          </p>

          <div className="mt-auto flex w-full items-center justify-between pt-2">
            <span className="inline-flex items-center border-b-2 border-transparent pb-0.5 text-[13px] font-semibold text-gray-950 transition-colors group-hover:border-gray-950">
              Read more
              <span className="ml-1 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">
                {"->"}
              </span>
            </span>
            <span className="text-[12px] font-medium text-gray-500">{article.author.name}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
