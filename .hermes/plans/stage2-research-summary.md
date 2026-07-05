# Stage 2 Research Summary：四篇详细教程的研究汇总

> 说明：本文件按 `econagora-blog-writing` 研究所要求的"先研究、后写作"流程整理。每个条目包含权威来源、核心论点、建议 frontmatter 与中文详细大纲，**不写入正文**。

---

## 1. ai-agent-research-setup（ai-research-best-practices #1）

### 权威来源

1. **Anthropic. Claude Code overview.** https://docs.anthropic.com/en/docs/claude-code/overview  
   Anthropic 官方 CLI Agent 工具的安装、认证与使用说明。
2. **Anthropic. Model Context Protocol.** https://modelcontextprotocol.io/  
   标准化 AI 模型与外部工具/数据源通信的开放协议。
3. **Microsoft. Visual Studio Code documentation.** https://code.visualstudio.com/docs  
   用于配置 Agent 开发环境的编辑器官方文档。
4. **CC Switch. GitHub repository.** https://github.com/farion1231/cc-switch  
   跨平台管理 Claude Code / Codex 等 CLI 工具的 API 供应商切换工具。
5. **Anthropic. Claude API documentation.** https://docs.anthropic.com/  
   API Key 获取、模型列表与调用方式的参考。
6. **Wooldridge, J. M. (2015). *Introductory Econometrics: A Modern Approach* (6th ed.). Cengage.**
   经济学实证研究中使用计算工具与软件交互的基础参考。

### 核心论点

通过 VSCode + Claude Code + CC Switch 的组合，研究者可以在本地搭建一个能读写文件、调用工具、持续执行任务的 AI Agent，从而将文献下载、摘要生成等重复性科研环节自动化。

### 建议 Frontmatter

```yaml
---
slug: ai-agent-research-setup
title: 什么是 AI Agent？使用 VSCode 配置自己的第一个科研 Agent
excerpt: 从零开始理解 AI Agent 的概念，使用 VSCode + Claude + CC Switch 配置一个能读文献、写代码、跑数据的科研助手。
category: AI 工具
date: '2026-05-21'
readTime: 20 分钟
tags:
  - AI Agent
  - VSCode
  - Claude
  - CC Switch
  - 科研工具
  - 入门教程
author: 戴伟德
authorRole: 经济学研究者
issue: EA-2026-05-001
cover: /blog-covers/2026/05/ai-agent-research-setup-final.png
series: ai-research-best-practices
seriesOrder: 1
---
```

### 详细大纲（中文，10 节）

1. **引言**：AI Agent 对经济学研究的意义与本文目标读者。
2. **AI Agent 的核心概念**：从单次对话 ChatGPT 到持续任务执行 Agent 的演进。
3. **Agent 的三大组件**：大脑（LLM）、工具（Tools）、记忆（Memory）及其科研映射。
4. **环境准备**：安装 VSCode 与基础插件推荐。
5. **安装与配置 CC Switch**：Windows / macOS / Linux 安装、添加供应商与一键切换。
6. **安装与配置 Claude Code**：npm 安装、OAuth 登录、VSCode 集成终端启动。
7. **获取 API Key 与供应商切换**：Anthropic / Kimi / DeepSeek 等 Key 获取与安全提示。
8. **第一个科研任务**：自动下载并解析 NBER Working Paper，生成中文摘要与综述。
9. **Agent 的能力边界与风险提示**：付费数据库、GUI 软件、超大文件与准确性限制。
10. **人机协作最佳实践与进阶配置**：自定义指令（`CLAUDE.md`）、常用工具安装、工作区保存。
11. **总结与下一篇预告**：预告 Zotero + MCP 接入。

---

## 2. agent-zotero-integration（ai-research-best-practices #2）

### 权威来源

1. **Anthropic. Model Context Protocol.** https://modelcontextprotocol.io/  
   标准化 AI 与外部数据源通信的协议规范。
2. **Anthropic. MCP servers repository.** https://github.com/modelcontextprotocol/servers  
   官方与社区维护的 MCP Server 集合参考。
3. **Zotero. Documentation.** https://www.zotero.org/support/  
   开源文献管理软件官方文档与数据库结构说明。
4. **54yyyu/zotero-mcp. GitHub repository.** https://github.com/54yyyu/zotero-mcp
   通过 MCP 协议连接本地或在线 Zotero 文献库的社区实现，stars 超过 4000，持续活跃维护。
5. **PyMuPDF documentation.** https://pymupdf.readthedocs.io/  
   用于 PDF 文本、元数据与页面内容提取的高性能 Python 库。
6. **EconAgora. "从 PDF 到 Panel：经济学文献综述的四代理工作流".**
   本系列关于结构化文献综述与多 Agent 协作的既有文章，用于保持系列内部一致性。

### 核心论点

借助 MCP 协议将 Zotero 文献库接入 Claude Code，研究者能够实现自动检索、PDF 解析、笔记生成和综述框架构建的端到端文献工作流。

### 建议 Frontmatter

```yaml
---
slug: agent-zotero-integration
title: 给自己的 Agent 接入文献库：Zotero + MCP 实战指南
excerpt: 通过 MCP 协议将 Zotero 文献库接入 AI Agent，实现自动检索、PDF 解析、笔记生成和文献综述框架构建的完整工作流。
category: AI 工具
date: '2026-05-28'
readTime: 25 分钟
tags:
  - AI Agent
  - Zotero
  - MCP
  - 文献管理
  - 科研工具
author: 戴伟德
authorRole: 经济学研究者
issue: EA-2026-05-003
cover: /blog-covers/2026/05/agent-zotero-integration.png
series: ai-research-best-practices
seriesOrder: 2
---
```

### 详细大纲（中文，12 节）

1. **引言**：文献管理自动化的痛点与本篇前置要求。
2. **MCP 协议基础**：Host-Client-Server-Data Source 四层架构与工作流程。
3. **为什么用 MCP 而非直接调用 Zotero API**：标准化、可复用、多 Agent 协同的优势。
4. **安装 Zotero 与确认数据库路径**：跨平台默认路径与数据存储位置查看。
5. **安装与配置 zotero-mcp Server**：克隆仓库、创建虚拟环境、安装依赖、设置 `ZOTERO_DB_PATH`。
6. **在 Claude Code 中配置 MCP**：全局 `claude_desktop_config.json` 与项目级 `.mcp.json` 对比。
7. **通过 CC Switch 统一管理 MCP**：模板添加、多应用同步与配置分发。
8. **验证 MCP 连接与基础查询**：`/mcp` 检查、常见错误排查。
9. **实战任务：文献检索与总结**：关键词搜索、年份筛选、PDF 检查、Markdown 综述表格生成。
10. **PDF 深度解析**：PyMuPDF 安装、自定义 PDF Parser MCP Server、摘要与关键章节提取。
11. **自动化工作流**：`CLAUDE.md` 文献调研指令、批量处理脚本、定期更新机制。
12. **性能优化、数据安全与准确性保障**：检索速度、隐私防护、人工审查。
13. **总结与下一篇预告**：预告 stata-mcp 实证分析。

---

## 3. claude-code-stata-mcp（ai-research-best-practices #3）

### 权威来源

1. **hanlulong/stata-mcp. GitHub repository.** https://github.com/hanlulong/stata-mcp
   将 Stata 接入 MCP 的 VS Code 扩展与 Node.js Server，支持在 Claude Code 等 Agent 中自然语言调用 Stata 命令。
2. **StataCorp. Stata documentation.** https://www.stata.com/features/documentation/  
   Stata 命令、回归输出与图表功能的官方参考。
3. **Anthropic. Claude Code overview.** https://docs.anthropic.com/en/docs/claude-code/overview  
   CLI 方式的 AI 编程助手，支持项目级文件与 MCP 配置。
4. **Anthropic. Model Context Protocol.** https://modelcontextprotocol.io/  
   AI 与外部系统通信的标准协议。
5. **Angrist, J. D., & Pischke, J. S. (2009). *Mostly Harmless Econometrics*. Princeton University Press.** https://press.princeton.edu/books/paperback/9780691120355/mostly-harmless-econometrics
   应用计量经济学核心教材，系统讲解识别、反事实与因果推断的可证伪逻辑。
6. **npm documentation.** https://docs.npmjs.com/
   `npx` 与 Node.js 包管理的官方参考。

### 核心论点

通过 Claude Code 安装并配置 stata-mcp，研究者可以用自然语言驱动 Stata 完成数据清洗、回归分析、图表生成和结果解读，实现 AI 辅助的实证分析工作流。

### 建议 Frontmatter

```yaml
---
slug: claude-code-stata-mcp
title: 使用 Claude Code 安装 stata-mcp 进行实证分析
excerpt: 本文详细介绍如何通过 Claude Code 安装和配置 stata-mcp MCP server，实现 AI 辅助的 Stata 实证分析工作流，提升经济学研究效率。
category: AI 工具
date: '2026-05-16'
readTime: 12 分钟
tags:
  - Claude Code
  - Stata
  - MCP
  - 实证分析
  - 计量经济学
author: 戴伟德
authorRole: 经济学研究者
issue: EA-2026-05-004
cover: /blog-covers/2026/05/claude-code-stata-mcp.png
series: ai-research-best-practices
seriesOrder: 3
---
```

### 详细大纲（中文，12 节）

1. **引言**：Stata 在经济学实证中的地位与 AI 辅助价值。
2. **MCP 协议在计量分析中的角色**：把 Stata 变成 Agent 可调用的"工具"。
3. **准备工作**：Claude Code、Stata 版本确认与 Node.js 环境检查。
4. **安装 stata-mcp（方法一）**：使用 `npx -y stata-mcp` 无需全局安装。
5. **安装 stata-mcp（方法二）**：`npm install -g stata-mcp` 全局安装与版本验证。
6. **配置 `.mcp.json` 与 `STATA_PATH`**：Windows / macOS / Linux 路径示例。
7. **验证连接与第一条自然语言指令**：加载数据、运行描述性统计。
8. **场景一：数据清洗与描述性统计**：`sysuse`、`describe`、`summarize`。
9. **场景二：回归分析与稳健标准误**：`regress ..., robust` 与结果解读。
10. **场景三：高级计量分析**：DID 回归、识别假设讨论、稳健性建议。
11. **场景四：自动化图表生成**：散点图、拟合线与 `graph export`。
12. **工作流优化**：Claude Code Memory、批量分析、Git 版本控制集成。
13. **常见问题排查**：Stata 路径错误、MCP 连接失败、超时配置。
14. **总结**：AI 辅助实证分析的效率、门槛与可复现性价值。

---

## 4. llm-assisted-did-design（paper-projects #1）

### 权威来源

1. **Card, D., & Krueger, A. B. (1994). Minimum Wages and Employment: A Case Study of the Fast-Food Industry in New Jersey and Pennsylvania. *American Economic Review*, 84(4), 772-793.**
   经典 DID 研究案例，NBER 工作论文版本可公开获取（NBER w4509），用于说明处理组定义与溢出效应讨论。
2. **Goodman-Bacon, A. (2021). Difference-in-differences with variation in treatment timing. *Journal of Econometrics*, 225(2), 254-277.**  
   异质性处理时机下 DID 估计量的分解与偏误来源。
3. **Callaway, B., & Sant'Anna, P. H. (2021). Difference-in-differences with multiple time periods. *Journal of Econometrics*, 225(2), 200-230.**  
   多期 DID 的识别条件、估计量与事件研究法。
4. **Angrist, J. D., & Pischke, J. S. (2009). *Mostly Harmless Econometrics*. Princeton University Press.** https://press.princeton.edu/books/paperback/9780691120355/mostly-harmless-econometrics
   因果推断实证方法的系统教材，涵盖 DID、IV、RDD 等。
5. **Anthropic. Claude documentation.** https://docs.anthropic.com/
   使用 Claude 进行结构化推理、角色扮演与长文本分析的参考。
6. **OpenAI. GPT-4 documentation.** https://platform.openai.com/docs/  
   LLM API 调用、提示词工程与输出解析的官方文档。

### 核心论点

利用 Claude 和 GPT-4 的结构化角色提示，研究者可以在处理组定义、平行趋势评估、溢出效应检查和机制分析四个环节系统性地辅助 DID 识别策略设计。

### 建议 Frontmatter

```yaml
---
slug: llm-assisted-did-design
title: 使用 LLM 辅助 DID 识别策略设计
excerpt: 本文介绍如何利用 Claude 和 GPT-4 辅助设计双重差分法（DID）的识别策略，包括处理组定义、平行趋势检验和溢出效应评估的完整工作流。
category: 因果推断
date: '2026-05-14'
readTime: 15 分钟
tags:
  - LLM
  - DID
  - 因果推断
  - 工具教程
  - Claude
author: 戴伟德
authorRole: 经济学研究者
issue: EA-2026-05-002
cover: /blog-covers/2026/05/llm-assisted-did-design.png
series: paper-projects
seriesOrder: 1
---
```

### 详细大纲（中文，12 节）

1. **引言**：DID 的广泛应用与识别策略设计中的主观性难题。
2. **传统 DID 设计的三大痛点**：处理组定义主观、平行趋势检验局限、溢出效应易被忽视。
3. **为什么需要 LLM 辅助**：快速生成方案、多角度评估、系统性检查识别假设。
4. **核心方法：四步工作流概览**：处理组定义 → 平行趋势 → 溢出效应 → 机制分析。
5. **步骤一：生成处理组定义方案**：角色提示、5 种方案对比与最低工资案例。
6. **步骤二：平行趋势假设评估**：潜在威胁列表、检验方法、修正建议与可信度评分。
7. **步骤三：溢出效应检查**：劳动力流动、消费者跨区、企业迁移等渠道识别与空间 DID 修正。
8. **步骤四：机制分析设计**：理论依据、检验策略、预期结果、中介/调节变量建议。
9. **完整代码实现**：`DIDDesignAssistant` 类的四步自动化脚本。
10. **提示词工程与人机协作最佳实践**：角色设定、结构化输出、迭代优化、责任边界。
11. **常见陷阱与风险提示**：过度依赖 LLM、知识截止日期、敏感信息泄露。
12. **总结与未来研究方向**：扩展到 RDD/IV、自动化提示词优化、最佳实践指南。

---

## 备注

- 已移除原 frontmatter 中的 `illustration` 字段以及 `llm-assisted-did-design` 中的 `source` 字段。
- `issue`、`series`、`seriesOrder`、`date`、`cover`、`author`、`authorRole` 均保留原文值。
- `title`、`excerpt`、`category`、`readTime`、`tags` 基于现有内容与研究方向做了微调。
