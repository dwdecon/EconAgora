# Skill Hub & Tool Center Implementation Plan

**Date**: 2026-04-01
**Spec**: [2026-04-01-skill-hub-tool-center-design.md](../specs/2026-04-01-skill-hub-tool-center-design.md)

## Overview

Implement two new resource pages: Skill Hub (`/skills`) and Tool Center (`/tools`). Both pages follow the Prompt library pattern with CloudBase RDB backend, featuring listing pages with filters/pagination and detail pages with markdown rendering.

## Implementation Strategy

Build in 3 phases:
1. **Database & Dependencies** - Set up tables and install packages
2. **Skills Pages** - Complete `/skills` listing and detail pages
3. **Tools Pages** - Complete `/tools` listing and detail pages

Each phase is independently testable. Skills and Tools share similar structure but have distinct data models and content rendering.

## Phase 1: Database & Dependencies

### Task 1.1: Install npm packages
**Files**: `package.json`

Install markdown rendering dependencies:
```bash
npm install react-markdown remark-gfm rehype-highlight
npm install -D @tailwindcss/typography
```

**Verification**: `npm list react-markdown remark-gfm rehype-highlight @tailwindcss/typography`

### Task 1.2: Create database tables
**Files**: New SQL script

Create `skill` and `tool` tables in CloudBase RDB via console or migration script.

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
**Files**: New seed script (optional)

Insert 3-5 sample records per table for testing.

**Verification**: Query returns sample data


## Phase 2: Skills Pages

### Task 2.1: Create MarkdownRenderer component
**Files**: `src/components/shared/MarkdownRenderer.tsx`

Reusable markdown renderer with syntax highlighting.

**Dependencies**: `react-markdown`, `remark-gfm`, `rehype-highlight`

**Props**:
- `content: string` - markdown content
- `className?: string` - optional wrapper class

**Verification**: Renders headings, lists, code blocks with syntax highlighting

### Task 2.2: Create SkillCard component
**Files**: `src/components/skills/SkillCard.tsx`

Card for skill listing grid, similar to PromptCard but adapted for skills.

**Props**:
- `skill: { id, title, description, category, tags, likeCount, viewCount, author }`

**Design**: Rounded card, category badge, title, description, tags, author, stats

**Verification**: Renders correctly, links to `/skills/[id]`

### Task 2.3: Create SkillFilters component
**Files**: `src/components/skills/SkillFilters.tsx`

Client component for category/tag/search filtering, similar to PromptFilters.

**Features**: Category dropdown, tag chips, search input, URL sync

**Verification**: Updates URL params, triggers page reload

### Task 2.4: Create Skills listing page
**Files**: `src/app/[locale]/skills/page.tsx`

Server component with data fetching, filtering, pagination.

**Structure**:
- PageHero (label, title, subtitle)
- Featured carousel (top 5 by like_count)
- SkillFilters
- Grid with CreateNewCard + SkillCard items
- Pagination

**Data fetching**:
- `fetchSkills()` - paginated query with filters
- `fetchFeaturedSkills()` - top 5 for carousel
- Batch author profiles

**i18n keys**: Add to `src/i18n/messages/*.json`

**Verification**: Page renders, filters work, pagination works


### Task 2.5: Create Skill detail page
**Files**: `src/app/[locale]/skills/[slug]/page.tsx`

Skill detail with full tutorial content.

**Layout**:
- Breadcrumb navigation
- Title, category, tags, author, like button
- Use cases section
- Tutorial (MarkdownRenderer)
- Code examples (collapsible)
- Related skills (3 cards)

**Data fetching**:
- `fetchSkillById(id)` - single record
- `fetchRelatedSkills(id, category)` - 3 related items

**Verification**: Renders markdown correctly, related items display

## Phase 3: Tools Pages

### Task 3.1: Create ToolCard component
**Files**: `src/components/tools/ToolCard.tsx`

Card for tool listing, similar to SkillCard but adapted for tools.

**Props**:
- `tool: { id, title, description, category, tags, likeCount, viewCount, author, officialUrl }`

**Design**: Rounded card, category badge, title, description, tags, author, stats, external link icon

**Verification**: Renders correctly, links to `/tools/[id]`

### Task 3.2: Create ToolFilters component
**Files**: `src/components/tools/ToolFilters.tsx`

Client component for tools filtering, mirrors SkillFilters.

**Verification**: Updates URL params, triggers page reload

### Task 3.3: Create Tools listing page
**Files**: `src/app/[locale]/tools/page.tsx`

Server component for tools listing.

**Structure**: Same as Skills listing page with ToolCard and ToolFilters

**Verification**: Page renders, filters work, pagination works

### Task 3.4: Create Tool detail page
**Files**: `src/app/[locale]/tools/[slug]/page.tsx`

Tool detail with quick start and integration guide.

**Layout**:
- Breadcrumb navigation
- Title, category, tags, author, like button
- Quick start (MarkdownRenderer)
- Integration guide (MarkdownRenderer)
- External links (Official website, Documentation)
- Related tools (3 cards)

**Data fetching**:
- `fetchToolById(id)` - single record
- `fetchRelatedTools(id, category)` - 3 related items

**Verification**: Renders markdown, external links work

## Phase 4: Integration

### Task 4.1: Update Navbar
**Files**: `src/components/layout/Navbar.tsx`

Add "Skills" and "Tools" links to navigation.

**Location**: After existing nav links (Prompts, Community)

**Verification**: Links visible, navigate to correct pages

### Task 4.2: Update i18n messages
**Files**: `src/i18n/messages/zh.json`, `src/i18n/messages/en.json`

Add translation keys for Skills and Tools pages.

**Keys needed**:
- `skills.label`, `skills.title`, `skills.subtitle`
- `skills.filters.category`, `skills.filters.tags`, `skills.filters.search`
- `skills.card.author`, `skills.card.views`, `skills.card.likes`
- `skills.empty.title`, `skills.empty.hint`
- `tools.*` (same structure)

**Verification**: Bilingual content displays correctly

### Task 4.3: Update ModulesShowcase
**Files**: `src/components/landing/ModulesShowcase.tsx`

Add Skills and Tools as new tabs/links.

**Verification**: Skills and Tools visible in homepage modules section

## Testing Checklist

After all tasks:
- [ ] `/skills` page renders with sample data
- [ ] `/skills` filters (category, tags, search) work
- [ ] `/skills` pagination works
- [ ] `/skills/[id]` detail page renders tutorial
- [ ] `/tools` page renders with sample data
- [ ] `/tools` filters work
- [ ] `/tools` pagination works
- [ ] `/tools/[id]` detail page renders quick_start
- [ ] Markdown renders correctly (headings, lists, code)
- [ ] Syntax highlighting works in code blocks
- [ ] External links open in new tab
- [ ] Bilingual (zh/en) displays correctly
- [ ] Mobile responsive layout
- [ ] Empty states display when no data
- [ ] Error states handle gracefully

## Notes

- **SSR pattern**: Follow existing `prompt/page.tsx` pattern for server-side data fetching
- **Author profiles**: Batch fetch to avoid N+1 queries
- **Markdown**: Use `react-markdown` with `remark-gfm` for GFM support
- **Syntax highlighting**: Use `rehype-highlight` for code blocks
- **URL sync**: Filter components sync state to URL params
- **RDB warmup**: Implement similar warmup logic as Prompt library
