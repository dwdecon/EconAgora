import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "@/components/shared/CodeBlock";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const OUTER_MARKDOWN_FENCE = /^\s*```(?:markdown|md)\s*\n([\s\S]*?)\n?```\s*$/i;
const SAFE_SINGLE_LINE_UNWRAP_LANGUAGES = new Set([
  "markdown",
  "md",
  "r",
  "python",
  "py",
  "stata",
  "julia",
  "latex",
  "tex",
  "sql",
  "text",
  "plaintext",
]);

function normaliseMarkdownContent(content: string) {
  const withUnixNewlines = content.replace(/\r\n?/g, "\n").replace(/\\n/g, "\n");
  const wrappedMarkdown = withUnixNewlines.match(OUTER_MARKDOWN_FENCE);

  return wrappedMarkdown ? wrappedMarkdown[1] : withUnixNewlines;
}

function getCodeLanguage(className?: string) {
  return className?.match(/language-([\w-]+)/)?.[1]?.toLowerCase();
}

function unwrapAccidentalCodeBackticks(value: string, language?: string) {
  const hasTrailingNewline = value.endsWith("\n");
  const withoutTrailingNewline = hasTrailingNewline ? value.slice(0, -1) : value;

  if (
    withoutTrailingNewline.length < 2 ||
    !withoutTrailingNewline.startsWith("`") ||
    !withoutTrailingNewline.endsWith("`")
  ) {
    return value;
  }

  const inner = withoutTrailingNewline.slice(1, -1);

  if (!inner || inner.includes("`")) {
    return value;
  }

  if (inner.includes("\n")) {
    return hasTrailingNewline ? `${inner}\n` : inner;
  }

  if (language && !SAFE_SINGLE_LINE_UNWRAP_LANGUAGES.has(language)) {
    return value;
  }

  if (!/[#()[\]{}<>=,\s]/.test(inner)) {
    return value;
  }

  return hasTrailingNewline ? `${inner}\n` : inner;
}

function sanitiseCodeChildren(children: unknown, language?: string): unknown {
  if (typeof children === "string") {
    return unwrapAccidentalCodeBackticks(children, language);
  }

  if (Array.isArray(children)) {
    return children.map((child) => sanitiseCodeChildren(child, language));
  }

  return children;
}

export default function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  const normalised = normaliseMarkdownContent(content);

  return (
    <div className={`markdown-content prose dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-8 mb-4 text-[var(--color-text-primary)]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-6 mb-3 text-[var(--color-text-primary)]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium mt-4 mb-2 text-[var(--color-text-primary)]">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-3 leading-7 text-[var(--color-text-secondary)]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-3 space-y-1 text-[var(--color-text-secondary)]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-3 space-y-1 text-[var(--color-text-secondary)]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-7">{children}</li>
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            void node;
            const language = getCodeLanguage(className);
            const cleanedChildren = sanitiseCodeChildren(children, language);
            const hasNewLines = String(cleanedChildren).includes("\n");
            const isInline = inline !== undefined ? inline : !className && !hasNewLines;

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 mx-0.5 rounded-md bg-[var(--color-bg-surface-strong)] border border-[var(--color-border)] text-[#eb5757] dark:text-[#ff6b6b] font-mono text-[0.85em] break-words"
                  {...props}
                >
                  {cleanedChildren}
                </code>
              );
            }

            return (
              <code
                className={`font-mono text-[13px] text-[var(--color-text-primary)] whitespace-pre-wrap break-words ${className ?? ""}`.trim()}
                {...props}
              >
                {cleanedChildren}
              </code>
            );
          },
          pre: ({ children }) => {
            return (
              <div className="not-prose">
                <CodeBlock>{children}</CodeBlock>
              </div>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 my-4 italic text-[var(--color-text-secondary)]">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {normalised}
      </ReactMarkdown>
    </div>
  );
}
