# Prompt Library Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the prompt library to use a clean, light-themed, high-contrast typography style with a hero header, a featured card layout, and an integrated "Create New" CTA.

**Architecture:** We are updating existing UI components (`page.tsx`, `PromptFilters.tsx`, `PromptShowcaseCard.tsx`) to replace hardcoded dark mode colors with the project's semantic CSS variables (`var(--color-bg-card)`, etc.). We will introduce an `isFeatured` prop to `PromptShowcaseCard` to handle the large layout for the first item on the first page.

**Tech Stack:** Next.js (App Router), Tailwind CSS v4, React.

---

### Task 1: Update `PromptShowcaseCard` to Light Theme & Add Featured Variant

**Files:**
- Modify: `src/components/prompts/PromptShowcaseCard.tsx`

- [ ] **Step 1: Update props and base structure**
Update `PromptShowcaseCardProps` to include `isFeatured?: boolean`.

- [ ] **Step 2: Apply Light Theme & Flat Styling**
Remove all dark theme classes (`bg-[#000000]`, `text-white`, `text-white/70`, `bg-[#111111]`, `bg-[#1a1a1a]`, etc.).
Update the main `article` tag to use: `bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-primary/30 transition-transform duration-300 hover:-translate-y-1`. Ensure no shadows are added.

- [ ] **Step 3: Update Typography & Tags**
Update title to `text-[var(--color-text-primary)]`.
Update description to `text-[var(--color-text-secondary)]`.
Update tags to use light mode colors: `bg-[var(--color-bg-surface-strong)] text-[var(--color-text-secondary)]`.
Update the Category pill (the first tag) to use a light background of the category color (`bg` from `CATEGORY_THEME`) and text of the accent color (`accent` from `CATEGORY_THEME`).

- [ ] **Step 4: Update Avatar Fallback & Footer**
Update the Avatar fallback `div` to: `bg-[var(--color-bg-surface-strong)] text-[var(--color-text-secondary)]`.
Update author name and stats (Heart/Download) to `text-[var(--color-text-secondary)]`.

- [ ] **Step 5: Implement `isFeatured` Layout Logic**
If `isFeatured` is true:
  - The `article` should use `md:flex-row md:items-stretch`.
  - The title should use `text-3xl`.
  - Wrap the text content in a `div` that takes `md:w-[55%] flex flex-col`.
  - The image placeholder wrapper should take `md:w-[45%] md:mt-0 md:ml-8` (removing the default `mt-8`).
If `isFeatured` is false (or undefined):
  - Standard vertical flex layout (`flex-col`).

- [ ] **Step 6: Update Image Placeholder**
Update the decorative bottom/side div to use: `bg-[var(--color-bg-surface)] group-hover:bg-[var(--color-bg-surface-strong)]` with a gradient `from-black/5 to-transparent`.
For the aspect ratio trick, change `pt-[50%]` to `pt-[50%] md:pt-0` when `isFeatured` is true, relying on stretch alignment to fill height.

- [ ] **Step 7: Commit**
```bash
git add src/components/prompts/PromptShowcaseCard.tsx
git commit -m "feat: redesign PromptShowcaseCard to light theme and add featured variant"
```

### Task 2: Update `PromptFilters` to Light Theme

**Files:**
- Modify: `src/components/prompts/PromptFilters.tsx`

- [ ] **Step 1: Update Category Tabs**
Change the inactive tab styling from dark mode (`text-[#b6a893] hover:bg-white/[0.05] hover:text-white`) to light mode: `bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-strong)]`.
Active state (`bg-primary text-white`) remains unchanged.

- [ ] **Step 2: Update Search Input**
Change the form container from `bg-[#151311] border-white/10` to `bg-[var(--color-bg-surface)] border-[var(--color-border)]`.
Change the input text from `text-[#f5ede2]` to `text-[var(--color-text-primary)]`.
Change placeholder text from `placeholder:text-[#7e7468]` to `placeholder-[var(--color-text-muted)]`.
Change the search icon to `text-[var(--color-text-secondary)]`.
Change the clear (X) button inside the search form to `text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]`.

- [ ] **Step 3: Update Active Filter Badges (Pills)**
Change the filter pills (Category, Tag, Search) from `border-white/10 bg-white/[0.03] text-[#e9ddc8] hover:text-white` to `border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]`.

- [ ] **Step 4: Update Clear All Button**
Change from `text-[#8d8173] hover:text-white` to `text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]`.

- [ ] **Step 5: Commit**
```bash
git add src/components/prompts/PromptFilters.tsx
git commit -m "style: update PromptFilters to match light theme"
```

### Task 3: Restructure `prompts/page.tsx` Layout & Hero

**Files:**
- Modify: `src/app/[locale]/prompts/page.tsx`

- [ ] **Step 1: Create CTA Component Inline**
At the top of the file (or inside the component), create the JSX for the "Create New" card:
```tsx
import { Plus } from "lucide-react";

const CreateNewCard = () => (
  <Link
    href="/prompts/new"
    className="group flex min-h-[300px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--color-border)] p-6 text-center transition-colors hover:border-primary/50 hover:bg-[var(--color-bg-surface)]"
  >
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
      <Plus className="h-6 w-6" />
    </div>
    <h3 className="text-lg font-medium text-[var(--color-text-primary)]">Share Your Prompt</h3>
    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
      Publish your workflow to the community.
    </p>
  </Link>
);
```

- [ ] **Step 2: Redesign Hero Section**
Replace the current compact flex header with a centered hero section.
Remove the "Publish Prompt" link from the header.
```tsx
<div className="mx-auto max-w-2xl text-center mb-8 relative">
  <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent blur-xl rounded-full" />
  <p className="text-sm font-medium text-[var(--color-text-secondary)]">Prompt Library</p>
  <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] md:text-5xl">
    Curated Research Prompts
  </h1>
  <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">
    Browse reusable workflow systems for literature review, data analysis, paper writing, and peer review.
  </p>
</div>
```

- [ ] **Step 3: Update Loading & Empty States**
Update loading skeletons: Replace `border-white/8 bg-white/[0.03]` with `bg-[var(--color-bg-surface-strong)]`. Update header text in loading state to `text-[var(--color-text-primary)]`.
Update empty state: Replace `text-[#f5ede2]` and `text-[#8d8173]` with `text-[var(--color-text-primary)]` and `text-[var(--color-text-secondary)]`.

- [ ] **Step 4: Implement Grid Logic (Featured + Grid)**
Replace the current `.map` loop with logic that only features the first prompt on the first page:
```tsx
{prompts.length > 0 ? (
  <div className="mt-10 flex flex-col gap-8">
    {/* Featured Prompt: Only show index 0 as featured on Page 1 */}
    {page === 1 && (
      <Reveal delay={0} threshold={0.12}>
        <PromptShowcaseCard prompt={prompts[0]} isFeatured={true} />
      </Reveal>
    )}

    {/* Grid for the rest (or all prompts on page 2+) */}
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {page === 1 && (
        <Reveal delay={70} threshold={0.12}>
          <CreateNewCard />
        </Reveal>
      )}
      {(page === 1 ? prompts.slice(1) : prompts).map((prompt, index) => (
        <Reveal
          key={prompt.id}
          delay={Math.min((index + (page === 1 ? 2 : 1)) * 70, 280)}
          threshold={0.12}
        >
          <PromptShowcaseCard prompt={prompt} isFeatured={false} />
        </Reveal>
      ))}
    </div>
  </div>
) : (
...
```

- [ ] **Step 5: Commit**
```bash
git add src/app/\[locale\]/prompts/page.tsx
git commit -m "feat: restructure prompt library with hero, featured layout, and integrated CTA"
```