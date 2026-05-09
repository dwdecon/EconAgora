"use client";

import { useRef, useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  children: React.ReactNode;
}

export default function CodeBlock({ children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);

  async function handleCopy() {
    if (!codeRef.current) return;
    const text = codeRef.current.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative my-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] overflow-hidden group">
      {/* Header Bar */}
      <div className="flex items-center justify-end px-3 py-2 bg-[var(--color-bg-surface-strong)]">
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="flex items-center justify-center h-7 px-2.5 rounded-md text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface)] transition-all duration-200"
          aria-label="Copy code"
        >
          {copied ? (
            <span className="flex items-center gap-1.5 text-green-500 dark:text-green-400">
              <Check className="h-3.5 w-3.5" />
              <span>Copied!</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </span>
          )}
        </button>
      </div>

      {/* Code content */}
      <div 
        ref={codeRef}
        className="code-block-content p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-[var(--color-text-primary)] whitespace-pre-wrap break-words"
      >
        {children}
      </div>
    </div>
  );
}
