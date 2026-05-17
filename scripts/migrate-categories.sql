-- Category Redesign Migration Script
-- Date: 2026-05-17
-- Adds subcategory column to prompt, skill, tool tables and migrates all records
-- to unified 7 primary categories: 选题, 文献, 数据, 分析, 写作, 展示, 投稿

-- ============================================================
-- 1. Add subcategory columns and indexes
-- ============================================================
ALTER TABLE prompt ADD COLUMN subcategory VARCHAR(100) DEFAULT NULL AFTER category;
ALTER TABLE skill ADD COLUMN subcategory VARCHAR(100) DEFAULT NULL AFTER category;
ALTER TABLE tool ADD COLUMN subcategory VARCHAR(100) DEFAULT NULL AFTER category;

CREATE INDEX idx_prompt_subcategory ON prompt(subcategory);
CREATE INDEX idx_skill_subcategory ON skill(subcategory);
CREATE INDEX idx_tool_subcategory ON tool(subcategory);

-- ============================================================
-- 2. Migrate primary categories
-- ============================================================

-- Prompts
UPDATE prompt SET category = '投稿' WHERE category = '评审';
UPDATE prompt SET category = '分析' WHERE title IN ('EDA Agent系统提示词', 'Modeling Agent系统提示词', '实验绘图推荐 Prompt', '/write-captions 图表标题生成', 'Figure Factory Agent系统提示词', '学术图表与三线表规范化引擎', '生成图的标题 Prompt', '生成表的标题 Prompt');
UPDATE prompt SET category = '展示' WHERE title IN ('论文幻灯片生成提示词', '论文架构图设计 Prompt');
UPDATE prompt SET category = '选题' WHERE title IN ('Orchestrator Agent系统提示词', 'Submission Agent系统提示词');
UPDATE prompt SET category = '投稿' WHERE title = '经济学期刊投稿指南';
UPDATE prompt SET category = '分析' WHERE category = '其他';

-- Skills
UPDATE skill SET category = '投稿' WHERE category = '评审';
UPDATE skill SET category = '分析' WHERE title IN ('algorithm-design', 'code-debugging', 'compare', 'data-analysis', 'debug', 'econ-visualization', 'experiment-code', 'figure-generation', 'general-equilibrium-model-builder', 'math-reasoning', 'paper-to-code', 'python-panel-data', 'R Econometrics', 'reproduce', 'stata', 'Stata Regression', 'stata-c-plugins', 'symbolic-equation', 'table-generation', '数据可视化模板', 'code-simplifier', 'commit-push-pr', 'sdd', 'stata-skill-contributor', 'techdebt');
UPDATE skill SET category = '数据' WHERE title IN ('api-data-fetcher', 'dataset-curation', 'stata-data-cleaning', '数据清洗自动化');
UPDATE skill SET category = '选题' WHERE title = 'launch';
UPDATE skill SET category = '展示' WHERE title IN ('latex-econ-model', 'latex-formatting', 'latex-setup', 'beamer-presentation', 'excalidraw-skill', 'slide-generation');
UPDATE skill SET category = '投稿' WHERE title = 'research-publishing';

-- Tools
UPDATE tool SET category = '文献' WHERE category IN ('学术搜索', '文献管理');
UPDATE tool SET category = '数据' WHERE category IN ('政府统计', '经济金融', '法律数据库');
UPDATE tool SET category = '分析' WHERE category = '统计分析';
UPDATE tool SET category = '文献' WHERE title = 'Perplexity MCP';
UPDATE tool SET category = '数据' WHERE title = 'PostgreSQL MCP';
UPDATE tool SET category = '分析' WHERE title IN ('Filesystem MCP', 'GitHub MCP', 'Tableau MCP');
UPDATE tool SET category = '写作' WHERE title IN ('Notion MCP', 'Obsidian MCP');
UPDATE tool SET category = '展示' WHERE title = 'LaTeX PDF MCP';

-- ============================================================
-- 3. Migrate subcategories (Prompts)
-- ============================================================
UPDATE prompt SET subcategory = '研究规划' WHERE title LIKE '7阶段深度研究Prompt模式%' OR title LIKE 'PaperPilot论文规划阶段%' OR title LIKE 'PhD研究计划生成%' OR title LIKE 'Research PRD Agent%' OR title LIKE 'Orchestrator Agent%';
UPDATE prompt SET subcategory = '选题评估' WHERE title LIKE 'Conceptual Framework Agent%';
UPDATE prompt SET subcategory = '计量' WHERE title LIKE '模型/方法选择建议%' OR title LIKE '计量经济学分析助手%' OR title LIKE 'Modeling Agent%';
UPDATE prompt SET subcategory = '检索' WHERE title LIKE 'Deep Literature Agent%' OR title LIKE 'PaperPilot文献检索%';
UPDATE prompt SET subcategory = '阅读' WHERE title LIKE 'Reverse Brief%';
UPDATE prompt SET subcategory = '综述' WHERE title LIKE '经济学文献综述助手%' OR title LIKE '经济与管理综述论文写作%';
UPDATE prompt SET subcategory = '清洗' WHERE title LIKE 'Data QA Agent%' OR title LIKE '质性访谈逐字稿标准化%';
UPDATE prompt SET subcategory = '可视化' WHERE title LIKE 'EDA Agent%';
UPDATE prompt SET subcategory = '图表' WHERE title LIKE '实验绘图推荐%' OR title LIKE '/write-captions 图表标题生成%' OR title LIKE 'Figure Factory Agent%' OR title LIKE '生成图的标题 Prompt%' OR title LIKE '生成表的标题 Prompt%';
UPDATE prompt SET subcategory = '三线表' WHERE title LIKE '学术图表与三线表规范化引擎%';
UPDATE prompt SET subcategory = '讨论章节' WHERE title LIKE '/write-discussion%';
UPDATE prompt SET subcategory = '摘要/引言' WHERE title LIKE '/write-frontmatter%';
UPDATE prompt SET subcategory = '方法章节' WHERE title LIKE '/write-methods%';
UPDATE prompt SET subcategory = '结果章节' WHERE title LIKE '/write-results%';
UPDATE prompt SET subcategory = '引用格式' WHERE title LIKE 'APA 7th%';
UPDATE prompt SET subcategory = '结构' WHERE title LIKE 'PaperPilot论文章节撰写%' OR title LIKE 'Prompt1：研究问题结构生成%' OR title LIKE 'Prompt2：论文结构框架设计%' OR title LIKE 'Prompt3：研究设计结构模板%' OR title LIKE 'Prompt4：讨论结构设计%' OR title LIKE 'Prompt5：技术路线建模%' OR title LIKE 'Prompt6：章节微结构生成%' OR title LIKE 'Prompt7：科研结构终极指令%' OR title LIKE '学术论文结构优化%';
UPDATE prompt SET subcategory = '引用管理' WHERE title LIKE 'Reference Agent%';
UPDATE prompt SET subcategory = '起草' WHERE title LIKE 'Scientific Writer Agent%';
UPDATE prompt SET subcategory = '翻译' WHERE title LIKE '中转中 Prompt（Word中文论文）%' OR title LIKE '中转英 Prompt（顶尖科研写作专家）%' OR title LIKE '英转中 Prompt%';
UPDATE prompt SET subcategory = '润色' WHERE title LIKE '去AI味润色 Prompt（LaTeX英文）%' OR title LIKE '去AI味（Word中文）%' OR title LIKE '扩写 Prompt%' OR title LIKE '缩写 Prompt%' OR title LIKE '表达润色 Prompt（英文论文）%' OR title LIKE '表达润色（中文论文）%' OR title LIKE '逻辑检查 Prompt%';
UPDATE prompt SET subcategory = '引言' WHERE title LIKE '漏斗型引言写作模板%';
UPDATE prompt SET subcategory = '摘要' WHERE title LIKE '结构化摘要写作模板（英文）%';
UPDATE prompt SET subcategory = '结论' WHERE title LIKE '结论与展望写作模板%';
UPDATE prompt SET subcategory = '幻灯片' WHERE title LIKE '论文幻灯片生成提示词%';
UPDATE prompt SET subcategory = '排版' WHERE title LIKE '论文架构图设计 Prompt%';
UPDATE prompt SET subcategory = '审稿回复' WHERE title LIKE 'Ai-Review Chain-of-Thought审稿提示词%' OR title LIKE 'Ai-Review Few-Shot审稿提示词（经济管理示例）%' OR title LIKE 'Ai-Review Prompt Comparison Mode%' OR title LIKE 'Ai-Review Reverse Prompt（反推有效提示词）%' OR title LIKE 'Ai-Review SoT审稿提示词%' OR title LIKE 'Ai-Review 图表与可视化审稿提示词%' OR title LIKE 'Reviewer Agent%' OR title LIKE '实验分析 Reviewer 视角 Prompt%';
UPDATE prompt SET subcategory = '综合' WHERE title LIKE 'NATURE 推荐的30条科研指令%';
UPDATE prompt SET subcategory = '投稿指南' WHERE title LIKE 'Submission Agent%' OR title LIKE '经济学期刊投稿指南%';

-- ============================================================
-- 4. Migrate subcategories (Skills)
-- ============================================================
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

-- ============================================================
-- 5. Migrate subcategories (Tools)
-- ============================================================
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

-- ============================================================
-- 6. Verification queries (should all return cnt = 0)
-- ============================================================
SELECT 'prompts null subcategory' as check_name, COUNT(*) as cnt FROM prompt WHERE subcategory IS NULL;
SELECT 'skills null subcategory' as check_name, COUNT(*) as cnt FROM skill WHERE subcategory IS NULL;
SELECT 'tools null subcategory' as check_name, COUNT(*) as cnt FROM tool WHERE subcategory IS NULL;
SELECT 'invalid categories' as check_name, COUNT(*) as cnt FROM (
  SELECT category FROM prompt WHERE category NOT IN ('选题','文献','数据','分析','写作','展示','投稿')
  UNION ALL SELECT category FROM skill WHERE category NOT IN ('选题','文献','数据','分析','写作','展示','投稿')
  UNION ALL SELECT category FROM tool WHERE category NOT IN ('选题','文献','数据','分析','写作','展示','投稿')
) t;
