"use client";

import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import "highlight.js/styles/base16/github.css";

interface BlogPostContentProps {
  content: string;
}

export default function BlogPostContent({ content }: BlogPostContentProps) {
  useEffect(() => {
    // Add copy buttons to code blocks
    const codeBlocks = document.querySelectorAll("pre");
    codeBlocks.forEach((block) => {
      if (block.querySelector(".copy-button")) return;

      const button = document.createElement("button");
      button.className = "copy-button";
      button.textContent = "复制";
      button.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        padding: 4px 12px;
        font-size: 12px;
        color: #888;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 6px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
      `;

      block.style.position = "relative";
      block.appendChild(button);

      block.addEventListener("mouseenter", () => {
        button.style.opacity = "1";
      });
      block.addEventListener("mouseleave", () => {
        button.style.opacity = "0";
      });

      button.addEventListener("click", () => {
        const code = block.querySelector("code");
        if (code) {
          navigator.clipboard.writeText(code.textContent || "");
          button.textContent = "已复制!";
          setTimeout(() => {
            button.textContent = "复制";
          }, 2000);
        }
      });
    });
  }, [content]);

  return (
    <article className="blog-post-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={{
          h2: ({ children }) => (
            <h2 className="mt-16 mb-6 text-[28px] font-semibold leading-[1.3] tracking-[-0.02em] text-[var(--color-text-primary)]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-12 mb-4 text-[22px] font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--color-text-primary)]">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-8 mb-3 text-[18px] font-semibold leading-[1.4] text-[var(--color-text-primary)]">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-6 text-[16px] leading-[1.8] text-[var(--color-text-secondary)]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-6 ml-6 list-disc space-y-2 text-[16px] leading-[1.7] text-[var(--color-text-secondary)]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-6 ml-6 list-decimal space-y-2 text-[16px] leading-[1.7] text-[var(--color-text-secondary)]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-2">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-6 border-l-2 border-[var(--color-primary)] pl-6 text-[16px] leading-[1.7] text-[var(--color-text-secondary)] italic">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="rounded-[4px] bg-[var(--color-bg-surface)] px-1.5 py-0.5 text-[14px] font-mono text-[var(--color-primary)]">
                  {children}
                </code>
              );
            }
            return (
              <code className={className}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-6 overflow-x-auto rounded-[12px] bg-[#1a1a2e] p-5 text-[14px] leading-[1.6]">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="mb-6 overflow-x-auto">
              <table className="w-full border-collapse text-[14px]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-[var(--color-border)]">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-12 border-[var(--color-border)]" />
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-[var(--color-primary)] underline underline-offset-2 transition hover:opacity-80"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="my-8 w-full rounded-[12px]"
            />
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[var(--color-text-primary)]">
              {children}
            </strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
