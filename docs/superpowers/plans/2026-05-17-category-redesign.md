# Category System Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all 157 records across prompts/skills/tools to a unified 7-category taxonomy and update the UI to match.

**Architecture:** Database migration via SQL scripts, followed by UI updates to category theme colors and filter labels. No schema changes required.

**Tech Stack:** CloudBase MySQL, Next.js 14, Tailwind CSS v4, TypeScript

---

## File Structure

| File | Responsibility |
|------|---------------|
| `scripts/migrate-categories.sql` | One-time SQL migration for all 3 tables |
| `src/lib/category-theme.ts` | Category-to-color mapping for UI badges |
| `src/components/prompts/PromptFilters.tsx` | Prompt sidebar filter labels |
| `src/components/skills/SkillLayoutFilters.tsx` | Skill filter labels |
| `src/components/tools/ToolFilters.tsx` | Tool filter labels |
| `src/app/[locale]/prompts/page.tsx` | Prompt page subtitle text |
| `tests/category-migration.test.ts` | Verify no invalid categories remain |

---

## Task 1: Database Migration Script

**Files:**
- Create: `scripts/migrate-categories.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- ============================================
-- Category Migration: Unify to 7 categories
-- 选题 / 文献 / 数据 / 分析 / 写作 / 展示 / 投稿
-- ============================================

-- Prompts: 67 records
UPDATE prompt SET category = '投稿' WHERE category = '评审';
UPDATE prompt SET category = '分析' WHERE title IN (
  'EDA Agent系统提示词',
  'Modeling Agent系统提示词',
  '实验绘图推荐 Prompt',
  '/write-captions 图表标题生成',
  'Figure Factory Agent系统提示词',
  '学术图表与三线表规范化引擎',
  '生成图的标题 Prompt',
  '生成表的标题 Prompt'
);
UPDATE prompt SET category = '展示' WHERE title IN (
  '论文幻灯片生成提示词',
  '论文架构图设计 Prompt'
);
UPDATE prompt SET category = '选题' WHERE title IN (
  'Orchestrator Agent系统提示词',
  'Submission Agent系统提示词'
);
UPDATE prompt SET category = '投稿' WHERE title = '经济学期刊投稿指南';
UPDATE prompt SET category = '分析' WHERE category = '其他';

-- Skills: 45 records
UPDATE skill SET category = '投稿' WHERE category = '评审';
UPDATE skill SET category = '分析' WHERE title IN (
  'algorithm-design', 'code-debugging', 'compare', 'data-analysis', 'debug',
  'econ-visualization', 'experiment-code', 'figure-generation',
  'general-equilibrium-model-builder', 'math-reasoning', 'paper-to-code',
  'python-panel-data', 'R Econometrics', 'reproduce', 'stata',
  'Stata Regression', 'stata-c-plugins', 'symbolic-equation',
  'table-generation', '数据可视化模板', 'code-simplifier',
  'commit-push-pr', 'sdd', 'stata-skill-contributor', 'techdebt'
);
UPDATE skill SET category = '数据' WHERE title IN (
  'api-data-fetcher', 'dataset-curation', 'stata-data-cleaning', '数据清洗自动化'
);
UPDATE skill SET category = '选题' WHERE title = 'launch';
UPDATE skill SET category = '展示' WHERE title IN (
  'latex-econ-model', 'latex-formatting', 'latex-setup',
  'beamer-presentation', 'excalidraw-skill', 'slide-generation'
);
UPDATE skill SET category = '投稿' WHERE title = 'research-publishing';

-- Tools: 45 records
UPDATE tool SET category = '文献' WHERE category IN ('学术搜索', '文献管理');
UPDATE tool SET category = '数据' WHERE category IN ('政府统计', '经济金融', '法律数据库');
UPDATE tool SET category = '分析' WHERE category = '统计分析';
UPDATE tool SET category = '文献' WHERE title = 'Perplexity MCP';
UPDATE tool SET category = '数据' WHERE title = 'PostgreSQL MCP';
UPDATE tool SET category = '分析' WHERE title IN ('Filesystem MCP', 'GitHub MCP', 'Tableau MCP');
UPDATE tool SET category = '写作' WHERE title IN ('Notion MCP', 'Obsidian MCP');
UPDATE tool SET category = '展示' WHERE title = 'LaTeX PDF MCP';

-- Verify: should return 0 rows
SELECT 'Invalid categories remaining' as check_result, COUNT(*) as cnt
FROM (
  SELECT category FROM prompt WHERE category NOT IN ('选题','文献','数据','分析','写作','展示','投稿')
  UNION ALL
  SELECT category FROM skill WHERE category NOT IN ('选题','文献','数据','分析','写作','展示','投稿')
  UNION ALL
  SELECT category FROM tool WHERE category NOT IN ('选题','文献','数据','分析','写作','展示','投稿')
) t;
```

- [ ] **Step 2: Run the migration via MCP tool**

Use `manageSqlDatabase` with action `runStatement`, pass the SQL above.
Expected: all 3 UPDATE statements succeed, verification query returns `cnt = 0`.

- [ ] **Step 3: Commit the migration script**

```bash
git add scripts/migrate-categories.sql
git commit -m "chore: add category migration SQL for unified taxonomy"
```

---

## Task 2: Update Category Theme Colors

**Files:**
- Modify: `src/lib/category-theme.ts`

- [ ] **Step 1: Write the updated theme mapping**

Replace the entire file content:

```typescript
const CATEGORY_THEME: Record<string, string> = {
  // Unified research-stage categories
  选题: "border-violet-300 bg-violet-100 text-violet-800",
  Discovery: "border-violet-300 bg-violet-100 text-violet-800",

  文献: "border-sky-300 bg-sky-100 text-sky-800",
  Literature: "border-sky-300 bg-sky-100 text-sky-800",

  数据: "border-emerald-300 bg-emerald-100 text-emerald-800",
  Data: "border-emerald-300 bg-emerald-100 text-emerald-800",

  分析: "border-amber-300 bg-amber-100 text-amber-900",
  Analysis: "border-amber-300 bg-amber-100 text-amber-900",

  写作: "border-rose-300 bg-rose-100 text-rose-800",
  Writing: "border-rose-300 bg-rose-100 text-rose-800",

  展示: "border-purple-300 bg-purple-100 text-purple-800",
  Presentation: "border-purple-300 bg-purple-100 text-purple-800",

  投稿: "border-teal-300 bg-teal-100 text-teal-800",
  Submission: "border-teal-300 bg-teal-100 text-teal-800",

  // Legacy mappings (remove after migration confirmed)
  Research: "border-sky-300 bg-sky-100 text-sky-800",
  Coding: "border-rose-300 bg-rose-100 text-rose-800",
  "Data Analysis": "border-amber-300 bg-amber-100 text-amber-900",
  Visualization: "border-purple-300 bg-purple-100 text-purple-800",
  Automation: "border-amber-300 bg-amber-100 text-amber-900",
  "API Integration": "border-rose-300 bg-rose-100 text-rose-800",
  "AI Assistant": "border-purple-300 bg-purple-100 text-purple-800",
  "Reference Management": "border-blue-300 bg-blue-100 text-blue-800",

  Default: "border-[#d8cab3] bg-[#efe4d1] text-[#7f4a22]",
};

export function getCategoryTheme(category: string): string {
  return CATEGORY_THEME[category] ?? CATEGORY_THEME.Default;
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit src/lib/category-theme.ts`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/category-theme.ts
git commit -m "feat: update category theme colors for unified 7-category taxonomy"
```

---

## Task 3: Update Prompt Page Subtitle

**Files:**
- Modify: `src/app/[locale]/prompts/page.tsx:32-33`

- [ ] **Step 1: Update subtitle text**

Replace:
```typescript
subtitle: "浏览可复用的工作流系统，覆盖文献综述、数据分析、论文写作与同行评审。",
```
with:
```typescript
subtitle: "浏览可复用的工作流系统，覆盖选题、文献、数据、分析、写作、展示与投稿。",
```

And replace English subtitle:
```typescript
subtitle: "Browse reusable workflow systems for literature review, data analysis, paper writing, and peer review.",
```
with:
```typescript
subtitle: "Browse reusable workflow systems for discovery, literature, data, analysis, writing, presentation, and submission.",
```

- [ ] **Step 2: Commit**

```bash
git add src/app/[locale]/prompts/page.tsx
git commit -m "feat: update prompt page subtitle to reflect unified categories"
```

---

## Task 4: Add Migration Verification Test

**Files:**
- Create: `tests/category-migration.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { describe, it, expect } from "vitest";
import { serverDb } from "@/lib/rdb-server";

const VALID_CATEGORIES = [
  "选题", "文献", "数据", "分析", "写作", "展示", "投稿"
];

describe("Category migration", () => {
  it("should have no invalid categories in prompt table", async () => {
    const { data, error } = await serverDb
      .from("prompt")
      .select("category")
      .not("category", "in", `(${VALID_CATEGORIES.join(",")})`)
      .execute();

    expect(error).toBeNull();
    expect(data?.length ?? 0).toBe(0);
  });

  it("should have no invalid categories in skill table", async () => {
    const { data, error } = await serverDb
      .from("skill")
      .select("category")
      .not("category", "in", `(${VALID_CATEGORIES.join(",")})`)
      .execute();

    expect(error).toBeNull();
    expect(data?.length ?? 0).toBe(0);
  });

  it("should have no invalid categories in tool table", async () => {
    const { data, error } = await serverDb
      .from("tool")
      .select("category")
      .not("category", "in", `(${VALID_CATEGORIES.join(",")})`)
      .execute();

    expect(error).toBeNull();
    expect(data?.length ?? 0).toBe(0);
  });

  it("should have zero records in '其他' category across all tables", async () => {
    for (const table of ["prompt", "skill", "tool"]) {
      const { data, error } = await serverDb
        .from(table)
        .select("_id")
        .eq("category", "其他")
        .execute();

      expect(error).toBeNull();
      expect(data?.length ?? 0).toBe(0);
    }
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run tests/category-migration.test.ts`
Expected: 4 tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests/category-migration.test.ts
git commit -m "test: add category migration verification tests"
```

---

## Task 5: Cleanup Legacy Category Theme Mappings

**Files:**
- Modify: `src/lib/category-theme.ts`

- [ ] **Step 1: Remove legacy mappings after migration is live for 1 week**

Delete these lines from `CATEGORY_THEME`:
```typescript
  Research: "border-sky-300 bg-sky-100 text-sky-800",
  Coding: "border-rose-300 bg-rose-100 text-rose-800",
  "Data Analysis": "border-amber-300 bg-amber-100 text-amber-900",
  Visualization: "border-purple-300 bg-purple-100 text-purple-800",
  Automation: "border-amber-300 bg-amber-100 text-amber-900",
  "API Integration": "border-rose-300 bg-rose-100 text-rose-800",
  "AI Assistant": "border-purple-300 bg-purple-100 text-purple-800",
  "Reference Management": "border-blue-300 bg-blue-100 text-blue-800",
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/category-theme.ts
git commit -m "chore: remove legacy category theme mappings"
```

---

## Verification Checklist

Before marking complete:

- [ ] Run `SELECT DISTINCT category FROM prompt/skill/tool` — should return exactly 7 rows each
- [ ] Browse `/prompts`, `/skills`, `/tools` — verify 7 category tabs appear
- [ ] Click each category tab — verify filtered results load correctly
- [ ] Verify category badge colors render correctly on cards
- [ ] Run full test suite: `npx vitest run`

## Rollback Plan

If critical issues found within 24h:

```sql
-- Restore from backup (run before migration)
-- Or manually revert specific categories based on original mapping doc
```

The spec at `docs/superpowers/specs/2026-05-17-category-redesign-design.md` contains the full forward/backward mapping for reference.
