# Prompt Library Redesign Specification

## 1. Overview
Redesign the `/prompts` page to use a clean, light-themed, high-contrast typography style. Shift the layout to a "Hero Header" -> "Filters" -> "Featured Prompt + Grid" structure. The goal is a premium, readable aesthetic that feels native to a research/academic tool while maintaining the rich metadata (tags, categories, stats).

## 2. Design Goals
*   **Theme:** Return to the project's default light theme (`--color-bg`, `--color-bg-card`), removing the dark styling recently applied to the `PromptShowcaseCard`.
*   **Header:** Shift from a compact left-aligned header to a centered, typography-driven "Hero" section with subtle background details.
*   **Layout Structure:**
    *   Top: Centered Hero Title & Subtitle
    *   Middle: Horizontal Filters (unchanged position, updated light theme)
    *   Content: 1 Full-width "Featured" card (the first prompt), followed by a 2-column grid.
*   **CTA Placement:** Remove the top-right "Publish Prompt" button. Replace it with a dedicated "Create New" card as the first item in the standard 2-column grid.

## 3. Component Updates

### 3.1 `src/app/[locale]/prompts/page.tsx`
*   **Hero Section:**
    *   Center text (`text-center mx-auto max-w-2xl`).
    *   Use `text-[var(--color-text-primary)]` for the `h1` and `text-[var(--color-text-secondary)]` for paragraphs.
    *   Add a decorative light-mode background effect (e.g., `bg-gradient-to-b from-primary/5 to-transparent`).
*   **Grid Layout Logic:**
    *   Slice `prompts[0]` as the Featured Prompt.
    *   Render a full-width featured card using `PromptShowcaseCard` with `isFeatured={true}`.
    *   Render a 2-column grid for `prompts.slice(1)`.
    *   The first item in this grid should be a hardcoded `Link` card styled as a call-to-action (`Create New Prompt`).
*   **Empty & Loading States:**
    *   Empty state: Update hardcoded text colors to `text-[var(--color-text-primary)]` and `text-[var(--color-text-secondary)]`.
    *   Loading state: Update skeleton loaders to use `bg-[var(--color-bg-surface-strong)]` and remove hardcoded dark borders.

### 3.2 `src/components/prompts/PromptFilters.tsx`
*   **Category Tabs:** Update active/inactive states:
    *   Active: `bg-primary text-white`
    *   Inactive: `bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-strong)]`
*   **Search Input:** `bg-[var(--color-bg-surface)] border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]`.
*   **Active Filter Badges (Pills):** Update the clearable filter pills to use light mode colors: `border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]`.
*   **Clear All Button:** Update to `text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]`.

### 3.3 `src/components/prompts/PromptShowcaseCard.tsx`
*   **Revert to Light Theme:** Remove all dark classes (`bg-[#000000]`, `text-white`, `text-white/70`, etc.).
*   **Base Styles (Warm White + Minimalist Flat):** `bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)]`. No box-shadows. Flat and clean.
*   **Hover State:** Lift slightly (`-translate-y-1`), and change border color (`hover:border-primary/30`). Do NOT add shadow on hover to maintain the flat aesthetic.
*   **Typography:** Grid card titles remain `h3`. Use `text-[var(--color-text-primary)]` for titles and `text-[var(--color-text-secondary)]` for descriptions.
*   **Avatar Fallback:** Update the fallback avatar (when no src exists) to use `bg-[var(--color-bg-surface-strong)]` and `text-[var(--color-text-secondary)]`.
*   **Image Placeholder:** The decorative image area at the bottom should use a light mode background (e.g., `bg-[var(--color-bg-surface)] group-hover:bg-[var(--color-bg-surface-strong)]`) with a subtle gradient (`from-black/5 to-transparent`).
*   **Featured Variant (`isFeatured?: boolean`):**
    *   When `isFeatured` is true, the card uses a horizontal layout on `md` screens and up: `md:flex-row`.
    *   The text content area takes up about 50-60% of the width (`md:w-[55%]`), and the decorative image placeholder takes the remaining width on the right.
    *   The title size increases to `text-3xl` (still an `h3` element).
    *   The image placeholder area is always visible, but repositioned to the side instead of the bottom.

### 3.4 "Create New Prompt" CTA Card
*   This is a standalone `Link` rendered directly in the grid in `page.tsx` (or extracted to a small component).
*   **Design:** `flex flex-col items-center justify-center min-h-[300px] rounded-[24px] border border-dashed border-[var(--color-border)] hover:border-primary/50 hover:bg-[var(--color-bg-surface)] transition-colors group text-center p-6`. No shadow.
*   **Content:** A large `+` icon (or `Plus` from `lucide-react`) in a primary-colored circle, followed by "Share Your Prompt" and a short description.

## 4. Data Flow & State
*   No changes to data fetching logic (`db.from("prompt")`).
*   Pagination remains intact.
*   **CTA Placement:** The "Create New" card should appear as the first item of the grid *only* on page 1 (`page === 1`). On page 2+, the grid just renders prompts normally.

## 5. CSS Variables Convention
*   The project uses Tailwind v4 `@theme` with CSS variables. We will consistently use the `var(--color-...)` syntax (e.g., `text-[var(--color-text-primary)]`) for semantic colors to ensure explicit light/dark mode support, except for the primary brand color where `bg-primary` / `text-primary` / `border-primary` is already well-established.