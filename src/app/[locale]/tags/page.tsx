import { Link } from "@/i18n/navigation";
import PageShell from "@/components/layout/PageShell";
import Reveal from "@/components/shared/Reveal";
import { getAllTags, getBlogPosts } from "@/lib/blog-data";

const copy = {
  zh: {
    label: "Tags",
    title: "标签索引",
    description:
      "按主题、工具、方法浏览 Blog 文章。点击标签查看所有相关文章。",
  },
  en: {
    label: "Tags",
    title: "Tag Index",
    description:
      "Browse blog articles by topic, tool, or method. Click a tag to see all related articles.",
  },
} as const;

export default async function TagsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = locale === "en" ? copy.en : copy.zh;

  const [tags, posts] = await Promise.all([
    getAllTags(locale),
    getBlogPosts(locale),
  ]);

  // Count posts per tag
  const tagCounts = new Map<string, number>();
  for (const tag of tags) {
    tagCounts.set(tag, 0);
  }
  for (const post of posts) {
    for (const tag of post.frontmatter.tags || []) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  const sortedTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <PageShell className="pb-20">
      {/* Hero */}
      <Reveal threshold={0.12}>
        <section className="relative overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-8 py-16 md:px-12 md:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary)_0%,transparent_34%),radial-gradient(circle_at_bottom_left,rgba(217,199,162,0.35),transparent_42%)] opacity-[0.03]" />
          <div className="relative max-w-[720px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
              {t.label}
            </p>
            <h1 className="mt-6 text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--color-text-primary)] md:text-[56px]">
              {t.title}
            </h1>
            <p className="mt-6 max-w-[560px] text-[17px] leading-[1.78] text-[var(--color-text-secondary)]">
              {t.description}
            </p>
          </div>
        </section>
      </Reveal>

      {/* Tag Cloud */}
      <section className="mt-16">
        <div className="flex flex-wrap gap-3">
          {sortedTags.map(([tag, count], index) => (
            <Reveal key={tag} delay={Math.min(index * 30, 300)} threshold={0.12}>
              <Link
                href={`/tags/${encodeURIComponent(tag)}`}
                className="group inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2 text-[14px] text-[var(--color-text-secondary)] transition-all duration-300 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
              >
                <span className="font-medium">{tag}</span>
                <span className="rounded-full bg-[var(--color-bg-surface)] px-2 py-0.5 text-[11px] group-hover:bg-white/20">
                  {count}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
