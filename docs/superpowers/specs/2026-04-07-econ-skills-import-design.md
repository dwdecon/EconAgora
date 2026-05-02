# Econ Skills Import Design Specification

**Date**: 2026-04-07
**Status**: Draft

## Overview

Import skills from `meleantonio/awesome-econ-ai-stuff` into EconAgora's Skill Hub. Each skill's complete SKILL.md content is stored verbatim and rendered as Markdown on the detail page.

## Database Changes

Four new columns on the existing `skill` table (additive only — no renames or drops):

```sql
ALTER TABLE skill
  ADD COLUMN workflow_stage VARCHAR(100) NULL,
  ADD COLUMN platform       VARCHAR(255) NULL,
  ADD COLUMN skill_md       TEXT NULL,
  ADD COLUMN source_repo    VARCHAR(255) NULL,
  ADD COLUMN source_slug    VARCHAR(255) NULL,
  ADD UNIQUE INDEX idx_source_identity (source_repo, source_slug);
```

- `workflow_stage` — SKILL.md frontmatter `workflow_stage`
- `platform` — comma-separated from SKILL.md frontmatter `compatibility`
- `skill_md` — full SKILL.md Markdown body (new field; `tutorial` is kept and read via `skill_md ?? tutorial`)
- `source_repo` + `source_slug` — stable external identity used as the upsert key (e.g. `meleantonio/awesome-econ-ai-stuff` + `r-econometrics`)

> `tutorial`, `code_examples`, and `use_cases` are **not renamed or dropped**. The app dual-reads `skill_md ?? tutorial` during the transition. Old columns are removed only after all consumers are migrated.

## Field Mapping

| awesome-econ-ai-stuff SKILL.md | `skill` table column |
|-------------------------------|----------------------|
| `name` (frontmatter) | `title` |
| `description` (frontmatter) | `description` |
| `workflow_stage` (frontmatter) | `workflow_stage` (new) |
| `compatibility` (frontmatter, array → join) | `platform` (new) |
| Full Markdown body | `skill_md` (new) |
| Source directory → normalized (see map below) | `category` |
| Repo name | `source_repo` = `meleantonio/awesome-econ-ai-stuff` |
| Skill folder name | `source_slug` (e.g. `r-econometrics`) |
| — | `author_id` = system admin UID |
| — | `status` = `PUBLISHED` |
| — | `tags` = `[]` |

### Category Normalization Map

| Source directory | → `category` |
|-----------------|--------------|
| `ideation` | `Writing` |
| `literature` | `Writing` |
| `theory` | `Writing` |
| `data` | `Data Analysis` |
| `analysis` | `Data Analysis` |
| `writing` | `Writing` |
| `communication` | `Visualization` |
| `engineering` | `Automation` |

## Import Script

**Location**: `scripts/import-econ-skills.ts`

**Steps**:
1. Clone `https://github.com/meleantonio/awesome-econ-ai-stuff` to a temp directory
2. Walk `_skills/` recursively, find every `SKILL.md`
3. Parse YAML frontmatter (using `gray-matter`)
4. Extract `name`, `description`, `workflow_stage`, `compatibility`
5. Derive `source_slug` from skill folder name (e.g. `r-econometrics`)
6. Map source directory → `category` using the normalization map above
7. Store full Markdown body in `skill_md`
8. Upsert into `skill` table keyed on `(source_repo, source_slug)` — safe for reruns
9. Log success/failure per skill

**Dependencies needed**:
- `gray-matter` — YAML frontmatter parsing
- `simple-git` or `child_process` — clone repo

## Detail Page Changes

The skill detail page (`/skills/[slug]/page.tsx`) currently renders `tutorial`, `codeExamples`, and `useCases` as separate sections. After this change:

- Replace all three sections with a single `<MarkdownRenderer content={skill.skill_md} />` block
- Remove `codeExamples` and `useCases` from the `Skill` interface
- Add `workflowStage` and `platform` to the `Skill` interface

**Right sidebar additions** (in the "About" card):
- `workflow_stage` — displayed as a badge below category
- `platform` — displayed as comma-separated chip list

## Skill Interface Update

```ts
export interface Skill {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  skillMd: string | null;       // new; falls back to tutorial during transition
  workflowStage: string | null; // new
  platform: string | null;      // new
  sourceRepo: string | null;    // new
  sourceSlug: string | null;    // new
  likeCount: number;
  viewCount: number;
  author: { id: string; name: string; avatar: string | null };
  createdAt: string;
}
```

## Files to Change

| File | Change |
|------|--------|
| `src/lib/skills.ts` | Add `skillMd`/`workflowStage`/`platform`/`sourceRepo`/`sourceSlug`; read `skill_md ?? tutorial` |
| `src/app/[locale]/skills/[slug]/page.tsx` | Render `skillMd ?? tutorial` via MarkdownRenderer |
| `scripts/import-econ-skills.ts` | New file — import script |
| CloudBase RDB | `ALTER TABLE` statements above |

## Out of Scope

- Incremental sync / scheduled updates
- Admin UI for managing imported skills
- Tag enrichment for imported skills
- Compatibility filter on listing page (can be added later)
- Dropping `tutorial`, `code_examples`, `use_cases` columns (deferred until all consumers migrated)
