import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import Reveal from "@/components/shared/Reveal";
import { getSeriesDefinitions } from "@/lib/blog-data";

const copy = {
  zh: {
    label: "Series",
    title: "专栏与系列",
    description:
      "EconAgora 的内容按研究主题组织为三个主线：AI 科研最佳实践、论文项目、最新新闻与研究动态。每个系列都是可追踪、可复用的知识资产。",
    allArticles: "全部文章",
    articleCount: "篇文章",
  },
  en: {
    label: "Series",
    title: "Columns & Series",
    description:
      "EconAgora content is organized into three main tracks: AI research best practices, paper projects, and latest research news. Each series is a traceable, reusable knowledge asset.",
    allArticles: "All articles",
    articleCount: "articles",
  },
} as const;

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = locale === "en" ? copy.en : copy.zh;
  const isEn = locale === "en";

  const series = await getSeriesDefinitions();

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

      {/* Series Grid */}
      <section className="mt-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {series.map((s, index) => (
            <Reveal key={s.id} delay={Math.min(index * 80, 400)} threshold={0.12}>
              <Link
                href={`/series/${s.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg-card)] transition-all duration-300 hover:border-[var(--color-border-hover)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
              >
                <div
                  className="h-40 w-full"
                  style={{
                    background: s.color
                      ? `linear-gradient(135deg, ${s.color}22 0%, ${s.color}08 100%)`
                      : "var(--color-bg-surface)",
                  }}
                >
                  {s.cover && (
                    <img
                      src={s.cover}
                      alt={isEn ? s.nameEn || s.name : s.name}
                      className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--color-text-primary)] transition group-hover:text-[var(--color-primary)]">
                    {isEn ? s.nameEn || s.name : s.name}
                  </h2>
                  <p className="mt-3 flex-1 text-[15px] leading-[1.65] text-[var(--color-text-secondary)]">
                    {isEn ? s.descriptionEn || s.description : s.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-[13px] text-[var(--color-text-muted)]">
                      {isEn ? s.updateFrequencyEn || s.updateFrequency : s.updateFrequency}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[14px] font-medium text-[var(--color-primary)] transition group-hover:gap-2">
                      {t.allArticles}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
