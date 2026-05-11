# Performance Optimization Design — EconAgora Landing Page

**Date:** 2026-05-11
**Scope:** Landing page (`/`) LCP improvement + interaction responsiveness
**Approach:** A + B (Streaming + Suspense + Image Optimization + Data Caching)

---

## 1. Problem Statement

### Current Bottlenecks

1. **Synchronous data fetching blocks HTML streaming**
   - `page.tsx` awaits `Promise.all([fetchFeaturedPrompts(), fetchFeaturedSkills(), fetchFeaturedTools(), fetchFeaturedPosts(), fetchFeaturedAgentPosts()])` before rendering anything.
   - Next.js cannot send HTML until all 5 database queries complete. Users see a blank/black screen (HaloOverlay) for hundreds of milliseconds to seconds.

2. **Unoptimized images**
   - `hero-halo.webp`: 702 KB
   - `logo.png`: 860 KB
   - `HeroHalo` uses a native `<img>` element instead of Next.js `<Image>`, missing automatic compression, responsive `srcset`, and `priority` preloading.

3. **No data caching**
   - `fetchFeatured*` functions hit the database on every request without `cache()` or `cacheLife`.
   - `warmupSkillRdb()` / `warmupToolRdb()` run per-request.

4. **Unknown JS bundle bloat**
   - No bundle analyzer configured. Potential for oversized chunks or unused dependencies blocking the main thread.

---

## 2. Design

### 2.1 Image Optimization

**Goal:** Reduce landing-page image payload from ~1.5 MB to ~300 KB.

| Asset | Current | Target | Action |
|-------|---------|--------|--------|
| `hero-halo.webp` | 702 KB | < 200 KB | Re-compress with `sharp`/`squoosh` (quality 75–80, keep 1800×1800) |
| `logo.png` | 860 KB | < 100 KB | Convert to WebP or AVIF |

**Code changes:**
- `HeroHalo.tsx`: Replace `<img>` with Next.js `<Image>`. **Visual Lock compliance:** retain all existing `className`, CSS filters, gradient overlays, and animation timings. Only the element type changes (`img` → `Image`); visual output must remain pixel-identical.
  ```tsx
  <Image
    src="/hero-halo.webp"
    alt="Hero Halo"
    width={1800}
    height={1800}
    priority
    sizes="100vw"
    className="..."   /* existing classes preserved */
    onLoad={() => window.dispatchEvent(new Event("hero-halo-ready"))}
  />
  ```
- `next.config.mjs`: Add `images` configuration if external CDN domains are introduced later.

---

### 2.2 Streaming + Suspense

**Goal:** Ship Hero HTML immediately; render data-dependent sections as they resolve.

**Architecture:**

```
page.tsx (Server Component)
├── Hero                 ← synchronous, ships immediately
├── PartnerMarquee       ← synchronous
├── ManifestoSection     ← synchronous
├── Suspense
│   fallback: ModulesSkeleton
│   └── ModulesShowcaseAsync  ← async Server Component
│       └── fetches 5 featured datasets
├── FeaturesGrid         ← synchronous
├── Testimonials         ← synchronous
├── FAQAccordion         ← synchronous
└── CTASection           ← synchronous
```

**Code changes:**
- `page.tsx`: Remove `await Promise.all(...)`; wrap data-dependent sections in `<Suspense>`.
- Extract data-fetching into a new async component `ModulesShowcaseAsync`.
- Create `ModulesSkeleton.tsx` as a minimal pulse-style placeholder matching the existing grid layout.

**Fallback design:**
- 4 card placeholders in a 2-column grid
- Exact match to `ModulesShowcase` rendered dimensions (columns, gaps, card heights, padding)
- `bg-white/5 rounded-xl animate-pulse`
- No text, no complex layout
- **CLS requirement:** measure the real `ModulesShowcase` height/width and replicate in skeleton; target CLS < 0.1

---

### 2.3 Data Caching

**Goal:** Eliminate redundant database queries per request and across requests.

**Code changes:**
- **Per-request deduplication** with React `cache()`:
  ```ts
  import { cache } from "react";

  export const fetchFeaturedPrompts = cache(async (): Promise<Prompt[]> => {
    // existing implementation
  });
  ```
  This prevents duplicate queries when the same function is called multiple times during a single request.

- **Cross-request caching** with `unstable_cache` (Next.js stable API, safer than `"use cache"` for existing functions):
  ```ts
  import { unstable_cache } from "next/cache";

  export const fetchFeaturedPrompts = unstable_cache(
    async () => { /* existing implementation */ },
    ["featured-prompts"],
    { revalidate: 60 } // 60-second shared cache
  );
  ```
  `cache()` and `unstable_cache` can be composed: `unstable_cache` wraps the cached function for cross-request deduplication.

- **Warmup evaluation:** Evaluate moving `warmupSkillRdb()` / `warmupToolRdb()` from per-request to application startup. If the deployment platform (systemd/PM2) supports startup hooks, run warmups there; otherwise keep per-request with `cache()` so they execute at most once per request.

**Cache policy rationale:**
- Featured data is low-churn (sorted by `like_count` or `created_at`).
- 1-minute `cacheLife` strikes a balance between freshness and performance.
- Can be tightened or loosened based on real metrics after deployment.

---

### 2.4 Interaction Responsiveness (Diagnostics)

**Goal:** Identify and fix JS main-thread blocking.

**Actions:**
1. Add `@next/bundle-analyzer` to `next.config`.
2. Build and inspect largest chunks.
3. Audit `fetchAuthorMap` for oversized payloads.
4. Verify heavy libraries (markdown parsers, chart libs) are dynamically imported on pages that need them, not bundled into the landing page.

**Out of scope for this design:**
- Specific bundle-splitting decisions (pending analyzer output).
- Service-worker or prefetching strategies (future iteration).

---

## 3. File Change List

| File | Change |
|------|--------|
| `public/hero-halo.webp` | Re-compress to < 200 KB |
| `public/logo.png` | Convert to `logo.webp` (< 100 KB); update all references (Navbar, manifest, metadata, etc.) |
| `src/components/landing/HeroHalo.tsx` | Replace `<img>` with `<Image>` |
| `src/app/[locale]/page.tsx` | Add Suspense boundaries; remove synchronous `Promise.all` |
| `src/components/landing/ModulesSkeleton.tsx` | **New** skeleton placeholder |
| `src/components/landing/ModulesShowcaseAsync.tsx` | **New** async Server Component for data fetching |
| `src/lib/prompts.ts` | Wrap `fetchFeaturedPrompts` with `cache()`; add `cacheLife` |
| `src/lib/skills.ts` | Wrap `fetchFeaturedSkills` with `cache()`; add `cacheLife`; evaluate `warmupSkillRdb` relocation |
| `src/lib/tools.ts` | Wrap `fetchFeaturedTools` with `cache()`; add `cacheLife`; evaluate `warmupToolRdb` relocation |
| `src/lib/posts.ts` | Wrap `fetchFeaturedPosts` and `fetchFeaturedAgentPosts` with `cache()`; add `cacheLife` |
| `next.config.mjs` | Add `images` config; add bundle-analyzer plugin |

---

## 4. Success Criteria

- **LCP < 2.5 s** on 4G throttling (from current ~3–5 s); target < 1.5 s in phase 2 after bundle optimization
- **Total image payload on landing page < 400 KB**
- **Database queries per landing-page request = 0** when cache hits
- **No layout shift (CLS < 0.1)** after Suspense streaming

---

## 5. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `cacheLife` stale data | Start with 1-minute TTL; monitor freshness complaints |
| Skeleton mismatch with real layout | Match grid columns, card heights, and spacing exactly |
| `hero-halo.webp` compression degrades visual quality | Preview before/after; adjust quality threshold if needed |
| `logo.webp` not supported by all browsers | Provide `logo.png` fallback via `<picture>` if necessary (WebP has ~97% coverage) |

---

## 6. Future Work

- Bundle analyzer deep-dive and code-splitting
- Service worker for asset caching
- Prefetching `/skills`, `/tools`, `/prompts` on hover
