# Skill Hub & Tool Center Design Specification

**Date**: 2026-04-01
**Status**: Draft
**Author**: AI Assistant

## Overview

Add two new resource pages to EconAgora: **Skill Hub** (`/skills`) and **Tool Center** (`/tools`). Both serve as browsable libraries with documentation/tutorial content, allowing users to discover, learn, and share reusable skills and external tools for academic research workflows.

## Goals

1. Provide centralized discovery for AI skills and external tools
2. Enable community contributions with approval workflow
3. Deliver comprehensive tutorials and quick-start guides
4. Maintain visual consistency with existing Prompt library
5. Support bilingual content (zh/en)

## Non-Goals

- Real-time skill/tool execution in browser
- Payment or subscription features
- Third-party API integrations for tool testing
- Advanced analytics or usage tracking

## Architecture

### Page Structure

Two independent routes:
- `/[locale]/skills/page.tsx` - Skill Hub listing
- `/[locale]/skills/[slug]/page.tsx` - Skill detail
- `/[locale]/tools/page.tsx` - Tool Center listing
- `/[locale]/tools/[slug]/page.tsx` - Tool detail

### Database Schema

**`skill` table**:
```sql
CREATE TABLE skill (
  _id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  tags JSON,
  tutorial TEXT,  -- markdown content
  code_examples TEXT,  -- markdown code blocks
  use_cases TEXT,
  author_id VARCHAR(255) NOT NULL,
  like_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, PUBLISHED, ARCHIVED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_author (author_id)
);
```

**`tool` table**:
```sql
CREATE TABLE tool (
  _id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  tags JSON,
  official_url VARCHAR(500),
  docs_url VARCHAR(500),
  quick_start TEXT,  -- markdown content
  integration_guide TEXT,  -- markdown content
  author_id VARCHAR(255) NOT NULL,
  like_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_author (author_id)
);
```

### Data Flow

1. **Listing Pages** (`/skills`, `/tools`):
   - Server-side fetch from CloudBase RDB
   - Filter by category, tags, search query
   - Paginate results (12 per page)
   - Batch fetch author profiles to avoid N+1 queries
   - Featured items fetched separately (top 5 by like_count)

2. **Detail Pages** (`/skills/[slug]`, `/tools/[slug]`):
   - Fetch single record by `_id`
   - Fetch author profile
   - Render markdown content (tutorial/quick_start)
   - Track view count increment
   - Support like/unlike actions (authenticated users)

3. **Create/Edit Forms** (`/skills/new`, `/tools/new`):
   - Client-side form with markdown editor
   - Submit to CloudBase with status='PENDING'
   - Require authentication
   - Admin approval workflow (future enhancement)

## Component Design

### Reusable Components

**From existing codebase**:
- `PageShell` - page container with max-width
- `Pagination` - page navigation
- `Reveal` - scroll animation wrapper
- `TagBadge` - tag display
- `LikeButton` - like/unlike interaction

**New components needed**:
- `SkillCard` - skill listing card
- `ToolCard` - tool listing card
- `SkillFilters` - category/tag filters for skills
- `ToolFilters` - category/tag filters for tools
- `MarkdownRenderer` - render markdown with syntax highlighting

### Page Layout Structure

Both `/skills` and `/tools` follow this pattern:

```
┌─────────────────────────────────────┐
│ PageHero (label, title, subtitle)  │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ FeaturedCarousel (top 5 items)     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Filters (category, tags, search)   │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Grid: [CreateNewCard] + Item Cards │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Pagination                          │
└─────────────────────────────────────┘
```


### Detail Page Layouts

**Skill Detail Page** (`/skills/[slug]`):
```
┌─────────────────────────────────────────────┐
│ Breadcrumb: Skills > [Category] > [Title]  │
├─────────────────────────────────────────────┤
│ Title, Category, Tags, Author, Like Button  │
├─────────────────────────────────────────────┤
│ Use Cases (short description)              │
├─────────────────────────────────────────────┤
│ Tutorial (markdown rendered)               │
│ - Step-by-step guide                       │
│ - Best practices                           │
├─────────────────────────────────────────────┤
│ Code Examples (collapsible sections)       │
├─────────────────────────────────────────────┤
│ Related Skills (3 cards)                   │
└─────────────────────────────────────────────┘
```

**Tool Detail Page** (`/tools/[slug]`):
```
┌─────────────────────────────────────────────┐
│ Breadcrumb: Tools > [Category] > [Title]   │
├─────────────────────────────────────────────┤
│ Title, Category, Tags, Author, Like Button  │
├─────────────────────────────────────────────┤
│ Quick Start (markdown rendered)            │
│ - Installation/setup                      │
│ - Basic usage                              │
├─────────────────────────────────────────────┤
│ Integration Guide (markdown rendered)      │
│ - API examples                             │
│ - Configuration                            │
├─────────────────────────────────────────────┤
│ External Links                             │
│ - Official Website [Link]                 │
│ - Documentation [Link]                     │
├─────────────────────────────────────────────┤
│ Related Tools (3 cards)                   │
└─────────────────────────────────────────────┘
```

## Internationalization (i18n)

Both pages support zh/en with `next-intl`:

**Keys to translate**:
- page labels, titles, subtitles
- filter labels (category, tags, search)
- card labels (author, views, likes)
- button text (explore, copy, share)
- empty state messages
- form labels and placeholders

## Implementation Phases

### Phase 1: Database Setup
1. Create `skill` table in CloudBase RDB
2. Create `tool` table in CloudBase RDB
3. Set up database indexes
4. Add sample data for testing

### Phase 2: Listing Pages
1. Create `/skills/page.tsx` and `/tools/page.tsx`
2. Implement data fetching functions
3. Create SkillCard and ToolCard components
4. Implement SkillFilters and ToolFilters
5. Add FeaturedCarousel support

### Phase 3: Detail Pages
1. Create `/skills/[slug]/page.tsx`
2. Create `/tools/[slug]/page.tsx`
3. Implement MarkdownRenderer component
4. Add view count tracking
5. Implement related items section

### Phase 4: Enhancement (Future)
1. Create/edit forms (`/skills/new`, `/tools/new`)
2. Authentication requirements
3. Like/unlike functionality
4. Admin approval workflow

## Dependencies

**New npm packages needed**:
- `@tailwindcss/typography` - markdown styling
- `react-markdown` or `next-mdx-remote` - markdown rendering
- `react-syntax-highlighter` - code syntax highlighting

**Existing dependencies used**:
- `next-intl` - internationalization
- `lucide-react` - icons
- `tailwindcss` - styling
- `@/lib/rdb-server` - CloudBase RDB access

## Testing Checklist

- [ ] Skills listing page renders correctly
- [ ] Tools listing page renders correctly
- [ ] Category/tag filtering works
- [ ] Search functionality works
- [ ] Pagination works
- [ ] Featured carousel displays top items
- [ ] Skill detail page renders tutorial
- [ ] Tool detail page renders quick_start
- [ ] Markdown rendering works (headings, code, lists)
- [ ] Code syntax highlighting works
- [ ] External links open correctly
- [ ] Like button increments count
- [ ] Bilingual support works (zh/en)
- [ ] Mobile responsive layout
- [ ] Empty states display correctly
- [ ] Error states handle gracefully

## Files to Create/Modify

**New files**:
- `src/app/[locale]/skills/page.tsx`
- `src/app/[locale]/skills/[slug]/page.tsx`
- `src/app/[locale]/skills/new/page.tsx`
- `src/app/[locale]/tools/page.tsx`
- `src/app/[locale]/tools/[slug]/page.tsx`
- `src/app/[locale]/tools/new/page.tsx`
- `src/components/skills/SkillCard.tsx`
- `src/components/skills/SkillFilters.tsx`
- `src/components/tools/ToolCard.tsx`
- `src/components/tools/ToolFilters.tsx`
- `src/components/shared/MarkdownRenderer.tsx`

**Modify existing files**:
- `src/components/layout/Navbar.tsx` - add Skills and Tools links
- `src/components/prompts/FeaturedCarousel.tsx` - add generic carousel
- `src/i18n/messages/*.json` - add translation keys
