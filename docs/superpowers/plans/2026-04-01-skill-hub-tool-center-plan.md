# Skill Hub & Tool Center Implementation Plan

**Date**: 2026-04-01
**Spec**: [2026-04-01-skill-hub-tool-center-design.md](../specs/2026-04-01-skill-hub-tool-center-design.md)

## Overview

Implement two new resource pages: Skill Hub (`/skills`) and Tool Center (`/tools`). Both pages follow the Prompt library pattern with CloudBase RDB backend, featuring listing pages with filters/pagination and detail pages with markdown rendering.

## Implementation Strategy

Build in 4 phases:
1. **Database & Dependencies** - Set up tables, install packages, prepare shared components
2. **Skills Pages** - Complete `/skills` listing and detail pages
3. **Tools Pages** - Complete `/tools` listing and detail pages
4. **Integration** - Update navigation and homepage

Each phase is independently testable. Skills and Tools share similar structure but have distinct data models and content rendering.

## Phase 1: Database & Dependencies

### Task 1.1: Install npm packages
**Files**: `package.json`, `tailwind.config.js`

Install markdown rendering dependencies:
```bash
npm install react-markdown remark-gfm rehype-highlight
npm install -D @tailwindcss/typography
```

Configure Tailwind typography plugin in `tailwind.config.js`:
```js
plugins: [require('@tailwindcss/typography')]
```

**Verification**:
- `npm list react-markdown remark-gfm rehype-highlight @tailwindcss/typography`
- Typography plugin in tailwind.config.js

### Task 1.2: Create database tables
**Files**: CloudBase RDB console

Create `skill` and `tool` tables in CloudBase RDB.

**SQL for `skill` table**:
```sql
CREATE TABLE skill (
  _id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  tags JSON,
  tutorial TEXT,
  code_examples TEXT,
  use_cases TEXT,
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

**SQL for `tool` table**:
```sql
CREATE TABLE tool (
  _id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  tags JSON,
  official_url VARCHAR(500),
  docs_url VARCHAR(500),
  quick_start TEXT,
  integration_guide TEXT,
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

**Verification**: Query tables via CloudBase console

### Task 1.3: Add sample data
**Files**: CloudBase RDB console

Insert 3-5 sample records per table for testing.

**Verification**: Query returns sample data

### Task 1.4: Create shared components
**Files**: 
- `src/components/shared/MarkdownRenderer.tsx`
- `src/components/shared/CreateNewCard.tsx`

**MarkdownRenderer**:
- Props: `content: string`, `className?: string`
- Uses `react-markdown`, `remark-gfm`, `rehype-highlight`
- Renders markdown with syntax highlighting

**CreateNewCard**:
- Props: `href: string`, `title: string`, `description: string`
- Reusable "Create New" card for listing pages
- Extracted pattern from prompts page

**Verification**: Components render correctly


## Phase 2: Skills Pages

### Task 2.1: Create Skills data utilities
**Files**: `src/lib/skills.ts` (new)

Data fetching functions for skills, following `src/app/[locale]/prompts/page.tsx` pattern.

**Functions**:
- `fetchSkills({ page, category, tag, search })` - paginated query with filters
- `fetchFeaturedSkills()` - top 5 by like_count
- `fetchSkillById(id)` - single record with author
- `fetchRelatedSkills(id, category)` - 3 related (same category, exclude current, order by like_count)

**Verification**: Functions return typed data from RDB

### Task 2.2: Add Skills i18n keys
**Files**: `src/i18n/messages/zh.json`, `src/i18n/messages/en.json`

Add translation keys:
- `skills.label`, `skills.title`, `skills.subtitle`
- `skills.share`, `skills.shareDesc`
- `skills.card.author`, `skills.card.views`, `skills.card.likes`
- `skills.empty.title`, `skills.empty.hint`
- `skills.detail.tutorial`, `skills.detail.codeExamples`, `skills.detail.related`

**Verification**: Keys exist in both language files

### Task 2.3: Create SkillCard component
**Files**: `src/components/skills/SkillCard.tsx`

Card for skill listing grid.

**Props**: `skill: { id, title, description, category, tags, likeCount, viewCount, author }`

**Design**: Rounded card, category badge, title, description, tags, author, stats

**Verification**: Renders correctly, links to `/skills/[id]`

### Task 2.4: Create SkillFilters component
**Files**: `src/components/skills/SkillFilters.tsx`

Client component for filtering, similar to PromptFilters.

**Features**: Category dropdown, tag chips, search input, URL sync

**Verification**: Updates URL params, triggers page reload

### Task 2.5: Create Skills listing page
**Files**: `src/app/[locale]/skills/page.tsx`, `src/app/[locale]/skills/loading.tsx`, `src/app/[locale]/skills/error.tsx`

Server component with data fetching, filtering, pagination.

**Structure**:
- PageHero (label, title, subtitle)
- FeaturedCarousel (top 5, reuse from prompts or create generic version)
- SkillFilters
- Grid with CreateNewCard + SkillCard items
- Pagination

**Data**: Use functions from Task 2.1

**Verification**: Page renders, filters work, pagination works

### Task 2.6: Create Skill detail page
**Files**: `src/app/[locale]/skills/[slug]/page.tsx`

Skill detail with full tutorial content.

**Layout**:
- Breadcrumb navigation
- Title, category, tags, author
- Use cases section
- Tutorial (MarkdownRenderer)
- Code examples (use `<details>` for collapsible)
- Related skills (3 cards)

**Data**: Use `fetchSkillById` and `fetchRelatedSkills` from Task 2.1

**Verification**: Renders markdown correctly, related items display


## Phase 3: Tools Pages

### Task 3.1: Create Tools data utilities
**Files**: `src/lib/tools.ts` (new)

Data fetching functions for tools, mirror Task 2.1 structure.

**Functions**:
- `fetchTools({ page, category, tag, search })`
- `fetchFeaturedTools()`
- `fetchToolById(id)`
- `fetchRelatedTools(id, category)`

**Verification**: Functions return typed data from RDB

### Task 3.2: Add Tools i18n keys
**Files**: `src/i18n/messages/zh.json`, `src/i18n/messages/en.json`

Add translation keys (mirror Task 2.2):
- `tools.label`, `tools.title`, `tools.subtitle`
- `tools.share`, `tools.shareDesc`
- `tools.card.*`, `tools.empty.*`
- `tools.detail.quickStart`, `tools.detail.integration`, `tools.detail.links`, `tools.detail.related`

**Verification**: Keys exist in both language files

### Task 3.3: Create ToolCard component
**Files**: `src/components/tools/ToolCard.tsx`

Card for tool listing, similar to SkillCard.

**Props**: `tool: { id, title, description, category, tags, likeCount, viewCount, author, officialUrl }`

**Design**: Add external link icon for officialUrl

**Verification**: Renders correctly, links to `/tools/[id]`

### Task 3.4: Create ToolFilters component
**Files**: `src/components/tools/ToolFilters.tsx`

Client component for tools filtering, mirror SkillFilters.

**Verification**: Updates URL params, triggers page reload

### Task 3.5: Create Tools listing page
**Files**: `src/app/[locale]/tools/page.tsx`, `src/app/[locale]/tools/loading.tsx`, `src/app/[locale]/tools/error.tsx`

Server component, mirror Task 2.5 structure.

**Verification**: Page renders, filters work, pagination works

### Task 3.6: Create Tool detail page
**Files**: `src/app/[locale]/tools/[slug]/page.tsx`

Tool detail with quick start and integration guide.

**Layout**:
- Breadcrumb navigation
- Title, category, tags, author
- Quick start (MarkdownRenderer)
- Integration guide (MarkdownRenderer)
- External links (Official website, Documentation)
- Related tools (3 cards)

**Verification**: Renders markdown, external links work


## Phase 4: Integration

### Task 4.1: Update Navbar
**Files**: `src/components/layout/Navbar.tsx`

Add "Skills" and "Tools" links to navigation.

**Location**: After existing nav links (Prompts, Community)

**Verification**: Links visible, navigate to correct pages

## Testing Checklist

After all tasks:
- [ ] `/skills` page renders with sample data
- [ ] `/skills` filters (category, tags, search) work
- [ ] `/skills` pagination works
- [ ] `/skills/[id]` detail page renders tutorial markdown
- [ ] `/tools` page renders with sample data
- [ ] `/tools` filters work
- [ ] `/tools` pagination works
- [ ] `/tools/[id]` detail page renders quick_start markdown
- [ ] Markdown renders correctly (headings, lists, code)
- [ ] Syntax highlighting works in code blocks
- [ ] External links open correctly
- [ ] Bilingual (zh/en) displays correctly
- [ ] Mobile responsive layout
- [ ] Empty states display when no data
- [ ] Error states handle gracefully
- [ ] Loading states display correctly

## Notes

- **SSR pattern**: Follow `src/app/[locale]/prompts/page.tsx` for server-side data fetching
- **Author profiles**: Batch fetch to avoid N+1 queries
- **Markdown**: Use `react-markdown` with `remark-gfm` for GitHub Flavored Markdown
- **Syntax highlighting**: Use `rehype-highlight` for code blocks
- **URL sync**: Filter components sync state to URL params
- **RDB warmup**: Implement similar warmup logic as Prompt library
- **Collapsible sections**: Use native `<details>` HTML element
- **Route naming**: Use `[slug]` consistently (slug = id)
- **Like/View tracking**: Deferred to future phase (Phase 5)
- **Create/Edit forms**: Deferred to future phase (Phase 5)

## Future Enhancements (Phase 5)

Not included in current plan:
- Like/unlike functionality with authentication
- View count tracking on detail pages
- Create/edit forms (`/skills/new`, `/tools/new`)
- Admin approval workflow
- Homepage ModulesShowcase integration
