import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import ToolCard from "@/components/tools/ToolCard";
import ToolInteractionBar from "@/components/tools/ToolInteractionBar";
import { fetchToolById, fetchRelatedTools } from "@/lib/tools";

const i18n = {
  zh: {
    backToTools: "返回工具库",
    quickStart: "快速开始",
    integration: "集成指南",
    links: "相关链接",
    officialWebsite: "官方网站",
    documentation: "文档",
    related: "相关工具",
    views: "浏览",
    likes: "点赞",
    cardAuthor: "作者",
  },
  en: {
    backToTools: "Back to Tools",
    quickStart: "Quick Start",
    integration: "Integration Guide",
    links: "Links",
    officialWebsite: "Official Website",
    documentation: "Documentation",
    related: "Related Tools",
    views: "Views",
    likes: "Likes",
    cardAuthor: "Author",
  },
} as const;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function ToolDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const t = i18n[locale as keyof typeof i18n] || i18n.zh;

  const tool = await fetchToolById(slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = await fetchRelatedTools(slug, tool.category);

  return (
    <PageShell>
      <div className="mb-6">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
        >
          <ChevronLeft className="h-4 w-4" />
          {t.backToTools}
        </Link>
      </div>

      <article className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface-strong)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
              {tool.category}
            </span>
            {tool.tags
              .filter((tag) => tag !== tool.category)
              .slice(0, 4)
              .map((tag) => (
                <span
                  key={tag}
                  className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]"
                >
                  {tag}
                </span>
              ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {tool.title}
          </h1>

          {tool.description && (
            <p className="mt-4 text-lg text-[var(--color-text-secondary)]">
              {tool.description}
            </p>
          )}

          <ToolInteractionBar
            toolId={tool.id}
            initialLikeCount={tool.likeCount}
            initialViewCount={tool.viewCount}
            locale={locale}
          />
        </header>

        {/* Quick Start */}
        {tool.quickStart && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
              {t.quickStart}
            </h2>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
              <MarkdownRenderer content={tool.quickStart} />
            </div>
          </section>
        )}

        {/* Integration Guide */}
        {tool.integrationGuide && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
              {t.integration}
            </h2>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
              <MarkdownRenderer content={tool.integrationGuide} />
            </div>
          </section>
        )}

        {/* External Links */}
        {(tool.officialUrl || tool.docsUrl) && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
              {t.links}
            </h2>
            <div className="flex flex-wrap gap-4">
              {tool.officialUrl && (
                <a
                  href={tool.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t.officialWebsite}
                </a>
              )}
              {tool.docsUrl && (
                <a
                  href={tool.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t.documentation}
                </a>
              )}
            </div>
          </section>
        )}

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
              {t.related}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedTools.map((relatedTool) => (
                <ToolCard
                  key={relatedTool.id}
                  tool={relatedTool}
                  labels={{
                    author: t.cardAuthor,
                    views: t.views,
                    likes: t.likes,
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </article>
    </PageShell>
  );
}
