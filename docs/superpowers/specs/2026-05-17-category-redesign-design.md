# Category System Redesign Specification

**Date**: 2026-05-17
**Status**: Approved
**Author**: AI Assistant

## Overview

Redesign the category system across Prompts, Skills, and Tools to use a unified "research stage" taxonomy with secondary tool-type tags. This resolves the current fragmentation where Prompts/Skills use research phases while Tools use data-source types.

## Goals

1. Unify category taxonomy across all three resource types (prompt, skill, tool)
2. Reduce cognitive load by aligning with the economics research workflow
3. Balance "browsing by stage" and "finding by tool type"
4. Eliminate the "other" catch-all category
5. Maintain backward compatibility during migration

## Non-Goals

- Changing the database schema (category remains a single string field)
- Adding formal subcategory columns (tags JSON field used for secondary labels)
- Reorganizing the UI layout (filters and cards remain visually identical)

## Category Taxonomy

### Primary Categories (7)

| # | Chinese | English | Scope | Secondary Tags |
|---|---------|---------|-------|----------------|
| 1 | 选题 | Discovery | Topic selection, research planning, novelty assessment | 趋势分析, 选题评估, 研究规划, IDE |
| 2 | 文献 | Literature | Search, reading, note-taking, reference management | 检索, 阅读, 笔记, 引用管理, Zotero, Mendeley, EndNote |
| 3 | 数据 | Data | Acquisition, cleaning, matching, databases | 获取, 清洗, 匹配, FRED, World Bank, Census, 中国统计, OpenAlex, 法律数据库 |
| 4 | 分析 | Analysis | Econometrics, causal inference, programming, visualization | 计量, 因果推断, 面板数据, DID, Stata, R, Python, MATLAB, SPSS, Jupyter, 图表, 三线表 |
| 5 | 写作 | Writing | Drafting, polishing, translation, structure | 起草, 润色, 翻译, 结构, APA, 方法章节, 结果章节 |
| 6 | 展示 | Presentation | LaTeX typesetting, slides, posters | 排版, 幻灯片, Beamer, 海报, Excalidraw |
| 7 | 投稿 | Submission | Journal selection, peer review response, formatting | 期刊选择, 审稿回复, 格式检查, 投稿指南 |

### Key Design Decisions

1. **Charts and tables belong in Analysis, not Presentation**
   - Rationale: In economics, figures and tables are analytical outputs, not presentation materials. LaTeX formatting and slides are Presentation.

2. **Legal databases are a sub-tag under Data**
   - Rationale: Law data (CNKI, pkulaw, CourtListener) is a data source for empirical legal studies, not a standalone research stage.

3. **"评审" renamed to "投稿"**
   - Rationale: "评审" implies reviewing others' work; "投稿" covers the entire submission lifecycle including responding to reviewers.

4. **"其他" eliminated**
   - Rationale: Every resource maps to a research stage. Generic tools (GitHub, Filesystem) map to Analysis (programming) or Writing (Notion/Obsidian notes).

## Migration Mapping

### Prompts (67 records)

| Original Category | Count | New Category | Notes |
|-------------------|-------|--------------|-------|
| 选题 | 7 | 选题 (7) | No change |
| 文献 | 4 | 文献 (4) | No change |
| 数据 | 6 | 分析 (4), 数据 (2) | EDA/Modeling/绘图 → 分析; Data QA/质性访谈 → 数据 |
| 写作 | 37 | 写作 (23), 分析 (10), 展示 (3), 投稿 (1) | 图表/三线表 → 分析; LaTeX/幻灯片 → 展示; 投稿指南 → 投稿 |
| 评审 | 8 | 投稿 (8) | Rename |
| 其他 | 9 | 选题 (2), 写作 (1), 投稿 (2), 分析 (4) | Orchestrator/Submission Agent → 选题/投稿; 通用Agent → 分析 |

### Skills (45 records)

| Original Category | Count | New Category | Notes |
|-------------------|-------|--------------|-------|
| 选题 | 6 | 选题 (6) | No change |
| 文献 | 9 | 文献 (9) | No change |
| 数据 | 26 | 分析 (20), 数据 (4), 选题 (1) | 计量/回归/编程/可视化 → 分析; 清洗/获取 → 数据; launch → 选题 |
| 写作 | 9 | 写作 (6), 展示 (3) | LaTeX → 展示 |
| 评审 | 6 | 投稿 (6) | Rename |
| 其他 | 9 | 展示 (3), 分析 (5), 投稿 (1) | beamer/slide → 展示; 编程 → 分析; research-publishing → 投稿 |

### Tools (45 records)

| Original Category | Count | New Category | Notes |
|-------------------|-------|--------------|-------|
| 学术搜索 | 2 | 文献 (2) | Merge into Literature |
| 文献管理 | 8 | 文献 (8) | Merge into Literature |
| 政府统计 | 6 | 数据 (6) | Merge into Data |
| 经济金融 | 6 | 数据 (6) | Merge into Data |
| 统计分析 | 8 | 分析 (8) | Merge into Analysis |
| 法律数据库 | 7 | 数据 (7) | Sub-tag: 法律数据 |
| 科研辅助 | 8 | 分析 (2), 写作 (2), 展示 (1), 文献 (1), 数据 (1) | Split by function |

## Post-Migration Distribution

| Category | Prompts | Skills | Tools | Total |
|----------|---------|--------|-------|-------|
| 选题 | 9 | 7 | 0 | 16 |
| 文献 | 6 | 9 | 11 | 26 |
| 数据 | 4 | 5 | 20 | 29 |
| 分析 | 18 | 25 | 11 | 54 |
| 写作 | 24 | 6 | 0 | 30 |
| 展示 | 3 | 3 | 2 | 8 |
| 投稿 | 11 | 7 | 1 | 19 |
| **Total** | **67** | **45** | **45** | **157** |

## Implementation Notes

### Database Migration

```sql
-- Update prompts
UPDATE prompt SET category = '投稿' WHERE category = '评审';
UPDATE prompt SET category = '分析' WHERE title IN ('EDA Agent系统提示词', 'Modeling Agent系统提示词', '实验绘图推荐 Prompt', '/write-captions 图表标题生成', 'Figure Factory Agent系统提示词', '学术图表与三线表规范化引擎', '生成图的标题 Prompt', '生成表的标题 Prompt');
UPDATE prompt SET category = '展示' WHERE title IN ('论文幻灯片生成提示词', '论文架构图设计 Prompt', 'LaTeX PDF MCP');
UPDATE prompt SET category = '选题' WHERE title IN ('Orchestrator Agent系统提示词', 'Submission Agent系统提示词');
UPDATE prompt SET category = '投稿' WHERE title = '经济学期刊投稿指南';
UPDATE prompt SET category = '分析' WHERE category = '其他';

-- Update skills
UPDATE skill SET category = '投稿' WHERE category = '评审';
UPDATE skill SET category = '分析' WHERE title IN ('algorithm-design', 'code-debugging', 'compare', 'data-analysis', 'debug', 'econ-visualization', 'experiment-code', 'figure-generation', 'general-equilibrium-model-builder', 'math-reasoning', 'paper-to-code', 'python-panel-data', 'R Econometrics', 'reproduce', 'stata', 'Stata Regression', 'stata-c-plugins', 'symbolic-equation', 'table-generation', '数据可视化模板', 'code-simplifier', 'commit-push-pr', 'sdd', 'stata-skill-contributor', 'techdebt');
UPDATE skill SET category = '数据' WHERE title IN ('api-data-fetcher', 'dataset-curation', 'stata-data-cleaning', '数据清洗自动化');
UPDATE skill SET category = '选题' WHERE title = 'launch';
UPDATE skill SET category = '展示' WHERE title IN ('latex-econ-model', 'latex-formatting', 'latex-setup', 'beamer-presentation', 'excalidraw-skill', 'slide-generation');
UPDATE skill SET category = '投稿' WHERE title = 'research-publishing';

-- Update tools
UPDATE tool SET category = '文献' WHERE category IN ('学术搜索', '文献管理');
UPDATE tool SET category = '数据' WHERE category IN ('政府统计', '经济金融', '法律数据库');
UPDATE tool SET category = '分析' WHERE category = '统计分析';
UPDATE tool SET category = '文献' WHERE title = 'Perplexity MCP';
UPDATE tool SET category = '数据' WHERE title = 'PostgreSQL MCP';
UPDATE tool SET category = '分析' WHERE title IN ('Filesystem MCP', 'GitHub MCP', 'Tableau MCP');
UPDATE tool SET category = '写作' WHERE title IN ('Notion MCP', 'Obsidian MCP');
UPDATE tool SET category = '展示' WHERE title = 'LaTeX PDF MCP';
```

### UI Updates

1. **Category tabs** on listing pages: update labels to 7 unified categories
2. **Category theme colors** in `src/lib/category-theme.ts`: add mappings for new categories
3. **Filter components**: no structural changes, only label updates

### Backward Compatibility

- Old URLs with `?category=评审` will show empty results (acceptable during transition)
- Consider adding a 301 redirect mapping or fallback message for 2 weeks post-deployment

## Success Criteria

1. All 157 records have a non-empty, valid category from the 7-category set
2. No "其他" or "评审" categories remain in the database
3. Largest category has ≤ 60 records (vs. current 37 and 26)
4. Users can browse by research stage and filter by tool type within each stage
