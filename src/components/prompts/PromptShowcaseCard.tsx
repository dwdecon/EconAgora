import { Heart, Download } from "lucide-react";
import { Link } from "@/i18n/navigation";

// Define category themes (same as PromptCard)
const CATEGORY_THEME: Record<string, { bg: string; text: string; accent: string; darkBg: string }> = {
  Research: { bg: "bg-blue-50", text: "text-blue-700", accent: "text-blue-700", darkBg: "bg-blue-500/10" },
  Writing: { bg: "bg-emerald-50", text: "text-emerald-700", accent: "text-emerald-700", darkBg: "bg-emerald-500/10" },
  Coding: { bg: "bg-purple-50", text: "text-purple-700", accent: "text-purple-700", darkBg: "bg-purple-500/10" },
  Analysis: { bg: "bg-orange-50", text: "text-orange-700", accent: "text-orange-700", darkBg: "bg-orange-500/10" },
  Default: { bg: "bg-gray-100", text: "text-gray-700", accent: "text-gray-700", darkBg: "bg-gray-500/10" },
};

interface PromptShowcaseCardProps {
  prompt: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    tags: string[];
    likeCount: number;
    downloadCount: number;
    createdAt: string;
    author: { id: string; name: string; avatar: string | null };
  };
  isFeatured?: boolean;
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="h-6 w-6 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-surface-strong)] text-[10px] font-medium text-[var(--color-text-secondary)]">
      {name?.charAt(0) ?? '?'}
    </div>
  );
}

export default function PromptShowcaseCard({
  prompt,
  isFeatured,
}: PromptShowcaseCardProps) {
  // We include category in the tags for display if it's not already there
  const displayTags = [prompt.category, ...prompt.tags.filter(t => t !== prompt.category)].slice(0, 4);

  return (
    <Link href={`/prompts/${prompt.id}`} className="block h-full">
      <article className={`group flex h-full rounded-[24px] bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] p-6 transition-transform duration-300 hover:-translate-y-1 hover:border-primary/30 sm:p-8 ${isFeatured ? 'flex-col md:flex-row md:items-stretch' : 'flex-col'}`}>
        {/* Content Wrapper */}
        <div className={`${isFeatured ? 'flex flex-col md:w-[55%]' : 'flex flex-col flex-1'}`}>
          {/* Title */}
          <h3 className={`font-medium tracking-tight text-[var(--color-text-primary)] sm:leading-tight ${isFeatured ? 'text-3xl' : 'text-2xl sm:text-[28px]'}`}>
            {prompt.title}
          </h3>

          {/* Description */}
          <p className="mt-3 line-clamp-2 text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
            {prompt.description || "Structured prompt system for rigorous research workflows."}
          </p>

          {/* Tags */}
          <div className="mt-6 flex flex-wrap gap-2">
            {displayTags.map((tag, i) => {
              // Special styling for category pill (first tag)
              if (i === 0) {
                const theme = CATEGORY_THEME[tag] || CATEGORY_THEME.Default;
                return (
                  <span
                    key={tag}
                    className={`rounded-full ${theme.bg} px-3.5 py-1.5 text-[13px] font-medium ${theme.accent} transition-colors`}
                  >
                    {tag}
                  </span>
                );
              }
              return (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--color-bg-surface-strong)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-surface)]"
                >
                  {tag}
                </span>
              );
            })}
          </div>

          {/* Spacer to push footer to bottom if cards are in a grid */}
          <div className="flex-1" />
        </div>

        {/* Decorative / Image placeholder area (optional, to match the visual weight of the reference) */}
        <div className={`relative overflow-hidden rounded-xl bg-[var(--color-bg-surface)] transition-colors duration-300 group-hover:bg-[var(--color-bg-surface-strong)] ${isFeatured ? 'mt-8 md:mt-0 md:ml-8 md:w-[45%] pt-[50%] md:pt-0' : 'mt-8 w-full pt-[50%]'}`}>
           {/* Abstract pattern or gradient to simulate the image presence */}
           <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent" />

           {/* Author & Stats overlaid or placed at bottom of this section */}
           <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4">
             <div className="flex items-center gap-2">
               <Avatar name={prompt.author.name} src={prompt.author.avatar} />
               <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                 {prompt.author.name}
               </span>
             </div>

             <div className="flex items-center gap-3 text-xs font-medium text-[var(--color-text-secondary)]">
               <span className="flex items-center gap-1">
                 <Heart className="h-3.5 w-3.5" />
                 {prompt.likeCount}
               </span>
               <span className="flex items-center gap-1">
                 <Download className="h-3.5 w-3.5" />
                 {prompt.downloadCount}
               </span>
             </div>
           </div>
        </div>
      </article>
    </Link>
  );
}
