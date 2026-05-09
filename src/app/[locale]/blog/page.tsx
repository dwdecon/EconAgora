import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import PageShell from "@/components/layout/PageShell";
import Reveal from "@/components/shared/Reveal";
import BlogBookCard from "@/components/blog/BlogBookCard";
import BlogHeroCarousel from "@/components/blog/BlogHeroCarousel";
import { formatBlogDate, getBlogEntries } from "@/lib/blog";

const copy = {
  zh: {
    label: "Blog",
    title: "经济学与 AI 的技术专栏",
    description:
      "像翻书一样浏览研究工作流、复现工程、因果推断审计和 agent 系统设计。这里不做碎片化资讯，而是沉淀可反复回看的方法笔记。",
    leadLabel: "Lead Essay",
    leadTitle: "主编选读",
    leadDescription:
      "每一卷都围绕经济学研究中的一个高频技术问题展开，强调可执行方法、系统边界和真实工作台上的落地细节。",
    shelfLabel: "Column Shelf",
    shelfTitle: "专题书架",
    shelfDescription:
      "一本书对应一篇专栏长文。你可以从任意书脊抽出一本，进入完整文章。",
    indexTitle: "本季索引",
    indexDescription:
      "我们把重点放在研究过程中最容易被忽略、但最影响产出的那一层：结构、治理、审计和记忆。",
    cta: "阅读本期主文",
  },
  en: {
    label: "Blog",
    title: "Technical Notes on Economics x AI",
    description:
      "Browse research workflow design, replication engineering, causal audit, and agent architecture the way you would browse a shelf of editorial volumes.",
    leadLabel: "Lead Essay",
    leadTitle: "Editor's Pick",
    leadDescription:
      "Each volume focuses on one recurring technical problem in economics research, with emphasis on operating detail rather than surface-level commentary.",
    shelfLabel: "Column Shelf",
    shelfTitle: "Bookshelf Index",
    shelfDescription:
      "Each book stands for one long-form column. Pull any spine and continue into the full essay.",
    indexTitle: "This Season's Index",
    indexDescription:
      "The shelf is curated around the layers researchers underestimate most: structure, governance, auditability, and memory.",
    cta: "Read the lead essay",
  },
} as const;

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = locale === "en" ? copy.en : copy.zh;
  const entries = getBlogEntries(locale);
  const [featured, ...shelfEntries] = entries;
  const categories = Array.from(new Set(entries.map((entry) => entry.category)));

  return (
    <PageShell className="pb-20">
      <Reveal threshold={0.12}>
        <section className="relative overflow-hidden rounded-[36px] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-7 py-10 shadow-[var(--shadow-focus)] md:px-10 md:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary)_0%,transparent_34%),radial-gradient(circle_at_bottom_left,rgba(217,199,162,0.35),transparent_42%)] opacity-[0.03]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
            <div className="max-w-[640px]">
              <p className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)] backdrop-blur-sm">
                {t.label}
              </p>
              <h1 className="mt-6 max-w-[12ch] text-[44px] font-bold leading-[0.95] tracking-[-0.06em] text-[var(--color-text-primary)] md:text-[64px]">
                {t.title}
              </h1>
              <p className="mt-6 max-w-[54ch] text-[17px] leading-[1.78] text-[var(--color-text-secondary)]">
                {t.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-text-secondary)]"
                  >
                    {category}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-5">
                <Link
                  href={`/blog/${featured.slug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-[14px] font-medium text-[var(--color-bg)] shadow-[var(--shadow-inset-button)] transition-opacity hover:opacity-85"
                >
                  {t.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="text-[13px] leading-6 text-[var(--color-text-secondary)]">
                  <p>{formatBlogDate(featured.publishedAt, locale)}</p>
                  <p>{featured.readTime}</p>
                </div>
              </div>
            </div>

            <div className="lg:pl-6 py-4">
              <BlogHeroCarousel entries={entries} interval={4000} />
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={80} threshold={0.12}>
        <section className="mt-14 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 md:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
              {t.leadTitle}
            </p>
            <h2 className="mt-4 text-[30px] font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--color-text-primary)]">
              {featured.title}
            </h2>
            <p className="mt-5 text-[15px] leading-7 text-[var(--color-text-secondary)]">
              {featured.lead}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {featured.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-4"
                >
                  <p className="text-[22px] font-semibold tracking-[-0.04em] text-[var(--color-text-primary)]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-[var(--color-text-secondary)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 md:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
              {t.indexTitle}
            </p>
            <p className="mt-4 max-w-[48ch] text-[15px] leading-7 text-[var(--color-text-secondary)]">
              {t.indexDescription}
            </p>
            <div className="mt-8 space-y-3">
              {featured.shelfIndex.map((item, index) => (
                <div
                  key={item}
                  className="flex gap-4 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-4"
                >
                  <span className="mt-0.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[14px] leading-6 text-[var(--color-text-secondary)]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <section className="mt-20">
        <Reveal delay={120} threshold={0.12}>
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                {t.shelfLabel}
              </p>
              <h2 className="mt-3 text-[36px] font-semibold leading-[0.98] tracking-[-0.05em] text-[var(--color-text-primary)]">
                {t.shelfTitle}
              </h2>
            </div>
            <p className="max-w-[48ch] text-[15px] leading-7 text-[var(--color-text-secondary)]">
              {t.shelfDescription}
            </p>
          </div>
        </Reveal>

        <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shelfEntries.map((entry, index) => (
            <Reveal
              key={entry.slug}
              delay={160 + index * 70}
              threshold={0.12}
              className="h-full"
            >
              <BlogBookCard article={entry} />
            </Reveal>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
