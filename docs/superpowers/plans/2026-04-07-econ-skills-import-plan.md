# Implementation Plan: Econ Skills Import

**Spec**: `docs/superpowers/specs/2026-04-07-econ-skills-import-design.md`
**Date**: 2026-04-07

---

## Step 1 — Database Migration

Run the following DDL in CloudBase RDB console:

```sql
ALTER TABLE skill
  ADD COLUMN workflow_stage VARCHAR(100) NULL,
  ADD COLUMN platform       VARCHAR(255) NULL,
  ADD COLUMN skill_md       TEXT NULL,
  ADD COLUMN source_repo    VARCHAR(255) NULL,
  ADD COLUMN source_slug    VARCHAR(255) NULL;

CREATE UNIQUE INDEX idx_source_identity ON skill (source_repo, source_slug);
```

**Verify**: Query `SHOW COLUMNS FROM skill` and confirm all 5 columns exist.

---

## Step 2 — Update `Skill` Interface and `lib/skills.ts`

File: `src/lib/skills.ts`

- Add to `Skill` interface: `skillMd`, `workflowStage`, `platform`, `sourceRepo`, `sourceSlug`
- In all fetch functions, map new DB columns:
  - `skill.skill_md` → `skillMd`
  - `skill.workflow_stage` → `workflowStage`
  - `skill.platform` → `platform`
  - `skill.source_repo` → `sourceRepo`
  - `skill.source_slug` → `sourceSlug`
- Keep existing `tutorial`, `codeExamples`, `useCases` fields intact (no removal)

---

## Step 3 — Update Skill Detail Page

File: `src/app/[locale]/skills/[slug]/page.tsx`

- Change content rendering to use `skill.skillMd ?? skill.tutorial` as the Markdown source
- Pass to `<MarkdownRenderer>` (or existing markdown render mechanism)
- In the right sidebar "About" card, add:
  - `workflowStage` badge (if present)
  - `platform` chip list (split on comma, if present)

---

## Step 4 — Install Import Dependencies

```bash
npm install gray-matter
```

`simple-git` is optional — use `child_process.execSync` to call `git clone` instead.

---

## Step 5 — Write Import Script

File: `scripts/import-econ-skills.ts`

```
const CATEGORY_MAP = {
  ideation: "Writing",
  literature: "Writing",
  theory: "Writing",
  data: "Data Analysis",
  analysis: "Data Analysis",
  writing: "Writing",
  communication: "Visualization",
  engineering: "Automation",
};
```

Logic:
1. `git clone https://github.com/meleantonio/awesome-econ-ai-stuff /tmp/econ-skills`
2. `glob("_skills/**/SKILL.md")` — find all skill files
3. For each file:
   - Parse frontmatter with `gray-matter`
   - Extract `name`, `description`, `workflow_stage`, `compatibility[]`
   - Derive `source_slug` = skill folder name
   - Derive `category` from parent dir via `CATEGORY_MAP`
   - Build row object
4. Upsert via `serverDb` with conflict target `(source_repo, source_slug)`
5. Print `✓ imported: <slug>` or `✗ failed: <slug> — <error>`

---

## Step 6 — Run Import Script

```bash
npx tsx scripts/import-econ-skills.ts
```

Verify in CloudBase console: query `SELECT title, category, workflow_stage, source_slug FROM skill WHERE source_repo IS NOT NULL`.

---

## Step 7 — Smoke Test

- Open `/skills` — confirm imported skills appear in the listing
- Filter by `Data Analysis` and `Writing` — confirm imported skills show up
- Open one imported skill detail page — confirm SKILL.md content renders correctly
- Confirm `workflowStage` and `platform` appear in the sidebar

---

## Checkpoints

| Step | Done? |
|------|-------|
| 1. DB migration | ☐ |
| 2. `lib/skills.ts` interface update | ☐ |
| 3. Detail page rendering | ☐ |
| 4. Install `gray-matter` | ☐ |
| 5. Write import script | ☐ |
| 6. Run import | ☐ |
| 7. Smoke test | ☐ |
