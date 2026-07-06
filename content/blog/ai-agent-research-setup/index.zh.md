---
slug: ai-agent-research-setup
title: 什么是 AI Agent？使用 VSCode 配置自己的第一个科研 Agent
excerpt: 面向经济学研究者，从零开始用 VS Code + Claude Code + CC Switch 搭建本地 AI 科研 Agent，并完成下载 NBER Working Paper 与生成结构化中文摘要的完整示例。
category: AI 工具
date: '2026-05-21'
readTime: 20 分钟
tags:
  - AI Agent
  - VSCode
  - Claude Code
  - CC Switch
  - 科研工具
  - 入门教程
author: 戴伟德
authorRole: 经济学研究者
issue: EA-2026-05-001
cover: /blog-covers/2026/05/ai-agent-research-setup-final.png
series: ai-research-best-practices
seriesOrder: 1
status: published
---

![AI 科研最佳实践](/blog-covers/series-ai-research-best-practices.png)

## 引言

2024 年以来，AI Agent（智能体）从一个技术概念快速变成研究者桌上的实用工具。与单次对话的 ChatGPT 不同，Agent 能够持续执行任务、调用工具、读写文件，真正嵌入到文献下载、数据整理、实证分析等研究环节中。

本文面向经济学研究者，目标是把下面这套工具链跑通：

1. **VS Code**：作为编辑器与终端集成环境。
2. **Claude Code**：Anthropic 官方 CLI Agent，能读项目文件、执行命令。
3. **CC Switch**：管理 Claude Code 等 CLI 工具的 API 供应商切换，让你在不同模型之间一键切换。

完成环境配置后，我们会一起完成第一个端到端科研任务：**让 Agent 自动下载一篇 NBER Working Paper，并生成一份结构化的中文摘要**。

本文假设你没有太多编程基础，只需要能安装软件、打开终端即可。如果你希望把这套流程转化为可复用的研究资产，后文会提到如何衔接 `research-planning` 与 `idea-generation` 两个 Skill。

## 1. 从 ChatGPT 到 Agent：关键区别

ChatGPT 适合“一问一答”：你提一个问题，它给一段回答。Agent 则更像一个能持续干活的助手：你把目标说清楚，它会自己规划、调用工具、读写文件，并在遇到问题时调整方案。

| 特性 | ChatGPT 类网页对话 | AI Agent |
|---|---|---|
| 交互方式 | 单次或连续对话 | 持续任务执行 |
| 文件操作 | 手动上传/下载 | 自动读写工作区文件 |
| 工具调用 | 内置有限 | 可调用搜索、代码执行、数据库等外部工具 |
| 记忆 | 依赖对话窗口 | 可持久化到配置文件、知识库 |
| 工作流 | 提问—回答 | 目标 → 规划 → 执行 → 反思 → 调整 |

**一句话理解**：ChatGPT 是“顾问”，Agent 是“助理”。顾问给你建议，助理可以直接动手做。

## 2. Agent 的三大组件

一个能完成科研任务的 AI Agent 至少包含三个部分：

```text
┌─────────────────────────────────────────┐
│              AI Agent 架构               │
├─────────────────────────────────────────┤
│  ① 大脑（LLM）                           │
│     - Claude / GPT-4 / DeepSeek / Kimi   │
│     - 负责推理、规划、决策                │
├─────────────────────────────────────────┤
│  ② 工具（Tools）                         │
│     - 文件读写（fs）                      │
│     - 网页搜索与下载（Web / Fetch）       │
│     - 代码执行（Bash / Python）           │
│     - 数据库 / 文献库接口（MCP）          │
├─────────────────────────────────────────┤
│  ③ 记忆（Memory）                        │
│     - 短期：当前任务上下文                │
│     - 长期：CLAUDE.md、项目文档、知识库   │
└─────────────────────────────────────────┘
```

在经济学研究中，这三部分可以映射为：

- **大脑**：选择合适的大模型处理文献摘要、代码生成或因果推断推理。
- **工具**：调用 Python 读取 CSV、调用 Stata 跑回归、调用 Zotero MCP 检索文献。
- **记忆**：用 `CLAUDE.md` 保存“你是一位经济学研究助手”的自定义指令，让 Agent 每次启动都按同一套规则工作。

本文先聚焦最基础的组合：用 Claude Code 作为 Agent 壳，用 VS Code 作为操作环境，用 CC Switch 作为模型切换层。

## 3. 环境准备

### 3.1 安装 VS Code

VS Code（Visual Studio Code）是微软开发的免费代码编辑器，内置终端，能方便地与 Claude Code 协同。

1. 访问 <https://code.visualstudio.com/> 下载对应系统版本。
2. 安装后打开，按提示完成初始化。
3. 建议安装一个项目文件夹作为工作区：菜单「文件」→「打开文件夹…」，选择或新建一个目录，例如 `~/research-agent-demo`。

### 3.2 安装 Claude Code

Claude Code 是 Anthropic 官方推出的命令行 Agent 工具。它会在终端中与你交互，并能在工作区里读写文件、运行命令。

**前置要求**：Node.js >= 18。如果尚未安装，可到 <https://nodejs.org/> 下载 LTS 版本，或用系统包管理器安装。

**安装命令**：

```bash
npm install -g @anthropic-ai/claude-code
```

**验证安装**：

```bash
claude --version
```

如果看到版本号，说明安装成功。

### 3.3 安装与配置 CC Switch

CC Switch 是一个跨平台的 CLI 工具 API 供应商切换工具，主要用来管理 Claude Code、Codex 等工具的 API 来源。通过它，你可以在 Anthropic 官方、Kimi、DeepSeek 等模型之间快速切换，而不用手动改配置文件。

**系统要求**：

- Windows 10 及以上
- macOS 12 (Monterey) 及以上
- Linux：Ubuntu 22.04+ / Debian 11+ / Fedora 34+

**安装方式**：

- **Windows**：访问 [CC Switch GitHub Releases](https://github.com/farion1231/cc-switch/releases)，下载 `CC-Switch-v{版本号}-Windows.msi`，双击安装。
- **macOS（推荐 Homebrew）**：
  ```bash
  brew tap farion1231/ccswitch
  brew install --cask cc-switch
  ```
  也可手动下载 `.dmg` 安装。
- **Linux**：按发行版选择 `.deb`、`.rpm` 或 `.AppImage`。

**验证安装**：

打开 CC Switch，主界面显示已识别的 CLI 工具（如 Claude Code）和当前供应商状态，即表示成功。

### 3.4 获取 API Key 与添加供应商

API Key 是调用大模型服务的凭证。不同平台的获取方式如下：

- **Anthropic 官方**：访问 <https://console.anthropic.com/>，注册或登录后进入 “API Keys” 页面，点击 “Create Key”，复制以 `sk-ant-api03-` 开头的密钥。
- **Kimi（Moonshot）**：访问 <https://platform.moonshot.cn/>，在 “API Key 管理” 中创建密钥。
- **DeepSeek**：访问 <https://platform.deepseek.com/>，在 “API Keys” 页面创建密钥。
- **通义千问 / 文心一言**：类似地在对应开发者平台创建 API Key。

**安全提示**：API Key 等同于密码，不要截图发到公开渠道，也不要写入代码或 Markdown 后提交到 Git。

在 CC Switch 中添加供应商：

1. 打开 CC Switch，点击「添加供应商」。
2. 选择预设，例如 “Anthropic” 或 “Moonshot（Kimi）”。
3. 填入 API Key，必要时填写 Base URL。
4. 选择默认模型，例如 `claude-sonnet-4-20250514`、`kimi-latest` 或 `deepseek-chat`。
5. 点击「保存」。

常用国产模型配置参考：

| 模型 | 供应商 | Base URL 示例 | 模型 ID |
|---|---|---|---|
| Kimi | Moonshot | `https://api.moonshot.cn/v1` | `kimi-latest` |
| DeepSeek | DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| 通义千问 | Alibaba | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-max` |
| 文心一言 | Baidu | `https://qianfan.baidubce.com/v2` | `ernie-bot-4` |

**切换供应商**：

- 在 CC Switch 主界面选择目标供应商，点击「启用」。
- 或在系统托盘图标上直接点击供应商名称切换，Claude Code 无需重启即可生效。

### 3.5 在 VS Code 集成终端中启动 Claude Code

Claude Code 在 VS Code 的集成终端里使用最顺手，因为可以直接引用当前打开的项目文件。

**步骤 1**：打开 VS Code 终端。按 `` Ctrl+` ``（反引号），或点击菜单「终端」→「新建终端」。

**步骤 2**：启动 Claude Code：

```bash
claude
```

首次启动会提示 OAuth 登录，按屏幕指引在浏览器完成授权即可。

**步骤 3**：验证连接：

```text
你好，请简单介绍一下自己
```

如果看到 Claude 的回复，说明配置完成。

常用命令：

| 命令 | 说明 |
|---|---|
| `claude` | 启动交互式对话 |
| `claude "任务描述"` | 直接执行单次任务 |
| `claude --help` | 查看所有选项 |
| `/exit` 或 `Ctrl+D` | 退出 Claude Code |

常见问题：

| 问题 | 解决方法 |
|---|---|
| API Key invalid | 检查 Key 是否完整复制，有无多余空格 |
| Rate limit exceeded | 等待 1 分钟后重试，或升级账户 / 切换供应商 |
| 无回复或超时 | 检查网络，尝试在 CC Switch 中切换供应商 |
| Claude Code 无法启动 | 确认 Node.js >= 18，必要时重新安装 |

## 4. 第一个科研任务：下载 NBER Working Paper 并生成结构化摘要

### 4.1 任务目标

让 Agent 自动完成以下工作：

1. 获取 NBER Working Paper 31952 的元数据。
2. 提取标题、作者、发表日期、英文摘要、关键词。
3. 将摘要翻译成中文。
4. 生成一段 200 字左右的中文综述，说明研究问题、方法和主要发现。
5. 将所有内容保存为 `paper_summary.md`。

> 说明：NBER 工作论文的 PDF 全文通常需要订阅或购买，但标题、作者和摘要等元数据一般是公开的。本任务以公开信息为准；如果页面需要登录，Agent 会改用网页搜索完成摘要采集。

### 4.2 配置工具权限

Claude Code 默认只能读写当前工作区文件。如果要下载网页内容，需要给它网络访问权限；如果要运行命令，需要允许命令执行。

1. 启动 Claude Code。
2. 输入 `/permissions` 查看当前权限。
3. 按提示启用：
   - ✅ 文件读写（Files）
   - ✅ 网络访问（Web / Fetch）
   - ✅ 命令执行（Bash，执行前会逐条确认）

**安全说明**：启用命令执行后，Claude Code 在执行每条命令前都会询问你是否批准，请逐条检查后再确认。

### 4.3 编写任务提示词

在 Claude Code 中输入以下提示词。目标要具体、输出格式要明确，这样 Agent 才不容易跑偏。

```text
请帮我完成以下科研任务：

1. 访问 NBER 网站，获取 Working Paper 31952 的公开信息（URL: https://www.nber.org/papers/w31952）。
2. 如果无法直接访问页面，请使用网页搜索找到该论文的标题、作者和摘要。
3. 提取以下信息：
   - 标题
   - 作者
   - 发表日期
   - 英文摘要
   - 关键词（如果有）
4. 将英文摘要翻译成中文。
5. 生成一段 200 字左右的中文综述，说明这篇论文的研究问题、识别策略或方法、以及主要发现。
6. 将所有信息保存到当前工作区的 "paper_summary.md" 文件中。

要求：
- 文件使用 UTF-8 编码。
- 文件格式为 Markdown。
- 如果某项信息缺失，请标注“[待核实]”。
- 不要编造未在页面中明确出现的信息。
```

### 4.4 观察 Agent 的执行过程

输入提示词后，Claude Code 会展示一个典型的 Agent 工作循环：

**第一步：规划**

Agent 会先拆解任务：

```text
我将按以下步骤完成：
1. 尝试访问 NBER 页面获取论文元数据
2. 若访问受限，改用网页搜索
3. 提取标题、作者、日期、摘要、关键词
4. 翻译摘要并生成中文综述
5. 保存为 Markdown 文件
```

**第二步：执行**

Agent 会调用浏览器工具或搜索工具访问页面，并抓取可见文本。

**第三步：反思与调整**

如果 NBER 页面需要登录，Agent 会调整策略：

```text
NBER 页面需要订阅才能查看完整摘要，我将改用 Google Scholar / Semantic Scholar 搜索该论文。
```

**第四步：完成并保存**

最终，Agent 会在工作区生成 `paper_summary.md`，内容结构如下：

```markdown
# NBER Working Paper 31952 摘要

## 基本信息
- **标题**: The Impact of AI on Scientific Discovery
- **作者**: Aidan T. Thompson, et al.
- **发表日期**: 2023-10
- **NBER 编号**: w31952

## 英文摘要
[英文摘要原文]

## 中文摘要
[中文翻译]

## 综述
这篇论文研究了人工智能对科学发现的影响。作者使用……[约 200 字]

## 关键词
AI, Scientific Discovery, Innovation, Productivity
```

### 4.5 检查结果与人工核查

1. 在 VS Code 左侧「资源管理器」中找到 `paper_summary.md`。
2. 点击打开，检查标题、作者、日期、摘要是否完整。
3. 对关键信息进行抽查：打开浏览器，核对 NBER 页面或 Google Scholar 上的元数据。
4. 如果内容有遗漏，可以在 Claude Code 中继续对话，例如：
   - “请补充论文的研究方法部分。”
   - “请把关键词翻译成中文。”
   - “请在综述中增加一段研究贡献的评价。”

**关键原则**：Agent 生成的内容永远需要人工核查，尤其是用于论文写作或政策分析时。

## 5. Agent 的能力边界与风险提示

在把 Agent 投入日常使用之前，需要清楚它能做什么、不能做什么。

### 5.1 Agent 能做什么

| 能力 | 示例 |
|---|---|
| 文件操作 | 读写本地文件、创建文件夹、批量重命名 |
| 网络访问 | 搜索网页、下载公开 PDF、调用开放 API |
| 代码执行 | 运行 Python / R / Stata 代码、安装依赖 |
| 数据分析 | 读取 CSV、生成图表、计算统计量 |
| 文本处理 | 翻译、摘要、格式化、生成 Markdown |

### 5.2 Agent 不能做什么

| 限制 | 说明 |
|---|---|
| 无法绕过付费墙 | JSTOR、ScienceDirect、NBER 全文等需要机构订阅 |
| 无法操作 GUI 软件 | 如 Stata 图形界面、Excel、Adobe Reader |
| 无法处理超大文件 | 超过 100 MB 的 PDF 或数据集可能超时或失败 |
| 无法保证 100% 准确 | 模型可能“幻觉”或误解网页内容，需要人工复核 |

### 5.3 风险与责任边界

- **幻觉风险**：Agent 可能生成看似合理但实际不存在的引用或数据。凡是用于论文、报告、政策建议的内容，必须人工核对来源。
- **隐私风险**：不要把未脱敏的微观数据、未发表的论文草稿上传到公共模型服务。
- **成本风险**：Agent 调用 API 是按 token 计费的长会话。建议先在小样本上测试，再批量处理。

## 6. 人机协作最佳实践与进阶配置

### 6.1 用 CLAUDE.md 保存自定义指令

如果你希望 Agent 每次启动都按经济学研究的规范工作，可以在项目根目录创建 `CLAUDE.md`：

```text
你是一位经济学研究助手。在完成任务时，请遵守以下规则：

1. 优先使用学术来源（NBER、arXiv、SSRN、Google Scholar）。
2. 引用文献时提供作者、年份、标题和工作论文编号（如果有）。
3. 数据分析默认使用 Python（pandas、matplotlib、statsmodels），需要时也可使用 Stata。
4. 结果保存为 Markdown 格式，表格使用标准 Markdown 表格。
5. 不确定的信息明确标注“[待核实]”。
6. 在执行命令前征求我的同意，除非是只读操作。
```

Claude Code 会自动读取当前工作区的 `CLAUDE.md` 并遵循其中指令。如果你经常做文献综述，可以把这个文件和 `research-planning` Skill 中的模板结合起来，形成固定的研究启动流程。

### 6.2 安装常用工具

为了让 Agent 能处理更复杂的科研任务，建议在工作区里准备好 Python 环境：

```bash
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install pandas requests beautifulsoup4 PyPDF2
```

之后你可以直接对 Claude Code 说：

```text
请用 Python 读取 data.csv，计算主要变量的描述性统计，并保存到 summary_stats.md。
```

### 6.3 通过 CC Switch 切换模型的典型场景

不同模型在不同任务上各有优势，CC Switch 的价值就是让你按需切换：

| 场景 | 推荐供应商 | 原因 |
|---|---|---|
| 处理中文文献、润色中文段落 | Kimi | 中文理解和长文本能力较强 |
| 生成 Stata / Python 代码 | DeepSeek | 代码生成在中文语境下表现稳定 |
| 复杂推理、识别策略讨论 | Anthropic Claude | 学术推理和结构化输出表现较好 |

切换时只需在 CC Switch 中启用目标供应商，Claude Code 中的下一条对话就会使用新模型，无需重启终端。

### 6.4 保存工作区配置

为了方便下次继续，可以把 VS Code 当前配置保存为工作区文件：

1. VS Code 菜单：「文件」→「将工作区另存为…」。
2. 命名为 `ResearchAgent.code-workspace`。
3. 保存到项目文件夹。

下次双击该文件即可恢复完整的窗口布局、终端历史和项目文件。

## 7. 总结与下一篇预告

本文介绍了：

1. **AI Agent 的核心概念**：从 ChatGPT 到 Agent 的演进，以及大脑、工具、记忆三大组件。
2. **环境搭建**：VS Code + Claude Code + CC Switch 的安装、登录和供应商切换。
3. **实战任务**：自动下载并总结 NBER Working Paper，生成结构化的中文摘要。
4. **能力边界**：Agent 能处理公开网页、文件和代码，但不能绕过付费墙、操作 GUI 或替代人工核查。
5. **进阶配置**：用 `CLAUDE.md` 自定义指令、安装 Python 工具链、按场景切换模型。

**下一步**：

在下一篇文章中，我们将给 Agent 接入文献库，学习如何通过 **Zotero + MCP** 实现：

- 自动检索本地 Zotero 收藏的元数据
- 批量检查 PDF 并提取关键章节
- 生成文献综述的初步框架

## 相关 Skill

如果你希望把本文的 workflow 转化为可复用的研究能力，可以参考我们在 Claude Code 项目中维护的两个 Skill：

- [/skills/lingzhi227/agent-research-skills/research-planning](/skills/lingzhi227/agent-research-skills/research-planning)：研究规划与任务拆解模板，适合把“下载 → 阅读 → 总结”扩展为系统化的文献调研流程。
- [/skills/lingzhi227/agent-research-skills/idea-generation](/skills/lingzhi227/agent-research-skills/idea-generation)：从已有摘要和笔记中提炼研究问题与假设，适合在文献总结完成后进入选题阶段。

---

**延伸阅读**：

- CC Switch GitHub 仓库：<https://github.com/farion1231/cc-switch>
- Claude Code 官方文档：<https://docs.anthropic.com/en/docs/claude-code/overview>
- Model Context Protocol：<https://modelcontextprotocol.io/>
- Anthropic API 文档：<https://docs.anthropic.com/>

---

*本文是 EconAgora “AI 科研最佳实践”系列的第一篇。如有问题，欢迎在 Twitter @EconAgora 讨论。*
