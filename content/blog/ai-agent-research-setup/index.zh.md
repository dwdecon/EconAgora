---
slug: "ai-agent-research-setup"
title: "什么是 AI Agent？使用 VSCode 配置自己的第一个科研 Agent"
excerpt: "从零开始理解 AI Agent 的概念，使用 VSCode + Cline 配置一个能读文献、写代码、跑数据的科研助手。"
category: "AI 工具"
date: "2026-05-21"
readTime: "20 分钟"
tags:
  - "AI Agent"
  - "VSCode"
  - "Cline"
  - "科研工具"
  - "入门教程"
author: "戴伟德"
authorRole: "经济学研究者"
issue: "Volume 2605"
illustration: "generated"
cover: "/blog-covers/2026/05/ai-agent-research-setup-final.png"
---

## 引言

2024 年以来，AI Agent（智能体）从一个技术概念迅速演变为研究者手中的生产力工具。与单次对话的 ChatGPT 不同，Agent 能够持续执行任务、调用工具、读写文件，真正融入研究工作流。

本文面向经济学研究者，从零开始：
1. 理解什么是 AI Agent（以及什么不是）
2. 在 VSCode 中配置 Cline 插件
3. 连接 Claude/GPT 模型
4. 完成第一个科研任务：自动下载并解析一篇 NBER Working Paper

无需编程基础，跟着步骤操作即可。

## 第一部分：AI Agent 到底是什么？

### 1.1 从 ChatGPT 到 Agent：关键区别

| 特性 | ChatGPT | AI Agent |
|-----|---------|----------|
| 交互方式 | 单次对话 | 持续任务执行 |
| 文件操作 | 手动上传/下载 | 自动读写文件 |
| 工具使用 | 无 | 可调用计算器、搜索引擎、代码解释器等 |
| 记忆 | 对话窗口内 | 可读写外部文件，跨会话持久 |
| 工作流 | 一问一答 | 自主规划 → 执行 → 反思 → 调整 |

**简单理解：** ChatGPT 是"顾问"，Agent 是"助理"。顾问给你建议，助理直接动手做。

### 1.2 Agent 的核心架构

一个完整的 AI Agent 包含三个组件：

```
┌─────────────────────────────────────────┐
│              AI Agent 架构               │
├─────────────────────────────────────────┤
│  ① 大脑（LLM）                           │
│     - Claude / GPT-4 / DeepSeek          │
│     - 负责推理、规划、决策                │
├─────────────────────────────────────────┤
│  ② 工具（Tools）                         │
│     - 文件读写（fs）                      │
│     - 网页搜索（search）                  │
│     - 代码执行（code）                    │
│     - 数据库查询（sql）                   │
├─────────────────────────────────────────┤
│  ③ 记忆（Memory）                        │
│     - 短期：当前任务上下文                │
│     - 长期：配置文件、知识库              │
└─────────────────────────────────────────┘
```

### 1.3 科研场景中的 Agent

在经济学研究中，Agent 可以：

- **文献工作**：自动下载 PDF、提取摘要、整理笔记
- **数据处理**：读取数据、清洗变量、生成描述统计
- **实证分析**：编写 Stata/R/Python 代码、运行回归、解读结果
- **写作辅助**：生成文献综述段落、润色论文、检查引用格式

**本文目标**：配置一个能完成"下载 → 阅读 → 总结"文献的基础 Agent。

## 第二部分：环境准备

### 2.1 安装 VSCode

VSCode（Visual Studio Code）是微软开发的免费代码编辑器，也是目前配置 Agent 最方便的平台。

**下载地址**：https://code.visualstudio.com/

安装完成后，打开 VSCode，确保能正常启动即可。

### 2.2 安装 Cline 插件

Cline 是目前最成熟的 VSCode Agent 插件之一，支持 Claude、GPT-4、DeepSeek 等多种模型。

**安装步骤**：

1. 打开 VSCode
2. 点击左侧活动栏的「扩展」图标（四个方块）
3. 搜索 "Cline"
4. 找到由 `saoudrizwan` 开发的 Cline 插件
5. 点击「安装」

**验证安装**：

安装完成后，左侧活动栏会出现 Cline 的机器人图标（🤖）。点击打开，看到聊天界面即表示成功。

### 2.3 获取 API Key

Cline 需要调用大模型 API，以下是几种选择：

| 模型 | 提供商 | 特点 | 获取方式 |
|-----|--------|------|---------|
| Claude 3.5 Sonnet | Anthropic | 推理能力强，适合科研 | https://console.anthropic.com/ |
| GPT-4o | OpenAI | 通用能力强，代码好 | https://platform.openai.com/ |
| DeepSeek-V3 | DeepSeek | 中文优秀，性价比高 | https://platform.deepseek.com/ |

**推荐**：Claude 3.5 Sonnet（科研场景表现最佳）

**操作步骤**（以 Anthropic 为例）：

1. 访问 https://console.anthropic.com/
2. 注册/登录账号
3. 进入 "API Keys" 页面
4. 点击 "Create Key"
5. 复制生成的密钥（格式：`sk-ant-api03-...`）

**安全提示**：API Key 相当于密码，不要分享给他人，不要上传到公开仓库。

### 2.4 配置 Cline

**步骤 1：打开 Cline 设置**

1. 点击 VSCode 左下角的「设置」图标（齿轮）
2. 选择「设置」
3. 搜索 "Cline"
4. 找到 "Cline: Api Key" 选项

**步骤 2：填入 API Key**

在 "Cline: Api Key" 输入框中粘贴你的 Anthropic API Key。

**步骤 3：选择模型**

找到 "Cline: Model" 选项，选择 `claude-3-5-sonnet-20241022`。

**步骤 4：验证连接**

1. 点击左侧 Cline 图标打开聊天面板
2. 输入："你好，请简单介绍一下自己"
3. 如果看到 Claude 的回复，说明配置成功

**常见问题**：

| 问题 | 解决方法 |
|-----|---------|
| "API Key invalid" | 检查 Key 是否完整复制，有无多余空格 |
| "Rate limit exceeded" | 等待 1 分钟后重试，或升级账户 |
| 无回复/超时 | 检查网络连接，尝试切换模型 |

## 第三部分：第一个科研任务

### 3.1 任务目标

让 Agent 自动完成：
1. 下载一篇 NBER Working Paper（PDF）
2. 提取标题、作者、摘要、关键词
3. 生成中文摘要总结
4. 保存到本地文件

### 3.2 配置工具权限

Cline 默认只能读写工作区文件，需要授予网络访问权限：

1. 打开 Cline 聊天面板
2. 点击右上角的「设置」图标
3. 找到 "Auto-approve" 选项
4. 勾选：
   - ✅ Read files
   - ✅ Edit files
   - ✅ Execute approved commands
   - ✅ Use browser

**安全说明**：勾选 "Execute approved commands" 后，Cline 会询问是否执行每条命令，你可以审查后再批准。

### 3.3 编写任务提示词

在 Cline 聊天框中输入以下提示词：

```
请帮我完成以下科研任务：

1. 从 NBER 网站下载 Working Paper 31952（URL: https://www.nber.org/papers/w31952）
2. 如果无法直接下载，请使用网页搜索找到该论文的标题、作者、摘要
3. 提取以下信息：
   - 标题
   - 作者
   - 发表日期
   - 摘要（英文）
   - 关键词（如果有）
4. 将摘要翻译成中文
5. 生成一段 200 字的中文综述，说明这篇论文的研究问题、方法和主要发现
6. 将所有信息保存到文件 "paper_summary.md"

注意：
- 如果下载 PDF 需要付费，请改用网页搜索获取信息
- 保存文件时使用 UTF-8 编码
- 文件格式使用 Markdown
```

### 3.4 观察 Agent 的工作过程

输入提示词后，Cline 会开始自主工作。你会看到：

**第一步：规划**

Agent 会先将任务拆解为子步骤：
```
我将按以下步骤完成：
1. 尝试访问 NBER 网站获取论文信息
2. 如果无法访问，使用网页搜索
3. 提取并整理信息
4. 翻译摘要
5. 生成综述
6. 保存到文件
```

**第二步：执行**

Agent 会调用浏览器工具访问 NBER 网站，或调用搜索工具查找信息。

**第三步：反思**

如果遇到问题（如网站需要登录），Agent 会调整策略：
```
NBER 网站需要订阅才能查看完整摘要。我将改用 Google Scholar 搜索该论文。
```

**第四步：完成**

最终，Agent 会生成 `paper_summary.md` 文件，内容类似：

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
这篇论文研究了人工智能对科学发现的影响。作者使用...[200字综述]

## 关键词
AI, Scientific Discovery, Innovation, Productivity
```

### 3.5 检查结果

1. 在 VSCode 左侧「资源管理器」中找到 `paper_summary.md`
2. 点击打开，检查内容是否完整
3. 如有遗漏，可以在 Cline 中继续对话："请补充论文的研究方法部分"

## 第四部分：理解 Agent 的能力边界

### 4.1 Agent 能做什么？

| 能力 | 示例 |
|-----|------|
| 文件操作 | 读写本地文件、创建文件夹、移动文件 |
| 网络访问 | 搜索网页、下载文件、调用 API |
| 代码执行 | 运行 Python/R/Stata 代码、安装包 |
| 数据分析 | 读取 CSV、生成图表、计算统计量 |
| 文本处理 | 翻译、摘要、格式化、生成 Markdown |

### 4.2 Agent 不能做什么？

| 限制 | 说明 |
|-----|------|
| 无法访问付费数据库 | JSTOR、ScienceDirect 等需要机构订阅 |
| 无法运行需要 GUI 的软件 | 如 Stata 的图形界面、Excel |
| 无法处理超大文件 | 超过 100MB 的 PDF 或数据集可能超时 |
| 无法保证 100% 准确 | 需要人工核查关键信息 |

### 4.3 人机协作的最佳实践

```
研究者          Agent
  │              │
  ├─ 定义任务 ──→│
  │              ├─ 执行
  │              ├─ 遇到问题
  ├─ 提供指导 ←──┤
  │              ├─ 调整执行
  │              ├─ 完成
  ├─ 核查结果 ←──┤
  ├─ 提出修改 ──→│
  │              ├─ 修改
  │              ↓
  └─ 最终确认 ←──┘
```

**关键原则**：
- 任务要具体、可验证
- 关键数据必须人工核查
- 复杂任务分步骤执行
- 保存中间结果，便于回溯

## 第五部分：进阶配置

### 5.1 配置自定义指令

Cline 支持自定义系统指令，让 Agent 始终以特定方式工作：

1. 打开 Cline 设置
2. 找到 "Custom Instructions"
3. 输入：

```
你是一位经济学研究助手。在完成任务时：
1. 优先使用学术来源（NBER、arXiv、SSRN）
2. 引用文献时提供完整信息（作者、年份、标题）
3. 数据分析时使用 Python（pandas、matplotlib）
4. 结果保存为 Markdown 格式
5. 不确定的信息明确标注"[待核实]"
```

### 5.2 配置常用工具

**安装 Python 环境**（用于数据分析）：

在 Cline 中输入：
```
请帮我检查系统是否安装了 Python。如果没有，请指导我安装。
安装完成后，请安装以下包：pandas、requests、beautifulsoup4、PyPDF2
```

**安装 Node.js**（用于运行 JavaScript 工具）：

类似地，让 Agent 指导你安装 Node.js 环境。

### 5.3 保存工作区配置

将当前配置保存为工作区，方便下次使用：

1. VSCode 菜单：文件 → 将工作区另存为...
2. 命名为 "ResearchAgent.code-workspace"
3. 保存到项目文件夹

下次打开时，双击该文件即可恢复完整环境。

## 总结

本文介绍了：

1. **AI Agent 概念**：从 ChatGPT 到 Agent 的演进，三大核心组件
2. **环境配置**：VSCode + Cline + Claude API 的完整安装流程
3. **实战任务**：自动下载并总结 NBER Working Paper
4. **能力边界**：Agent 能做什么、不能做什么
5. **进阶配置**：自定义指令、工具安装、工作区保存

**下一步**：

在下一篇文章中，我们将学习如何给 Agent 接入文献库（Zotero），实现：
- 自动同步 Zotero 收藏
- 批量下载 PDF 并提取元数据
- 生成文献综述的初步框架

---

**延伸阅读：**

- Cline 官方文档：https://github.com/cline/cline
- MCP（Model Context Protocol）：https://modelcontextprotocol.io/
- Anthropic API 文档：https://docs.anthropic.com/

**工具推荐：**

- Cline：VSCode 最佳 Agent 插件
- Claude 3.5 Sonnet：科研场景首选模型
- VSCode：轻量、免费、插件丰富

---

*本文是 EconAgora "AI Agent 科研助手"系列的第一篇。如有问题，欢迎在 Twitter @EconAgora 讨论。*
