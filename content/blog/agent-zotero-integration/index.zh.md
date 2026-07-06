---
slug: agent-zotero-integration
title: 给自己的 Agent 接入文献库：Zotero + MCP 实战指南
excerpt: 本文介绍如何在 Claude Code 中通过 MCP 协议接入 54yyyu/zotero-mcp，让 Agent 直接搜索 Zotero 文献库、读取 PDF 全文、提取关键信息并生成文献矩阵与综述大纲。包含完整安装配置、可复制的四步工作流 prompt 与常见错误排查。
category: AI 工具
date: '2026-05-28'
readTime: 25 分钟
tags:
  - AI Agent
  - Claude Code
  - Zotero
  - MCP
  - 文献检索
  - 文献综述
  - PDF 解析
author: 戴伟德
authorRole: 经济学研究者
issue: EA-2026-05-003
cover: /blog-covers/2026/05/agent-zotero-integration.png
series: ai-research-best-practices
seriesOrder: 2
status: published
---

![AI 科研最佳实践系列横幅](/blog-covers/series-ai-research-best-practices.png)

> 这是 EconAgora「AI 科研最佳实践」系列的第 2 篇。前一篇见 [《什么是 AI Agent？使用 VSCode 配置自己的第一个科研 Agent》](/blog/ai-agent-research-setup)。

## 你要解决什么问题

经济学研究者的 Zotero 库里通常躺着几百上千篇 PDF：工作论文、期刊文章、书籍章节。写文献综述时，最常见的场景是：

1. 记得某篇论文的关键词，却搜不到准确条目；
2. 找到条目后，还要手动打开 PDF、复制摘要、记录方法；
3. 读了几十篇，笔记散落在各处，最后整理矩阵和大纲时又得重新翻一遍。

这篇文章把 **Zotero** 直接接到 **Claude Code**，通过一个 MCP Server 让 Agent 在对话里完成：

- **搜索文献库**：按关键词、作者、年份、标签检索；
- **获取 PDF**：定位附件并读取全文或注释；
- **提取文本**：把摘要、方法、结论转成结构化摘要；
- **生成文献矩阵与综述大纲**：按方法或主题归类，输出 Markdown 表格与大纲。

整个流程不需要你离开 Claude Code 的终端对话窗口。

## 前置条件

在开始之前，请确认以下环境：

- **Zotero 7**（或 6）已安装，且库中已有若干文献和 PDF 附件；
- **Claude Code** 已安装并完成登录（本系列第 1 篇覆盖过）；
- 已安装 **uv**、**pipx** 或 **pip** 中的一种，用于安装 Python 工具；
- 知道 Zotero 数据目录的位置（可选，用于自定义路径）。

默认数据目录：

- Windows: `C:\Users\<用户名>\Zotero`
- macOS: `~/Library/Application Support/Zotero`
- Linux: `~/.zotero`

## 核心步骤

### 1. 安装 zotero-mcp-server

我们将使用社区维护的 [`54yyyu/zotero-mcp`](https://github.com/54yyyu/zotero-mcp)（PyPI 包名 `zotero-mcp-server`）。它通过本地 API 读取 Zotero，默认无需 Zotero API Key。

推荐用 `uv` 安装（速度快、隔离干净）：

```bash
# 基础版：支持搜索、元数据、全文、注释
uv tool install zotero-mcp-server

# 如需 PDF 目录/大纲提取，加上 [pdf] 扩展
uv tool install "zotero-mcp-server[pdf]"

# 如需本地语义搜索，加上 [semantic] 扩展
uv tool install "zotero-mcp-server[semantic]"
```

如果你用 `pipx`：

```bash
pipx install "zotero-mcp-server[pdf]"
```

安装完成后，验证命令是否在 PATH 中：

```bash
zotero-mcp version
```

### 2. 在 Zotero 中启用本地 API

`54yyyu/zotero-mcp` 默认通过 Zotero 的本地 API 读取数据，因此需要保持 Zotero 桌面端运行。

1. 打开 Zotero；
2. 进入 **编辑 → 首选项 → 高级 → 常规**；
3. 勾选 **"Enable local API server"**（启用本地 API 服务器）；
4. 重启 Zotero 使设置生效。

> 注意：使用本地 API 时，Claude Code 读取的是 Zotero 实时数据，因此 Zotero 必须保持运行。

### 3. 在 Claude Code 中配置 MCP Server

Claude Code 支持两种配置方式：全局配置（对所有项目生效）或项目级 `.mcp.json`（仅当前项目生效）。

#### 方式 A：命令行快速添加（推荐）

在终端运行：

```bash
claude mcp add --env ZOTERO_LOCAL=true --transport stdio zotero -- zotero-mcp
```

如果 Zotero 数据目录不在默认位置，再补充 `ZOTERO_DB_PATH`：

```bash
claude mcp add \
  --env ZOTERO_LOCAL=true \
  --env ZOTERO_DB_PATH="/path/to/zotero.sqlite" \
  --transport stdio zotero -- zotero-mcp
```

#### 方式 B：项目级 `.mcp.json`

在项目根目录创建 `.mcp.json`：

```json
{
  "mcpServers": {
    "zotero": {
      "command": "zotero-mcp",
      "env": {
        "ZOTERO_LOCAL": "true",
        "ZOTERO_DB_PATH": "/path/to/zotero.sqlite"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

把 `ZOTERO_DB_PATH` 换成你的实际路径；如果使用默认路径，可以删除这一行。

首次启动 Claude Code 时，它会提示你批准项目级 MCP Server，选择 **允许** 即可。

### 4. 验证连接

启动 Claude Code 后，输入：

```
/mcp
```

确认列表中出现 `zotero` server，且工具数量大于 0。

然后测试一条查询：

```
请查看我的 Zotero 文献库中共有多少条目，并按条目类型（期刊论文、工作论文、书籍等）统计数量。
```

如果 Agent 正确返回统计结果，说明 MCP 连接已经可用。

## 可复制的工作流模板

下面是一个完整的四步工作流，你可以直接复制 prompt 到 Claude Code 中使用。

### 步骤 1：搜索文献库

```
请在我的 Zotero 文献库中搜索与“因果推断”相关的文献。

要求：
- 关键词匹配：causal inference、difference-in-differences、instrumental variable、synthetic control 中任意一个；
- 优先返回 2020 年及以后发表的 Journal Article 或 Working Paper；
- 对每篇文献列出：标题、作者、年份、期刊/来源、是否有本地 PDF 附件；
- 如果结果过多，先返回最相关的 15 篇，并告诉我总命中数。
```

> 如果你希望把检索策略做得更系统，可以参考 EconAgora 的 [literature-search](/skills/lingzhi227/agent-research-skills/literature-search) Skill，它提供了关键词扩展、数据库分源和检索式优化的方法。

### 步骤 2：获取 PDF 并提取文本

在上一步返回列表后，继续追问：

```
请对刚才列表中有 PDF 附件的前 5 篇文献，逐篇完成以下任务：

1. 获取该文献的 PDF 全文或附件路径；
2. 提取以下部分（如页数允许）：
   - 摘要；
   - 引言前 3 页；
   - 主要方法/识别策略段落；
   - 结论或主要发现段落；
3. 用中文输出每篇文献的阅读笔记，包括：
   - 研究问题；
   - 数据来源与样本；
   - 识别策略 / 核心方法；
   - 主要结论；
   - 与我研究可能相关的点。
```

如果某些 PDF 是扫描版或图片格式，`zotero-mcp` 可能无法直接提取文字。建议先用 OCR 工具（如 Zotero 的 OCR 插件或 `ocrmypdf`）处理后再导入。

### 步骤 3：生成文献矩阵

```
请基于上述检索和阅读结果，生成一个 Markdown 文献矩阵，保存到 literature_matrix_causal_inference.md。

矩阵列：
| 作者（年份） | 研究问题 | 识别策略 / 方法 | 数据来源 / 样本 | 核心结论 | 与我研究的关系 |

要求：
- 按方法分组（DID、IV、Synthetic Control、其他）；
- 每行内容控制在 2–3 句话；
- 空列用“待补充”占位，方便我后续手写批注。
```

> 矩阵整理阶段，可以结合 [literature-review](/skills/lingzhi227/agent-research-skills/literature-review) Skill 中的多视角对话方法，让 Agent 从“支持证据”“潜在批评”“可扩展方向”三个角度再 review 一遍。

### 步骤 4：生成综述大纲

```
请基于同一批文献，写一份文献综述大纲，保存到 literature_outline_causal_inference.md。

大纲结构：
1. 研究背景与动机
2. 方法论进展
   2.1 Difference-in-Differences 的最新发展
   2.2 Instrumental Variables 的稳健性改进
   2.3 其他识别策略（如 Synthetic Control、RDD）
3. 实证应用领域
4. 主要争议与未解决问题
5. 对我下一步研究的启示

要求：
- 每个二级标题下列出 2–4 篇关键文献及其一句话贡献；
- 指出文献之间的承接或对立关系；
- 不要编造我没有提供的论文信息。
```

> 如果你要写的是系统性文献综述或需要覆盖更多数据库，推荐阅读 [deep-research](/skills/lingzhi227/agent-research-skills/deep-research) Skill 的六阶段流程，它把检索、筛选、提取、综合、写作、审校拆成了可重复执行的步骤。

## 常见错误与排查

| 问题 | 可能原因 | 解决方案 |
|---|---|---|
| Claude Code 中 `/mcp` 看不到 `zotero` | `zotero-mcp` 不在 PATH 中 | 运行 `which zotero-mcp` 或 `zotero-mcp setup-info` 获取绝对路径，替换 `.mcp.json` 中的 `command` |
| 提示 "Zotero local API not enabled" | Zotero 本地 API 未开启 | 勾选 Zotero 首选项中的 "Enable local API server" 并重启 |
| 查询无结果或返回 0 条 | Zotero 未运行或库为空 | 确认 Zotero 已启动，且文献库中有匹配条目 |
| PDF 全文提取为空 | PDF 是扫描版/图片 | 先用 OCR 处理；或安装 `[pdf]` 扩展后再试 |
| Agent 总结的结论与原文不符 | 模型对长文本理解有误 | 要求 Agent 引用原文片段，并人工核对关键结论 |
| 数据库锁定或权限错误 | 同时配置了 `ZOTERO_DB_PATH` 且 Zotero 正在直接访问 sqlite | 关闭 Zotero 后再用路径模式；或改用本地 API 模式（不设置 `ZOTERO_DB_PATH`） |

## 下一步

完成 Zotero + MCP 接入后，你已经拥有了一个会读文献的 Agent。接下来可以：

1. 把本工作流写入项目的 `CLAUDE.md`，让 Agent 每次进入项目都默认按这套流程处理文献；
2. 用同样的 MCP 思路，把 **Stata** 接入 Claude Code，实现回归分析的自然语言驱动；
3. 把文献矩阵导入 Obsidian、Notion 或 LaTeX，继续写正式综述。

本系列下一篇将介绍 **Claude Code + stata-mcp** 的实证分析工作流。

## 相关 Skill

- [literature-search](/skills/lingzhi227/agent-research-skills/literature-search)：系统化的学术文献检索策略与关键词扩展方法。
- [literature-review](/skills/lingzhi227/agent-research-skills/literature-review)：多视角对话式文献综述，帮助生成矩阵、批注与主题归类。
- [deep-research](/skills/lingzhi227/agent-research-skills/deep-research)：六阶段系统文献综述流程，适合需要跨库检索和严格筛选的研究。

---

**参考链接：**

- [Model Context Protocol 官方文档](https://modelcontextprotocol.io/)
- [54yyyu/zotero-mcp GitHub 仓库](https://github.com/54yyyu/zotero-mcp)
- [Zotero 官方文档](https://www.zotero.org/support/)
- [Claude Code MCP 文档](https://docs.anthropic.com/en/docs/claude-code/mcp)
