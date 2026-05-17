---
slug: "ai-agent-research-setup"
title: "什么是 AI Agent？使用 VSCode 配置自己的第一个科研 Agent"
excerpt: "从零开始理解 AI Agent 的概念，使用 VSCode + Claude + CC Switch 配置一个能读文献、写代码、跑数据的科研助手。"
category: "AI 工具"
date: "2026-05-21"
readTime: "20 分钟"
tags:
  - "AI Agent"
  - "VSCode"
  - "Claude"
  - "CC Switch"
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
2. 安装和配置 CC Switch（API 切换工具）
3. 在 VSCode 中使用 Claude Code
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

### 2.2 安装 CC Switch

CC Switch 是一个跨平台的桌面 All-in-One 助手，用于管理 Claude Code、Codex、Gemini CLI 等 AI CLI 工具的 API 供应商切换。通过 CC Switch，你可以轻松在 Claude 中使用国产模型（如 Kimi、DeepSeek 等），无需手动编辑配置文件。

**系统要求**：
- Windows 10 及以上
- macOS 12 (Monterey) 及以上
- Linux: Ubuntu 22.04+ / Debian 11+ / Fedora 34+

**下载安装**：

**Windows 用户**：
1. 访问 [CC Switch GitHub Releases](https://github.com/farion1231/cc-switch/releases)
2. 下载 `CC-Switch-v{版本号}-Windows.msi` 安装包
3. 双击安装，按提示完成

**macOS 用户（推荐 Homebrew）**：
```bash
brew tap farion1231/ccswitch
brew install --cask cc-switch
```

或手动下载 `.dmg` 文件安装。

**Linux 用户**：
- Debian/Ubuntu: 下载 `.deb` 包
- Fedora/RHEL: 下载 `.rpm` 包
- 通用: 下载 `.AppImage`

**验证安装**：
安装完成后，打开 CC Switch，看到主界面即表示成功。主界面会显示当前配置的 CLI 工具（Claude Code、Codex 等）和供应商状态。

### 2.3 配置 Claude Code

Claude Code 是 Anthropic 推出的官方 CLI 工具，让你在终端中直接与 Claude 对话，执行文件操作、代码编写等任务。

**安装 Claude Code**：
```bash
npm install -g @anthropic-ai/claude-code
```

**验证安装**：
```bash
claude --version
```

### 2.4 在 CC Switch 中添加供应商

CC Switch 支持 50+ 供应商预设，包括官方 API 和第三方中转服务。你可以轻松切换 Claude、Kimi、DeepSeek 等模型。

**添加官方 Anthropic 供应商**：
1. 打开 CC Switch
2. 点击「添加供应商」
3. 选择预设："Anthropic"（官方）
4. 输入你的 API Key
5. 点击「保存」

**添加国产模型供应商（以 Kimi 为例）**：
1. 点击「添加供应商」
2. 选择预设："Moonshot"（Kimi）或自定义 OpenAI 兼容接口
3. 输入 API Key 和 Base URL
4. 选择模型：`kimi-latest` 或具体版本
5. 点击「保存」

**常用国产模型配置**：

| 模型 | 供应商 | Base URL 示例 | 模型 ID |
|-----|--------|--------------|---------|
| Kimi | Moonshot | `https://api.moonshot.cn/v1` | `kimi-latest` |
| DeepSeek | DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| 通义千问 | Alibaba | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-max` |
| 文心一言 | Baidu | `https://qianfan.baidubce.com/v2` | `ernie-bot-4` |

**切换供应商**：
- 主界面：选择供应商 → 点击「启用」
- 系统托盘：直接点击供应商名称（立即生效，Claude Code 无需重启）

### 2.5 获取 API Key

**Anthropic 官方**：
1. 访问 https://console.anthropic.com/
2. 注册/登录账号
3. 进入 "API Keys" 页面
4. 点击 "Create Key"
5. 复制生成的密钥（格式：`sk-ant-api03-...`）

**Kimi（Moonshot）**：
1. 访问 https://platform.moonshot.cn/
2. 注册/登录账号
3. 进入 "API Key 管理"
4. 创建新 Key

**DeepSeek**：
1. 访问 https://platform.deepseek.com/
2. 注册/登录账号
3. 进入 "API Keys" 页面
4. 创建新 Key

**安全提示**：API Key 相当于密码，不要分享给他人，不要上传到公开仓库。

### 2.6 在 VSCode 中使用 Claude Code

Claude Code 可以在 VSCode 的集成终端中使用，实现与编辑器的无缝协作。

**步骤 1：打开 VSCode 终端**
1. 打开 VSCode
2. 按 `` Ctrl+` `` 或点击菜单「终端」→「新建终端」

**步骤 2：启动 Claude Code**
```bash
claude
```

首次启动会要求登录，按提示完成 OAuth 认证。

**步骤 3：验证连接**
在 Claude Code 提示符下输入：
```
你好，请简单介绍一下自己
```

如果看到 Claude 的回复，说明配置成功。

**常用命令**：
| 命令 | 说明 |
|-----|------|
| `claude` | 启动交互式对话 |
| `claude "任务描述"` | 直接执行单次任务 |
| `claude --help` | 查看所有选项 |
| `/exit` 或 `Ctrl+D` | 退出 Claude Code |

**在 VSCode 中与文件协作**：
1. 在 VSCode 中打开项目文件夹
2. 在终端中启动 `claude`
3. 可以直接引用文件："请帮我分析 `data.csv` 文件"
4. Claude 会读取文件并执行分析

**常见问题**：

| 问题 | 解决方法 |
|-----|---------|
| "API Key invalid" | 检查 Key 是否完整复制，有无多余空格 |
| "Rate limit exceeded" | 等待 1 分钟后重试，或升级账户 |
| 无回复/超时 | 检查网络连接，尝试切换供应商 |
| Claude Code 无法启动 | 确保 Node.js 版本 >= 18，重新安装 |

## 第三部分：第一个科研任务

### 3.1 任务目标

让 Agent 自动完成：
1. 下载一篇 NBER Working Paper（PDF）
2. 提取标题、作者、摘要、关键词
3. 生成中文摘要总结
4. 保存到本地文件

### 3.2 配置工具权限

Claude Code 默认只能读写工作区文件，需要授予网络访问权限：

1. 启动 Claude Code
2. 输入 `/permissions` 查看当前权限
3. 按提示启用需要的权限：
   - ✅ 文件读写
   - ✅ 网络访问
   - ✅ 命令执行（需确认）

**安全说明**：启用命令执行后，Claude 会询问是否执行每条命令，你可以审查后再批准。

### 3.3 编写任务提示词

在 Claude Code 中输入以下提示词：

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

输入提示词后，Claude Code 会开始自主工作。你会看到：

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
3. 如有遗漏，可以在 Claude Code 中继续对话："请补充论文的研究方法部分"

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

Claude Code 支持自定义系统指令，让 Agent 始终以特定方式工作：

1. 在项目根目录创建 `CLAUDE.md` 文件
2. 写入：

```
你是一位经济学研究助手。在完成任务时：
1. 优先使用学术来源（NBER、arXiv、SSRN）
2. 引用文献时提供完整信息（作者、年份、标题）
3. 数据分析时使用 Python（pandas、matplotlib）
4. 结果保存为 Markdown 格式
5. 不确定的信息明确标注"[待核实]"
```

3. Claude Code 会自动读取该文件并遵循指令

### 5.2 配置常用工具

**安装 Python 环境**（用于数据分析）：

在 Claude Code 中输入：
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

### 5.4 使用 CC Switch 切换模型

CC Switch 的核心价值在于一键切换不同模型供应商：

**场景 1：使用 Kimi 处理中文文献**
1. 在 CC Switch 中启用 Kimi 供应商
2. 在 Claude Code 中提问："请总结这篇中文论文的要点"
3. Kimi 的中文理解能力会更适合

**场景 2：使用 DeepSeek 进行代码生成**
1. 切换到 DeepSeek 供应商
2. 提问："请帮我写一个 Stata 的 DID 回归代码"
3. DeepSeek 的代码能力在中文场景下表现优异

**场景 3：切换回 Claude 进行复杂推理**
1. 切换回 Anthropic 官方供应商
2. 提问需要深度推理的问题
3. Claude 的推理能力在学术分析中表现最佳

## 总结

本文介绍了：

1. **AI Agent 概念**：从 ChatGPT 到 Agent 的演进，三大核心组件
2. **环境配置**：VSCode + CC Switch + Claude Code 的完整安装流程
3. **供应商切换**：通过 CC Switch 使用 Claude、Kimi、DeepSeek 等模型
4. **实战任务**：自动下载并总结 NBER Working Paper
5. **能力边界**：Agent 能做什么、不能做什么
6. **进阶配置**：自定义指令、工具安装、工作区保存、模型切换

**下一步**：

在下一篇文章中，我们将学习如何给 Agent 接入文献库（Zotero），实现：
- 自动同步 Zotero 收藏
- 批量下载 PDF 并提取元数据
- 生成文献综述的初步框架

---

**延伸阅读：**

- CC Switch 官方文档：https://github.com/farion1231/cc-switch
- Claude Code 官方文档：https://docs.anthropic.com/en/docs/claude-code/overview
- MCP（Model Context Protocol）：https://modelcontextprotocol.io/
- Anthropic API 文档：https://docs.anthropic.com/

**工具推荐：**

- CC Switch：API 供应商切换管理工具
- Claude Code：Anthropic 官方 CLI Agent 工具
- VSCode：轻量、免费、插件丰富
- Kimi/DeepSeek：国产优秀大模型

---

*本文是 EconAgora "AI Agent 科研助手"系列的第一篇。如有问题，欢迎在 Twitter @EconAgora 讨论。*
