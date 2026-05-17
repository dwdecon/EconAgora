# Category System Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all 157 records to a unified 7-category taxonomy with subcategory support, and update the UI sidebar to an accordion-style filter with expandable secondary tags.

**Architecture:**
- Database: Add `subcategory` VARCHAR column to all 3 tables; migrate data via SQL
- Backend: Update list queries to support `category + subcategory` combined filtering
- Frontend: Replace flat sidebar with accordion component; expand/collapse on click; secondary tags filter within the selected category

**Tech Stack:** CloudBase MySQL, Next.js 14, Tailwind CSS v4, TypeScript

---

## File Structure

| File | Responsibility |
|------|---------------|
| `scripts/migrate-categories.sql` | Add `subcategory` column + migrate all 157 records |
| `scripts/seed-subcategories.sql` | Insert subcategory definitions for reference |
| `src/lib/category-theme.ts` | Category-to-color mapping |
| `src/lib/subcategory-data.ts` | Hardcoded subcategory list per category (7 categories × N tags) |
| `src/components/shared/AccordionSidebar.tsx` | Reusable accordion sidebar with expand/collapse |
| `src/components/prompts/PromptFilters.tsx` | Prompt filter wrapper using AccordionSidebar |
| `src/components/skills/SkillLayoutFilters.tsx` | Skill filter wrapper using AccordionSidebar |
| `src/components/tools/ToolFilters.tsx` | Tool filter wrapper using AccordionSidebar |
| `src/lib/prompts.ts` | Update list query to accept `subcategory` param |
| `src/lib/skills.ts` | Update list query to accept `subcategory` param |
| `src/lib/tools.ts` | Update list query to accept `subcategory` param |
| `src/app/[locale]/prompts/page.tsx` | Pass `subcategory` from searchParams to query |
| `src/app/[locale]/skills/page.tsx` | Pass `subcategory` from searchParams to query |
| `src/app/[locale]/tools/page.tsx` | Pass `subcategory` from searchParams to query |
| `tests/category-migration.test.ts` | Verify migration integrity |

---

## Task 1: Database Schema Update

**Files:**
- Modify: `scripts/migrate-categories.sql`

- [ ] **Step 1: Add `subcategory` column to all 3 tables**

```sql
-- Add subcategory column
ALTER TABLE prompt ADD COLUMN subcategory VARCHAR(100) DEFAULT NULL AFTER category;
ALTER TABLE skill ADD COLUMN subcategory VARCHAR(100) DEFAULT NULL AFTER category;
ALTER TABLE tool ADD COLUMN subcategory VARCHAR(100) DEFAULT NULL AFTER category;

-- Create index for filtering performance
CREATE INDEX idx_prompt_subcategory ON prompt(subcategory);
CREATE INDEX idx_skill_subcategory ON skill(subcategory);
CREATE INDEX idx_tool_subcategory ON tool(subcategory);
```

- [ ] **Step 2: Migrate categories (primary)**

```sql
-- Prompts: update primary category
UPDATE prompt SET category = '投稿' WHERE category = '评审';
UPDATE prompt SET category = '分析' WHERE title IN (
  'EDA Agent系统提示词', 'Modeling Agent系统提示词', '实验绘图推荐 Prompt',
  '/write-captions 图表标题生成', 'Figure Factory Agent系统提示词',
  '学术图表与三线表规范化引擎', '生成图的标题 Prompt', '生成表的标题 Prompt'
);
UPDATE prompt SET category = '展示' WHERE title IN ('论文幻灯片生成提示词', '论文架构图设计 Prompt');
UPDATE prompt SET category = '选题' WHERE title IN ('Orchestrator Agent系统提示词', 'Submission Agent系统提示词');
UPDATE prompt SET category = '投稿' WHERE title = '经济学期刊投稿指南';
UPDATE prompt SET category = '分析' WHERE category = '其他';

-- Skills: update primary category
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
UPDATE skill SET category = '数据' WHERE title IN ('api-data-fetcher', 'dataset-curation', 'stata-data-cleaning', '数据清洗自动化');
UPDATE skill SET category = '选题' WHERE title = 'launch';
UPDATE skill SET category = '展示' WHERE title IN ('latex-econ-model', 'latex-formatting', 'latex-setup', 'beamer-presentation', 'excalidraw-skill', 'slide-generation');
UPDATE skill SET category = '投稿' WHERE title = 'research-publishing';

-- Tools: update primary category
UPDATE tool SET category = '文献' WHERE category IN ('学术搜索', '文献管理');
UPDATE tool SET category = '数据' WHERE category IN ('政府统计', '经济金融', '法律数据库');
UPDATE tool SET category = '分析' WHERE category = '统计分析';
UPDATE tool SET category = '文献' WHERE title = 'Perplexity MCP';
UPDATE tool SET category = '数据' WHERE title = 'PostgreSQL MCP';
UPDATE tool SET category = '分析' WHERE title IN ('Filesystem MCP', 'GitHub MCP', 'Tableau MCP');
UPDATE tool SET category = '写作' WHERE title IN ('Notion MCP', 'Obsidian MCP');
UPDATE tool SET category = '展示' WHERE title = 'LaTeX PDF MCP';
```

- [ ] **Step 3: Migrate subcategories (secondary)**

```sql
-- Prompts subcategories
UPDATE prompt SET subcategory = '研究规划' WHERE title IN ('7阶段深度研究Prompt模式', 'PaperPilot论文规划阶段', 'PhD研究计划生成', 'Research PRD Agent', 'Orchestrator Agent系统提示词');
UPDATE prompt SET subcategory = '选题评估' WHERE title = 'Conceptual Framework Agent';
UPDATE prompt SET subcategory = '计量' WHERE title IN ('模型/方法选择建议', '计量经济学分析助手', 'Modeling Agent');
UPDATE prompt SET subcategory = '检索' WHERE title IN ('Deep Literature Agent', 'PaperPilot文献检索');
UPDATE prompt SET subcategory = '阅读' WHERE title = 'Reverse Brief 逆向简报';
UPDATE prompt SET subcategory = '综述' WHERE title = '经济学文献综述助手';
UPDATE prompt SET subcategory = '清洗' WHERE title IN ('Data QA Agent', '质性访谈标准化');
UPDATE prompt SET subcategory = '可视化' WHERE title = 'EDA Agent';
UPDATE prompt SET subcategory = '图表' WHERE title IN ('实验绘图推荐', '/write-captions 图表标题生成', 'Figure Factory Agent系统提示词', '生成图的标题 Prompt', '生成表的标题 Prompt');
UPDATE prompt SET subcategory = '三线表' WHERE title = '学术图表与三线表规范化引擎';
UPDATE prompt SET subcategory = '讨论章节' WHERE title = '/write-discussion';
UPDATE prompt SET subcategory = '摘要/引言' WHERE title = '/write-frontmatter';
UPDATE prompt SET subcategory = '方法章节' WHERE title = '/write-methods';
UPDATE prompt SET subcategory = '结果章节' WHERE title = '/write-results';
UPDATE prompt SET subcategory = '引用格式' WHERE title = 'APA 7th引注生成';
UPDATE prompt SET subcategory = '结构' WHERE title IN ('PaperPilot论文章节撰写', 'Prompt1：研究问题结构生成', 'Prompt2：论文结构框架设计', 'Prompt3：研究设计结构模板', 'Prompt4：讨论结构设计', 'Prompt5：技术路线建模', 'Prompt6：章节微结构生成', 'Prompt7：科研结构终极指令', '学术论文结构优化');
UPDATE prompt SET subcategory = '引用管理' WHERE title = 'Reference Agent';
UPDATE prompt SET subcategory = '起草' WHERE title = 'Scientific Writer Agent';
UPDATE prompt SET subcategory = '翻译' WHERE title IN ('中转中 Prompt（Word中文论文）', '中转英 Prompt（顶尖科研写作专家）', '英转中 Prompt');
UPDATE prompt SET subcategory = '润色' WHERE title IN ('去AI味润色 Prompt（LaTeX英文）', '去AI味（Word中文）', '扩写 Prompt', '缩写 Prompt', '表达润色 Prompt（英文论文）', '表达润色（中文论文）', '逻辑检查 Prompt');
UPDATE prompt SET subcategory = '引言' WHERE title = '漏斗型引言写作模板';
UPDATE prompt SET subcategory = '摘要' WHERE title = '结构化摘要写作模板（英文）';
UPDATE prompt SET subcategory = '结论' WHERE title = '结论与展望写作模板';
UPDATE prompt SET subcategory = '幻灯片' WHERE title = '论文幻灯片生成提示词';
UPDATE prompt SET subcategory = '排版' WHERE title = '论文架构图设计 Prompt';
UPDATE prompt SET subcategory = '审稿回复' WHERE title IN ('Ai-Review Chain-of-Thought审稿提示词', 'Ai-Review Few-Shot审稿提示词（经济管理示例）', 'Ai-Review Prompt Comparison Mode', 'Ai-Review Reverse Prompt（反推有效提示词）', 'Ai-Review SoT审稿提示词', 'Ai-Review 图表与可视化审稿提示词', 'Reviewer Agent系统提示词', '实验分析 Reviewer 视角 Prompt');
UPDATE prompt SET subcategory = '综合' WHERE title = 'NATURE 推荐的30条科研指令';
UPDATE prompt SET subcategory = '投稿指南' WHERE title IN ('Submission Agent系统提示词', '经济学期刊投稿指南');

-- Skills subcategories
UPDATE skill SET subcategory = '选题评估' WHERE title IN ('atomic-decomposition', 'idea-generation', 'novelty-assessment', 'research-ideation');
UPDATE skill SET subcategory = '研究规划' WHERE title IN ('experiment-design', 'research-planning', 'launch');
UPDATE skill SET subcategory = '引用管理' WHERE title = 'citation-management';
UPDATE skill SET subcategory = '检索' WHERE title IN ('deep-research', 'github-research', 'literature-research', 'literature-search');
UPDATE skill SET subcategory = '综述' WHERE title IN ('lit-review-assistant', 'literature-review', 'survey-generation', '文献综述生成器', 'related-work-writing');
UPDATE skill SET subcategory = '编程' WHERE title IN ('algorithm-design', 'code-debugging', 'debug', 'experiment-code', 'paper-to-code', 'code-simplifier', 'commit-push-pr', 'sdd', 'techdebt');
UPDATE skill SET subcategory = '获取' WHERE title = 'api-data-fetcher';
UPDATE skill SET subcategory = '清洗' WHERE title IN ('dataset-curation', 'stata-data-cleaning', '数据清洗自动化');
UPDATE skill SET subcategory = '因果推断' WHERE title IN ('backward-traceability', 'reproduce');
UPDATE skill SET subcategory = '计量' WHERE title IN ('compare', 'data-analysis', 'math-reasoning');
UPDATE skill SET subcategory = '可视化' WHERE title IN ('econ-visualization', '数据可视化模板');
UPDATE skill SET subcategory = '图表' WHERE title = 'figure-generation';
UPDATE skill SET subcategory = '建模' WHERE title IN ('general-equilibrium-model-builder', 'symbolic-equation');
UPDATE skill SET subcategory = '面板数据' WHERE title = 'python-panel-data';
UPDATE skill SET subcategory = 'R' WHERE title = 'R Econometrics';
UPDATE skill SET subcategory = 'Stata' WHERE title IN ('stata', 'Stata Regression', 'stata-c-plugins', 'stata-skill-contributor');
UPDATE skill SET subcategory = '三线表' WHERE title = 'table-generation';
UPDATE skill SET subcategory = '起草' WHERE title IN ('academic-paper-writer', 'econ-write', 'paper-writing');
UPDATE skill SET subcategory = '结构' WHERE title IN ('paper-assembly', 'paper-compilation', 'paper-writing-section');
UPDATE skill SET subcategory = '排版' WHERE title IN ('latex-econ-model', 'latex-formatting', 'latex-setup');
UPDATE skill SET subcategory = '幻灯片' WHERE title IN ('beamer-presentation', 'slide-generation');
UPDATE skill SET subcategory = '图表' WHERE title = 'excalidraw-skill';
UPDATE skill SET subcategory = '审稿回复' WHERE title IN ('paper-revision', 'paper-verification', 'rebuttal-writing', 'reviewer-defense', 'self-review', 'strategic-revision');
UPDATE skill SET subcategory = '投稿指南' WHERE title = 'research-publishing';

-- Tools subcategories
UPDATE tool SET subcategory = '检索' WHERE title IN ('BioMCP', 'openalex-research-mcp', 'arxiv-mcp-server', 'semantic-scholar-mcp', 'Perplexity MCP', 'CNKI MCP');
UPDATE tool SET subcategory = '引用管理' WHERE title IN ('endnote-mcp', 'mendeley-mcp', 'zotero-mcp', 'zotero-mcp-lite', 'zotero-translator-mcp-server');
UPDATE tool SET subcategory = '阅读' WHERE title = 'paperpal';
UPDATE tool SET subcategory = '获取' WHERE title IN ('data.gouv.fr MCP', 'datagov-mcp', 'EU Parliament MCP', 'India NSO eSankhyiki MCP', 'OpenDataMCP', 'U.S. Census Bureau MCP', 'alpha-vantage-mcp', 'data360-mcp', 'fred-mcp-server', 'fred-mcp-server (floriancaro)', 'polygon-mcp', 'yahoo-finance-mcp');
UPDATE tool SET subcategory = '法律数据' WHERE title IN ('CourtListener MCP', 'French Law MCP', 'Legal Knowledge MCP', 'LegalMCP', 'pkulaw-mcp-router', '北大法宝 MCP');
UPDATE tool SET subcategory = '编程' WHERE title IN ('Filesystem MCP', 'GitHub MCP', 'Jupyter MCP Server', 'mcptools');
UPDATE tool SET subcategory = '数据处理' WHERE title = 'excel-mcp-server';
UPDATE tool SET subcategory = 'MATLAB' WHERE title = 'MATLAB MCP Core Server';
UPDATE tool SET subcategory = 'Stata' WHERE title IN ('mcp-stata', 'stata-mcp');
UPDATE tool SET subcategory = 'R' WHERE title = 'rmcp';
UPDATE tool SET subcategory = 'SPSS' WHERE title = 'SPSS-MCP';
UPDATE tool SET subcategory = '可视化' WHERE title = 'Tableau MCP';
UPDATE tool SET subcategory = '笔记' WHERE title IN ('Notion MCP', 'Obsidian MCP');
UPDATE tool SET subcategory = '数据库' WHERE title = 'PostgreSQL MCP';
UPDATE tool SET subcategory = '排版' WHERE title = 'LaTeX PDF MCP';
```

- [ ] **Step 4: Verify migration**

```sql
-- Check for any NULL subcategories (should be 0 after full migration)
SELECT 'prompts with null subcategory' as check_name, COUNT(*) as cnt FROM prompt WHERE subcategory IS NULL;
SELECT 'skills with null subcategory' as check_name, COUNT(*) as cnt FROM skill WHERE subcategory IS NULL;
SELECT 'tools with null subcategory' as check_name, COUNT(*) as cnt FROM tool WHERE subcategory IS NULL;

-- Check invalid categories remain
SELECT 'invalid categories' as check_name, COUNT(*) as cnt FROM (
  SELECT category FROM prompt WHERE category NOT IN ('选题','文献','数据','分析','写作','展示','投稿')
  UNION ALL SELECT category FROM skill WHERE category NOT IN ('选题','文献','数据','分析','写作','展示','投稿')
  UNION ALL SELECT category FROM tool WHERE category NOT IN ('选题','文献','数据','分析','写作','展示','投稿')
) t;
```

- [ ] **Step 5: Run via MCP tool and commit**

Use `manageSqlDatabase` action `runStatement` for each block.
Expected: all verification queries return `cnt = 0`.

```bash
git add scripts/migrate-categories.sql
git commit -m "chore: add subcategory column and migrate all 157 records"
```

---

## Task 2: Create Subcategory Data File

**Files:**
- Create: `src/lib/subcategory-data.ts`

- [ ] **Step 1: Write the subcategory definitions**

```typescript
export interface SubcategoryGroup {
  category: string;
  subcategories: string[];
}

export const SUBCATEGORY_MAP: Record<string, string[]> = {
  选题: ["趋势分析", "选题评估", "研究规划", "IDE"],
  文献: ["检索", "阅读", "笔记", "引用管理", "Zotero", "Mendeley", "EndNote"],
  数据: ["获取", "清洗", "匹配", "FRED", "World Bank", "Census", "中国统计", "OpenAlex", "法律数据库"],
  分析: ["计量", "因果推断", "面板数据", "DID", "Stata", "R", "Python", "MATLAB", "SPSS", "Jupyter", "图表", "三线表"],
  写作: ["起草", "润色", "翻译", "结构", "APA", "方法章节", "结果章节"],
  展示: ["排版", "幻灯片", "Beamer", "海报", "Excalidraw"],
  投稿: ["期刊选择", "审稿回复", "格式检查", "投稿指南"],
};

export function getSubcategories(category: string): string[] {
  return SUBCATEGORY_MAP[category] ?? [];
}

export function getAllCategories(): string[] {
  return Object.keys(SUBCATEGORY_MAP);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/subcategory-data.ts
git commit -m "feat: add subcategory definitions for 7-category taxonomy"
```

---

## Task 3: Build Accordion Sidebar Component

**Files:**
- Create: `src/components/shared/AccordionSidebar.tsx`

- [ ] **Step 1: Write the reusable accordion sidebar**

```tsx
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { getSubcategories } from "@/lib/subcategory-data";

interface AccordionSidebarProps {
  categories: string[];
  basePath: string;
}

export function AccordionSidebar({ categories, basePath }: AccordionSidebarProps) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";
  const currentSubcategory = searchParams.get("subcategory") || "";
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(currentCategory ? [currentCategory] : [])
  );

  function navigate(params: URLSearchParams) {
    const query = params.toString();
    const scrollPosition = window.scrollY;
    router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPosition, behavior: "instant" });
    });
  }

  function toggleCategory(category: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  function selectCategory(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    params.delete("subcategory");
    params.delete("page");
    navigate(params);
  }

  function selectSubcategory(category: string, subcategory: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", category);
    params.set("subcategory", subcategory);
    params.delete("page");
    navigate(params);
  }

  const allItem = { value: "", label: locale === "en" ? "All Categories" : "全部" };

  return (
    <div className="sticky top-24 space-y-6">
      <div>
        <h3 className="mb-3 px-2 text-sm font-medium text-[var(--color-text-secondary)]">
          {locale === "en" ? "Categories" : "分类"}
        </h3>
        <ul className="space-y-1">
          {/* All categories button */}
          <li>
            <button
              type="button"
              onClick={() => selectCategory("")}
              className={`flex w-full items-center rounded-full border px-4 py-2.5 text-[14px] transition-colors ${
                !currentCategory
                  ? "border-[var(--color-text-primary)] bg-[var(--color-text-primary)] font-medium text-[var(--color-bg)]"
                  : "border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <span>{allItem.label}</span>
            </button>
          </li>

          {/* Category groups */}
          {categories.map((category) => {
            const isExpanded = expanded.has(category);
            const isActive = currentCategory === category && !currentSubcategory;
            const subcategories = getSubcategories(category);

            return (
              <li key={category} className="space-y-1">
                {/* Category header */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface)] transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectCategory(category)}
                    className={`flex flex-1 items-center rounded-full border px-4 py-2 text-[14px] transition-colors ${
                      isActive
                        ? "border-[var(--color-text-primary)] bg-[var(--color-text-primary)] font-medium text-[var(--color-bg)]"
                        : currentCategory === category
                        ? "border-[var(--color-border-hover)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]"
                        : "border-transparent bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    <span>{category}</span>
                  </button>
                </div>

                {/* Subcategory list */}
                {isExpanded && subcategories.length > 0 && (
                  <ul className="ml-5 space-y-0.5 border-l border-[var(--color-border)] pl-3">
                    {subcategories.map((sub) => {
                      const isSubActive = currentCategory === category && currentSubcategory === sub;
                      return (
                        <li key={sub}>
                          <button
                            type="button"
                            onClick={() => selectSubcategory(category, sub)}
                            className={`flex w-full items-center rounded-full px-4 py-1.5 text-[13px] transition-colors ${
                              isSubActive
                                ? "bg-[var(--color-bg-surface-strong)] font-medium text-[var(--color-text-primary)]"
                                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                            }`}
                          >
                            <span>{sub}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/AccordionSidebar.tsx
git commit -m "feat: add reusable accordion sidebar with subcategory support"
```

---

## Task 4: Update Filter Components

**Files:**
- Modify: `src/components/prompts/PromptFilters.tsx`
- Modify: `src/components/skills/SkillLayoutFilters.tsx`
- Modify: `src/components/tools/ToolFilters.tsx`

- [ ] **Step 1: Replace PromptSidebarFilters with AccordionSidebar**

In `src/components/prompts/PromptFilters.tsx`:
- Replace the entire `PromptSidebarFilters` function with:

```tsx
import { AccordionSidebar } from "@/components/shared/AccordionSidebar";

export function PromptSidebarFilters({ categories }: { categories: string[] }) {
  return <AccordionSidebar categories={categories} basePath="/prompts" />;
}
```

- [ ] **Step 2: Replace SkillSidebar with AccordionSidebar**

In `src/components/skills/SkillLayoutFilters.tsx`:
- Replace the entire `SkillSidebar` function with:

```tsx
import { AccordionSidebar } from "@/components/shared/AccordionSidebar";

export function SkillSidebar({ categories }: { categories: string[] }) {
  return <AccordionSidebar categories={categories} basePath="/skills" />;
}
```

- [ ] **Step 3: Replace ToolSidebarFilters with AccordionSidebar**

In `src/components/tools/ToolFilters.tsx`:
- Replace the entire `ToolSidebarFilters` function with:

```tsx
import { AccordionSidebar } from "@/components/shared/AccordionSidebar";

export function ToolSidebarFilters({ categories }: { categories: string[] }) {
  return <AccordionSidebar categories={categories} basePath="/tools" />;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/prompts/PromptFilters.tsx src/components/skills/SkillLayoutFilters.tsx src/components/tools/ToolFilters.tsx
git commit -m "feat: replace flat sidebars with accordion sidebar in all 3 modules"
```

---

## Task 5: Update Backend Queries

**Files:**
- Modify: `src/lib/prompts.ts`
- Modify: `src/lib/skills.ts`
- Modify: `src/lib/tools.ts`

- [ ] **Step 1: Update list function signatures to accept `subcategory`**

In each file, update the list params interface:

```typescript
interface ListParams {
  page?: number;
  category?: string;
  subcategory?: string;  // ADD THIS
  tag?: string;
  search?: string;
}
```

- [ ] **Step 2: Add subcategory filter to query builder**

In each file's list function, after the existing category filter block, add:

```typescript
if (subcategory) {
  countQuery = countQuery.eq("subcategory", subcategory);
  dataQuery = dataQuery.eq("subcategory", subcategory);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/prompts.ts src/lib/skills.ts src/lib/tools.ts
git commit -m "feat: add subcategory filtering to list queries"
```

---

## Task 6: Update Page Components

**Files:**
- Modify: `src/app/[locale]/prompts/page.tsx`
- Modify: `src/app/[locale]/skills/page.tsx`
- Modify: `src/app/[locale]/tools/page.tsx`

- [ ] **Step 1: Extract `subcategory` from searchParams and pass to query**

In each page, find where `searchParams` is destructured and add:

```typescript
const subcategory = searchParams.subcategory || "";
```

Then pass `subcategory` to the list function call:

```typescript
const { data: items, total } = await listItems({
  page,
  category,
  subcategory,  // ADD THIS
  tag,
  search,
});
```

- [ ] **Step 2: Commit**

```bash
git add src/app/[locale]/prompts/page.tsx src/app/[locale]/skills/page.tsx src/app/[locale]/tools/page.tsx
git commit -m "feat: pass subcategory param from page to list queries"
```

---

## Task 7: Update Active Filters Display

**Files:**
- Modify: `src/components/prompts/PromptFilters.tsx`
- Modify: `src/components/skills/SkillLayoutFilters.tsx`
- Modify: `src/components/tools/ToolFilters.tsx`

- [ ] **Step 1: Add subcategory to active filter pills**

In each active filters component, add after the category pill:

```tsx
{currentSubcategory && (
  <button
    type="button"
    onClick={() => clearField("subcategory")}
    className={FILTER_PILL_CLASSES}
  >
    {currentCategory} / {currentSubcategory}
    <X className="h-3 w-3" strokeWidth={1.8} />
  </button>
)}
```

And update `clearAll` and `clearField` to handle `subcategory`:

```typescript
function clearField(field: "category" | "search" | "tag" | "subcategory") {
  const params = new URLSearchParams(searchParams.toString());
  params.delete(field);
  if (field === "category") params.delete("subcategory");
  params.delete("page");
  navigate(params);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/prompts/PromptFilters.tsx src/components/skills/SkillLayoutFilters.tsx src/components/tools/ToolFilters.tsx
git commit -m "feat: show subcategory in active filter pills"
```

---

## Task 8: Update Category Theme Colors

**Files:**
- Modify: `src/lib/category-theme.ts`

- [ ] **Step 1: Add theme mappings for new 7 categories**

Replace the entire file:

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

  Default: "border-[#d8cab3] bg-[#efe4d1] text-[#7f4a22]",
};

export function getCategoryTheme(category: string): string {
  return CATEGORY_THEME[category] ?? CATEGORY_THEME.Default;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/category-theme.ts
git commit -m "feat: update category theme colors for 7-category taxonomy"
```

---

## Task 9: Add Verification Tests

**Files:**
- Create: `tests/category-migration.test.ts`

- [ ] **Step 1: Write comprehensive tests**

```typescript
import { describe, it, expect } from "vitest";
import { serverDb } from "@/lib/rdb-server";

const VALID_CATEGORIES = ["选题", "文献", "数据", "分析", "写作", "展示", "投稿"];

describe("Category migration", () => {
  it("should have no invalid categories in any table", async () => {
    for (const table of ["prompt", "skill", "tool"]) {
      const { data, error } = await serverDb
        .from(table)
        .select("category")
        .not("category", "in", `(${VALID_CATEGORIES.join(",")})`)
        .execute();

      expect(error).toBeNull();
      expect(data?.length ?? 0).toBe(0);
    }
  });

  it("should have zero records in legacy categories", async () => {
    for (const table of ["prompt", "skill", "tool"]) {
      for (const badCategory of ["其他", "评审", "学术搜索", "文献管理", "政府统计", "经济金融", "统计分析", "法律数据库", "科研辅助"]) {
        const { data, error } = await serverDb
          .from(table)
          .select("_id")
          .eq("category", badCategory)
          .execute();

        expect(error).toBeNull();
        expect(data?.length ?? 0).toBe(0);
      }
    }
  });

  it("should have subcategory populated for all records", async () => {
    for (const table of ["prompt", "skill", "tool"]) {
      const { data, error } = await serverDb
        .from(table)
        .select("_id")
        .is("subcategory", null)
        .execute();

      expect(error).toBeNull();
      expect(data?.length ?? 0).toBe(0);
    }
  });

  it("should support filtering by category + subcategory", async () => {
    const { data, error } = await serverDb
      .from("prompt")
      .select("_id")
      .eq("category", "分析")
      .eq("subcategory", "图表")
      .execute();

    expect(error).toBeNull();
    expect((data?.length ?? 0) > 0).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run tests/category-migration.test.ts
```
Expected: 4 tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests/category-migration.test.ts
git commit -m "test: add category and subcategory migration verification"
```

---

## Verification Checklist

- [ ] Accordion sidebar renders on `/prompts`, `/skills`, `/tools`
- [ ] Clicking chevron expands/collapses subcategory list
- [ ] Clicking category name filters by category only
- [ ] Clicking subcategory filters by `category + subcategory`
- [ ] Active filter pills show `category / subcategory` format
- [ ] Clear all removes both category and subcategory
- [ ] URL params correctly reflect `?category=数据&subcategory=获取`
- [ ] No records with NULL subcategory in any table
- [ ] All 157 records have valid primary category
- [ ] Full test suite passes: `npx vitest run`

## Rollback Plan

If critical issues found within 24h:

```sql
-- Drop subcategory column and restore from backup
ALTER TABLE prompt DROP COLUMN subcategory;
ALTER TABLE skill DROP COLUMN subcategory;
ALTER TABLE tool DROP COLUMN subcategory;

-- Restore categories from original values (requires backup table)
```

For production safety, create backup tables before migration:

```sql
CREATE TABLE prompt_backup AS SELECT * FROM prompt;
CREATE TABLE skill_backup AS SELECT * FROM skill;
CREATE TABLE tool_backup AS SELECT * FROM tool;
```
