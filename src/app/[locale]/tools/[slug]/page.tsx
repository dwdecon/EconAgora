import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ExternalLink, ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import PageShell from "@/components/layout/PageShell";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import ToolCard from "@/components/tools/ToolCard";
import ToolInteractionBar from "@/components/tools/ToolInteractionBar";
import ReadmeSection from "@/components/tools/ReadmeSection";
import ReadmeToc from "@/components/tools/ReadmeToc";
import ToolMetaCard from "@/components/tools/ToolMetaCard";
import { fetchToolById, fetchRelatedTools } from "@/lib/tools";
import { extractToc } from "@/lib/readme";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ToolDetailPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const resolvedSearchParams = await searchParams;
  const expandParam = resolvedSearchParams.expand;
  const isExpanded = Array.isArray(expandParam) ? expandParam[0] === "1" : expandParam === "1";

  const expandSp = new URLSearchParams();
  const collapseSp = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((v) => expandSp.append(key, v));
        value.forEach((v) => collapseSp.append(key, v));
      } else {
        expandSp.set(key, value);
        collapseSp.set(key, value);
      }
    }
  }
  expandSp.set("expand", "1");
  collapseSp.delete("expand");
  const expandHref = `?${expandSp.toString()}`;
  const collapseHref = collapseSp.toString() ? `?${collapseSp.toString()}` : "";

  const t = await getTranslations("tools.detail");
  const cardT = await getTranslations("tools.card");

  const tool = await fetchToolById(slug);
  if (!tool) notFound();

  const relatedTools = await fetchRelatedTools(slug, tool.category);

  const tocItems = tool.readmeContent ? extractToc(tool.readmeContent) : [];
  const hasReadme = !!tool.readmeContent;
  const hasQuickStart = !!tool.quickStart;
  const hasIntegration = !!tool.integrationGuide;

  const metaLabels = {
    about: t("about"),
    author: t("author"),
    published: t("published"),
    category: t("category"),
    links: t("links"),
    officialWebsite: t("officialWebsite"),
    documentation: t("documentation"),
  };

  return (
    <PageShell>
      <div className="mb-6">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("backToTools")}
        </Link>
      </div>

      <article>
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface-strong)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
              {tool.category}
            </span>
            {(tool.tags || [])
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

          <div className="lg:hidden mb-4">
            <ToolMetaCard
              author={tool.author}
              createdAt={tool.createdAt}
              category={tool.category}
              officialUrl={tool.officialUrl}
              docsUrl={tool.docsUrl}
              locale={locale}
              labels={metaLabels}
              layout="horizontal"
            />
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {tool.title}
          </h1>

          {tool.description && (
            <p className="mt-4 text-lg text-[var(--color-text-secondary)]">
              {tool.description}
            </p>
          )}

          <div className="xl:hidden">
            <ToolInteractionBar
              toolId={tool.id}
              initialLikeCount={tool.likeCount}
              initialViewCount={tool.viewCount}
              locale={locale}
            />
          </div>
        </header>

        <div className="flex gap-6 xl:gap-8">
          {tocItems.length > 0 && (
            <aside className="hidden lg:block flex-shrink-0 w-[130px] xl:w-[150px]">
              <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto toc-scroll">
                <ReadmeToc items={tocItems} label={t("toc")} />
              </div>
            </aside>
          )}

          <div className="flex-1 min-w-0">
            {hasReadme ? (
              <ReadmeSection
                content={tool.readmeContent!}
                isExpanded={isExpanded}
                readmeLabel={t("readmeLabel")}
                expandLabel={t("expand")}
                collapseLabel={t("collapse")}
                tocItems={tocItems}
                expandHref={expandHref}
                collapseHref={collapseHref}
              />
            ) : hasQuickStart ? (
              <section className="mb-12">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                  {t("quickStart")}
                </h2>
                <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
                  <MarkdownRenderer content={tool.quickStart!} />
                </div>
              </section>
            ) : hasIntegration ? (
              <section className="mb-12">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                  {t("integration")}
                </h2>
                <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
                  <MarkdownRenderer content={tool.integrationGuide!} />
                </div>
              </section>
            ) : (
              <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center">
                <p className="text-[var(--color-text-secondary)]">{t("noGuide")}</p>
                {tool.officialUrl && (
                  <a
                    href={tool.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {metaLabels.officialWebsite}
                  </a>
                )}
              </div>
            )}

            <div className="hidden lg:block xl:hidden mt-8">
              <ToolMetaCard
                author={tool.author}
                createdAt={tool.createdAt}
                category={tool.category}
                officialUrl={tool.officialUrl}
                docsUrl={tool.docsUrl}
                locale={locale}
                labels={metaLabels}
                layout="horizontal"
              />
            </div>
          </div>

          <aside className="hidden xl:block flex-shrink-0 w-[200px]">
            <div className="sticky top-24 space-y-4">
              <ToolMetaCard
                author={tool.author}
                createdAt={tool.createdAt}
                category={tool.category}
                officialUrl={tool.officialUrl}
                docsUrl={tool.docsUrl}
                locale={locale}
                labels={metaLabels}
              />
              <ToolInteractionBar
                toolId={tool.id}
                initialLikeCount={tool.likeCount}
                initialViewCount={tool.viewCount}
                locale={locale}
              />
            </div>
          </aside>
        </div>

        {relatedTools.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
              {t("related")}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedTools.map((relatedTool) => (
                <ToolCard
                  key={relatedTool.id}
                  tool={relatedTool}
                  labels={{
                    author: cardT("author"),
                    views: cardT("views"),
                    likes: cardT("likes"),
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
