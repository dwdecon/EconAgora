import { ExternalLink } from "lucide-react";

interface ToolMetaCardProps {
  author: { id: string; name: string; avatar: string | null };
  createdAt: string;
  category: string;
  officialUrl: string | null;
  docsUrl: string | null;
  locale: string;
  labels: {
    about: string;
    author: string;
    published: string;
    category: string;
    links: string;
    officialWebsite: string;
    documentation: string;
  };
  layout?: "vertical" | "horizontal";
}

export default function ToolMetaCard({
  author,
  createdAt,
  category,
  officialUrl,
  docsUrl,
  locale,
  labels,
  layout = "vertical",
}: ToolMetaCardProps) {
  const date = new Date(createdAt).toLocaleDateString(
    locale === "en" ? "en-US" : "zh-CN"
  );

  const isHorizontal = layout === "horizontal";
  const authorName = author?.name ?? "—";

  return (
    <div className={isHorizontal ? "rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5" : "space-y-4"}>
      {!isHorizontal && (
        <div className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-4">
            {labels.about}
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">{labels.author}</span>
              <span className="text-[var(--color-text-primary)]">{authorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">{labels.published}</span>
              <span className="text-[var(--color-text-primary)]">{date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">{labels.category}</span>
              <span className="text-[var(--color-text-primary)]">{category}</span>
            </div>
          </div>
        </div>
      )}

      {isHorizontal && (
        <div className="flex flex-wrap gap-x-6 gap-y-4 items-start">
        <h3 className="w-full text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
          {labels.about}
        </h3>
        <div className="text-sm">
          <div className="text-[var(--color-text-secondary)] text-xs mb-0.5">{labels.author}</div>
          <div className="text-[var(--color-text-primary)]">{authorName}</div>
        </div>
        <div className="text-sm">
          <div className="text-[var(--color-text-secondary)] text-xs mb-0.5">{labels.published}</div>
          <div className="text-[var(--color-text-primary)]">{date}</div>
        </div>
        <div className="text-sm">
          <div className="text-[var(--color-text-secondary)] text-xs mb-0.5">{labels.category}</div>
          <div className="text-[var(--color-text-primary)]">{category}</div>
        </div>
        {(officialUrl || docsUrl) && (
          <div className="ml-auto flex flex-col gap-1.5 text-sm">
            {officialUrl && (
              <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                {labels.officialWebsite}
              </a>
            )}
            {docsUrl && (
              <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                {labels.documentation}
              </a>
            )}
          </div>
        )}
      </div>
      )}

      {!isHorizontal && (officialUrl || docsUrl) && (
        <div className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-4">
            {labels.links}
          </h3>
          <div className="space-y-2">
            {officialUrl && (
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                {labels.officialWebsite}
              </a>
            )}
            {docsUrl && (
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                {labels.documentation}
              </a>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
