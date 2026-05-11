# Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce landing page LCP from ~3–5 s to < 2.5 s by optimizing images, streaming HTML with Suspense, and caching database queries.

**Architecture:** Keep Hero and synchronous sections in `page.tsx`; extract data-dependent `ModulesShowcase` into an async Server Component wrapped in `Suspense` with a skeleton fallback. Compress images and add `cache()` / `unstable_cache` to `fetchFeatured*` functions.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS, CloudBase (Supabase-like), sharp

---

## File Structure

| File | Responsibility |
|------|---------------|
| `public/hero-halo.webp` | Compressed hero halo image (< 200 KB) |
| `public/logo.webp` | Converted logo (< 100 KB); replaces `logo.png` |
| `src/components/landing/ModulesSkeleton.tsx` | **New** Pulse skeleton matching ModulesShowcase grid layout |
| `src/components/landing/ModulesShowcaseAsync.tsx` | **New** Async Server Component that fetches 5 datasets and renders `ModulesShowcase` |
| `src/app/[locale]/page.tsx` | Refactored to stream Hero immediately, Suspense-wrap data section |
| `src/components/landing/HeroHalo.tsx` | Native `<img>` → Next.js `<Image>` (Visual Lock compliant) |
| `src/app/[locale]/layout.tsx` | Update favicon from `logo.png` to `logo.webp` |
| `src/lib/prompts.ts` | `fetchFeaturedPrompts` wrapped with `cache()` + `unstable_cache` |
| `src/lib/skills.ts` | `fetchFeaturedSkills` wrapped with `cache()` + `unstable_cache` |
| `src/lib/tools.ts` | `fetchFeaturedTools` wrapped with `cache()` + `unstable_cache` |
| `src/lib/posts.ts` | `fetchFeaturedPosts` / `fetchFeaturedAgentPosts` wrapped with `cache()` + `unstable_cache` |
| `next.config.mjs` | Add bundle-analyzer plugin |

---

## Task 1: Compress Images

**Files:**
- Modify: `public/hero-halo.webp`
- Create: `public/logo.webp`
- Modify: `src/app/[locale]/layout.tsx:17`

- [ ] **Step 1: Install sharp**

Run: `npm install -D sharp`
Expected: sharp added to devDependencies

- [ ] **Step 2: Create image compression script**

Create `scripts/compress-images.mjs`:
```mjs
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";

// Compress hero-halo.webp
await sharp("public/hero-halo.webp")
  .webp({ quality: 78 })
  .toFile("public/hero-halo-tmp.webp");

// Replace original
const compressed = readFileSync("public/hero-halo-tmp.webp");
writeFileSync("public/hero-halo.webp", compressed);

// Convert logo.png to webp
await sharp("public/logo.png")
  .webp({ quality: 85 })
  .toFile("public/logo.webp");

console.log("Done. Check file sizes:");
```

- [ ] **Step 3: Run compression script**

Run: `node scripts/compress-images.mjs`

Verify:
```bash
ls -lh public/hero-halo.webp public/logo.webp
```
Expected: `hero-halo.webp` < 200 KB, `logo.webp` < 100 KB.

- [ ] **Step 4: Search and update all logo references**

Search for `logo.png` across the codebase:
```bash
grep -rn "logo\.png" src/ public/ app/ --include="*.ts" --include="*.tsx" --include="*.json"
```

Update every match to `logo.webp`. Known locations:
- `src/app/[locale]/layout.tsx:17`:
  ```tsx
  icons: {
    icon: "/logo.webp",
  },
  ```
- Check `Navbar.tsx`, `manifest.ts/json`, `metadata` exports, and any other hardcoded references.

- [ ] **Step 5: Commit**

```bash
git add public/hero-halo.webp public/logo.webp src/app/[locale]/layout.tsx package.json package-lock.json
# Keep logo.png in repo as fallback for older browsers if needed
git commit -m "perf: compress hero-halo.webp and convert logo to webp"
```

---

## Task 2: Add Bundle Analyzer

**Files:**
- Modify: `next.config.mjs`
- Modify: `package.json`

- [ ] **Step 1: Install bundle analyzer**

Run: `npm install -D @next/bundle-analyzer`

- [ ] **Step 2: Update next.config.mjs**

Read the current file first. Add the bundle analyzer import and wrapper while preserving existing config:

```mjs
import createNextIntlPlugin from "next-intl/plugin";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig = {
  output: "standalone",
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default bundleAnalyzer(withNextIntl(nextConfig));
```

Note: If the current file already has other config (e.g., `images`), merge it into `nextConfig` instead of replacing.

- [ ] **Step 3: Commit**

```bash
git add next.config.mjs package.json package-lock.json
git commit -m "chore: add @next/bundle-analyzer"
```

---

## Task 3: Create ModulesSkeleton

**Files:**
- Create: `src/components/landing/ModulesSkeleton.tsx`

- [ ] **Step 1: Write skeleton component**

Create `src/components/landing/ModulesSkeleton.tsx`:
```tsx
export default function ModulesSkeleton() {
  return (
    <section id="modules" className="relative bg-black py-24">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        {/* Header placeholder */}
        <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="w-full md:w-1/2">
            <div className="mb-5 h-6 w-32 rounded-full bg-white/5 animate-pulse" />
            <div className="h-14 w-3/4 rounded-lg bg-white/5 animate-pulse" />
          </div>
          <div className="mt-6 w-full max-w-[420px] md:w-1/2">
            <div className="mb-4 h-4 w-full rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-white/5 animate-pulse" />
          </div>
        </div>

        {/* Tabs placeholder */}
        <div className="mb-10 flex items-center gap-2 border-b border-white/10 pb-px">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-10 w-24 rounded-t bg-white/5 animate-pulse"
            />
          ))}
        </div>

        {/* Cards placeholder */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[420px] rounded-2xl border border-white/8 bg-white/[0.03] animate-pulse"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/ModulesSkeleton.tsx
git commit -m "feat: add ModulesSkeleton loading placeholder"
```

---

## Task 4: Create ModulesShowcaseAsync

**Files:**
- Create: `src/components/landing/ModulesShowcaseAsync.tsx`

- [ ] **Step 1: Write async component**

Create `src/components/landing/ModulesShowcaseAsync.tsx`:
```tsx
import ModulesShowcase from "./ModulesShowcase";
import { fetchFeaturedPrompts } from "@/lib/prompts";
import { fetchFeaturedSkills } from "@/lib/skills";
import { fetchFeaturedTools } from "@/lib/tools";
import { fetchFeaturedPosts, fetchFeaturedAgentPosts } from "@/lib/posts";

export default async function ModulesShowcaseAsync({
  locale,
}: {
  locale: string;
}) {
  const [
    featuredPrompts,
    featuredSkills,
    featuredTools,
    featuredPosts,
    featuredAgentPosts,
  ] = await Promise.all([
    fetchFeaturedPrompts(),
    fetchFeaturedSkills(),
    fetchFeaturedTools(),
    fetchFeaturedPosts(),
    fetchFeaturedAgentPosts(),
  ]);

  return (
    <ModulesShowcase
      locale={locale}
      featuredPrompts={featuredPrompts}
      featuredSkills={featuredSkills}
      featuredTools={featuredTools}
      featuredPosts={featuredPosts}
      featuredAgentPosts={featuredAgentPosts}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/ModulesShowcaseAsync.tsx
git commit -m "feat: add ModulesShowcaseAsync for streaming data fetching"
```

---

## Task 5: Refactor page.tsx with Streaming + Suspense

**Files:**
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Remove synchronous data fetching and wrap with Suspense**

Replace the entire `src/app/[locale]/page.tsx`:
```tsx
import { Suspense } from "react";
import Hero from "@/components/landing/Hero";
import PartnerMarquee from "@/components/landing/PartnerMarquee";
import ManifestoSection from "@/components/landing/ManifestoSection";
import ModulesShowcaseAsync from "@/components/landing/ModulesShowcaseAsync";
import ModulesSkeleton from "@/components/landing/ModulesSkeleton";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import Testimonials from "@/components/landing/Testimonials";
import FAQAccordion from "@/components/landing/FAQAccordion";
import CTASection from "@/components/landing/CTASection";
import { getLocale } from "next-intl/server";

export default async function Home() {
  const locale = await getLocale();

  return (
    <div className="relative overflow-x-clip bg-black text-white selection:bg-[#ff1453]/30">
      <Hero />
      <PartnerMarquee />
      <ManifestoSection />
      <Suspense fallback={<ModulesSkeleton />}>
        <ModulesShowcaseAsync locale={locale} />
      </Suspense>
      <FeaturesGrid />
      <Testimonials />
      <FAQAccordion />
      <CTASection />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/[locale]/page.tsx
git commit -m "perf: stream ModulesShowcase with Suspense to unblock Hero LCP"
```

---

## Task 6: HeroHalo Image Optimization (Visual Lock Compliant)

**Files:**
- Modify: `src/components/landing/HeroHalo.tsx`

- [ ] **Step 1: Verify HeroHalo is a Client Component**

Check `src/components/landing/HeroHalo.tsx` line 1. It must have `"use client";` for `onLoad` to work on `<Image>`. (Confirmed: it does.)

- [ ] **Step 2: Replace native img with Next.js Image**

Modify `src/components/landing/HeroHalo.tsx` around lines 144-152:

Add import at the top:
```tsx
import Image from "next/image";
```

Replace the `<img>` block:
```tsx
        <Image
          src="/hero-halo.webp"
          alt=""
          width={1800}
          height={1800}
          priority
          sizes="100vw"
          className="h-full w-full object-contain mix-blend-screen opacity-[0.95]"
          onLoad={() => window.dispatchEvent(new Event("hero-halo-ready"))}
        />
```

Remove the `eslint-disable-next-line` comment above the old `<img>`.

- [ ] **Step 2: Verify visual output is unchanged**

Run dev server and visually inspect the hero halo:
- Geometry identical
- Animation timings identical
- Blend mode identical

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/HeroHalo.tsx
git commit -m "perf: use Next.js Image for hero-halo with priority preloading"
```

---

## Task 7: Add Data Caching

**Files:**
- Modify: `src/lib/prompts.ts`
- Modify: `src/lib/skills.ts`
- Modify: `src/lib/tools.ts`
- Modify: `src/lib/posts.ts`

- [ ] **Step 1: Update prompts.ts**

At the top of `src/lib/prompts.ts`, add:
```tsx
import { cache } from "react";
import { unstable_cache } from "next/cache";
```

Wrap `fetchFeaturedPrompts`:
```tsx
const _fetchFeaturedPrompts = async (): Promise<Prompt[]> => {
  // existing implementation body (everything inside the current function)
};

export const fetchFeaturedPrompts = cache(
  unstable_cache(_fetchFeaturedPrompts, ["featured-prompts"], {
    revalidate: 60,
  })
);
```

- [ ] **Step 2: Update skills.ts**

Similarly for `src/lib/skills.ts`:
```tsx
import { cache } from "react";
import { unstable_cache } from "next/cache";
```

Wrap `fetchFeaturedSkills`:
```tsx
const _fetchFeaturedSkills = async (): Promise<Skill[]> => {
  // existing implementation body
};

export const fetchFeaturedSkills = cache(
  unstable_cache(_fetchFeaturedSkills, ["featured-skills"], {
    revalidate: 60,
  })
);
```

- [ ] **Step 3: Update tools.ts**

Similarly for `src/lib/tools.ts`:
```tsx
import { cache } from "react";
import { unstable_cache } from "next/cache";
```

Wrap `fetchFeaturedTools`:
```tsx
const _fetchFeaturedTools = async (): Promise<Tool[]> => {
  // existing implementation body
};

export const fetchFeaturedTools = cache(
  unstable_cache(_fetchFeaturedTools, ["featured-tools"], {
    revalidate: 60,
  })
);
```

- [ ] **Step 4: Update posts.ts**

Similarly for `src/lib/posts.ts`:
```tsx
import { cache } from "react";
import { unstable_cache } from "next/cache";
```

Wrap both functions:
```tsx
const _fetchFeaturedPosts = async (): Promise<Post[]> => {
  // existing implementation body
};

export const fetchFeaturedPosts = cache(
  unstable_cache(_fetchFeaturedPosts, ["featured-posts"], {
    revalidate: 60,
  })
);

const _fetchFeaturedAgentPosts = async (): Promise<Post[]> => {
  // existing implementation body
};

export const fetchFeaturedAgentPosts = cache(
  unstable_cache(_fetchFeaturedAgentPosts, ["featured-agent-posts"], {
    revalidate: 60,
  })
);
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/prompts.ts src/lib/skills.ts src/lib/tools.ts src/lib/posts.ts
git commit -m "perf: add cache() and unstable_cache to fetchFeatured* functions"
```

---

## Task 8: Local Build Verification

- [ ] **Step 1: Run production build**

Run: `npm run build`

Expected: No TypeScript errors, no build failures.

- [ ] **Step 2: Verify standalone output**

Check `.next/standalone/.next/static/` contains compressed assets.

- [ ] **Step 3: Run bundle analyzer (optional)**

Run: `ANALYZE=true npm run build`

Inspect the generated `.next/analyze/` HTML files for oversized chunks.

- [ ] **Step 4: Commit if any config changes**

---

## Task 9: Deploy

- [ ] **Step 1: Push to GitHub**

Run: `git push origin main`

- [ ] **Step 2: SSH deploy**

Run:
```bash
ssh ubuntu@43.155.196.57 \
  "cd /var/www/EconAgora && sudo git pull origin main && sudo pnpm install && sudo pnpm build && sudo systemctl restart econagora"
```

- [ ] **Step 3: Verify deployment**

Open https://econagora.com in an incognito window:
1. Hero should render immediately (no blank wait)
2. Modules section should appear after brief skeleton pulse
3. No console errors
4. Logo and halo images load correctly

---

## Rollback Plan

If any issue occurs in production:
1. Identify the problematic commit(s) with `git log --oneline`
2. Revert individually:
   - Hero visual regression → `git revert <Task-6-commit-hash>`
   - Modules not loading → `git revert <Task-4-commit-hash> <Task-5-commit-hash>`
   - Cache issues → edit `src/lib/*.ts` and reduce `revalidate: 60` to `revalidate: 10`, commit and push
3. `git push origin main`
4. Re-deploy via SSH

If multiple commits conflict during revert, create a hotfix branch from the last known good commit and force-push (coordinate with team first).
