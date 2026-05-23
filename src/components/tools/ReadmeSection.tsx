import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import MarkdownErrorBoundary from "@/components/tools/MarkdownErrorBoundary";
import { generateSummary, TocItem } from "@/lib/readme";

interface ReadmeSectionProps {
  content: string;
  isExpanded: boolean;
  readmeLabel: string;
  expandLabel: string;
  collapseLabel: string;
  tocItems: TocItem[];
  expandHref: string;
  collapseHref: string;
}

export default function ReadmeSection({
  content,
  isExpanded,
  readmeLabel,
  expandLabel,
  collapseLabel,
  tocItems,
  expandHref,
  collapseHref,
}: ReadmeSectionProps) {
  const summaryResult = generateSummary(content);
  const isTruncated = summaryResult.isTruncated;
  const displayContent = isExpanded || !isTruncated ? content : summaryResult.summary;
  const showExpandButton = isTruncated && !isExpanded;
  const showCollapseButton = isExpanded && isTruncated;

  return (
    <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 md:p-8">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-6">
        {readmeLabel}
      </h2>

      <div className="relative">
        <MarkdownErrorBoundary fallback={<pre className="whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">{displayContent}</pre>}>
          <MarkdownRenderer content={displayContent} tocItems={tocItems} />
        </MarkdownErrorBoundary>

        {showExpandButton && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--color-bg-card)] to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-2">
              <a
                href={expandHref}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {expandLabel} ↓
              </a>
            </div>
          </>
        )}
      </div>

      {showCollapseButton && (
        <div className="flex justify-center mt-6 pt-4 border-t border-[var(--color-border)]">
          <a
            href={collapseHref}
            className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            {collapseLabel} ↑
          </a>
        </div>
      )}
    </div>
  );
}
