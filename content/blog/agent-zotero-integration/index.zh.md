---
slug: "agent-zotero-integration"
title: "给自己的 Agent 接入文献库：Zotero + MCP 实战指南"
excerpt: "通过 MCP 协议将 Zotero 文献库接入 AI Agent，实现自动检索、PDF 解析、笔记生成和文献综述框架构建的完整工作流。"
category: "AI 工具"
date: "2026-05-28"
readTime: "25 分钟"
tags:
  - "AI Agent"
  - "Zotero"
  - "MCP"
  - "文献管理"
  - "科研工具"
author: "戴伟德"
authorRole: "经济学研究者"
issue: "Volume 2605"
illustration: "generated"
cover: "/blog-covers/2026/05/agent-zotero-integration.png"
---

## 引言

在上一篇文章中，我们配置了一个基础的科研 Agent，它能够运行代码、搜索网页、读写文件。但真正的科研工作离不开文献——大量的文献。手动下载 PDF、复制标题、整理笔记，这些重复性工作占据了研究者大量时间。

本文将解决这个痛点：通过 **MCP（Model Context Protocol）协议**，将 **Zotero** 文献库接入 AI Agent，实现：
1. **自动检索**：根据关键词在 Zotero 库中查找相关文献
2. **PDF 解析**：提取 PDF 中的文本、表格、图表
3. **智能笔记**：自动生成文献摘要、批判性评价、关联分析
4. **综述框架**：基于多篇文献构建文献综述的结构化框架

**前置要求**：已完成第一篇的环境配置（VSCode + CC Switch + Claude Code + API）

## 第一部分：理解 MCP 协议

### 1.1 什么是 MCP？

MCP（Model Context Protocol）是 Anthropic 于 2024 年推出的开放协议，旨在标准化 AI 模型与外部工具/数据源之间的通信方式。

**简单类比**：
- USB 是硬件设备的通用接口
- HTTP 是网页通信的通用协议
- **MCP 是 AI 模型与外部工具通信的通用协议**

### 1.2 MCP 的核心架构

```
┌─────────────────────────────────────────┐
│              MCP 架构                   │
├─────────────────────────────────────────┤
│  Host（宿主应用）                        │
│  - VSCode / Claude Code / Claude Desktop│
├─────────────────────────────────────────┤
│  Client（客户端）                        │
│  - 管理连接、路由请求                    │
├─────────────────────────────────────────┤
│  Server（服务端）                        │
│  - Zotero Server                        │
│  - File System Server                   │
│  - GitHub Server                        │
│  - 自定义 Server...                     │
├─────────────────────────────────────────┤
│  Data Source（数据源）                   │
│  - Zotero 数据库                        │
│  - 本地文件系统                         │
│  - 远程 API                             │
└─────────────────────────────────────────┘
```

**工作流程**：
1. Agent 需要获取文献信息
2. Claude Code（Client）通过 MCP 连接到 Zotero Server
3. Zotero Server 查询本地 Zotero 数据库
4. 返回结果给 Agent，Agent 继续处理

### 1.3 为什么用 MCP 而不是直接调用 API？

| 方式 | 优点 | 缺点 |
|-----|------|------|
| **直接调用 Zotero API** | 简单直接 | 需要处理认证、格式转换、错误处理 |
| **MCP 协议** | 标准化、可复用、多工具协同 | 需要额外配置 Server |

**MCP 的优势在于**：一旦配置好 Zotero MCP Server，任何支持 MCP 的 Agent（Claude Code、Claude Desktop 等）都可以无缝使用，无需重复开发。

## 第二部分：配置 Zotero MCP Server

### 2.1 安装 Zotero

如果尚未安装，请访问 https://www.zotero.org/ 下载并安装。

**验证安装**：
1. 打开 Zotero
2. 确认可以正常添加文献（尝试拖拽一篇 PDF 到 Zotero）
3. 查看文献库路径：编辑 → 首选项 → 高级 → 文件和文件夹 → 数据存储位置

**默认路径**：
- Windows: `C:\Users\<用户名>\Zotero`
- macOS: `~/Library/Application Support/Zotero`
- Linux: `~/.zotero`

### 2.2 安装 Zotero MCP Server

目前社区有多个 Zotero MCP Server 实现，本文使用 `zotero-mcp`（Python 实现，功能完整）。

**步骤 1：克隆仓库**

```bash
# 创建一个专门的目录存放 MCP Servers
mkdir -p ~/mcp-servers
cd ~/mcp-servers

# 克隆 zotero-mcp
git clone https://github.com/konn/zotero-mcp.git
cd zotero-mcp
```

**步骤 2：安装依赖**

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安装依赖
pip install -e .
```

**步骤 3：配置 Zotero 数据库路径**

```bash
# 设置环境变量（根据你的实际路径修改）
# Windows (PowerShell):
$env:ZOTERO_DB_PATH = "$env:USERPROFILE\Zotero\zotero.sqlite"

# macOS/Linux:
export ZOTERO_DB_PATH="~/Zotero/zotero.sqlite"
```

**验证数据库路径**：
```bash
ls $ZOTERO_DB_PATH  # macOS/Linux
# 或
dir $env:ZOTERO_DB_PATH  # Windows
```

如果文件存在，说明路径正确。

### 2.3 配置 Claude Code 使用 MCP

**步骤 1：创建 MCP 配置文件**

Claude Code 使用 `claude_desktop_config.json` 或项目级的 `.mcp.json` 配置 MCP Servers。

**全局配置**（影响所有项目）：
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**项目级配置**（仅当前项目）：
在项目根目录创建 `.mcp.json` 文件。

**步骤 2：编辑配置文件**

```json
{
  "mcpServers": {
    "zotero": {
      "command": "python",
      "args": [
        "-m",
        "zotero_mcp"
      ],
      "env": {
        "ZOTERO_DB_PATH": "/Users/<你的用户名>/Zotero/zotero.sqlite"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

**注意**：
- 将 `ZOTERO_DB_PATH` 修改为你的实际路径
- `autoApprove` 为空数组表示每次调用都需要手动批准（安全推荐）

**步骤 3：重启 Claude Code**

1. 退出 Claude Code（输入 `/exit`）
2. 重新启动 `claude`
3. 输入 `/mcp` 查看已连接的 MCP Servers
4. 应该能看到 Zotero MCP Server 已连接

**通过 CC Switch 管理 MCP**（推荐）：

CC Switch 提供统一的 MCP 管理面板，支持双向同步：
1. 打开 CC Switch
2. 点击「MCP」按钮
3. 通过模板或自定义配置添加 Zotero MCP Server
4. 切换各应用同步开关（Claude Code、OpenClaw 等）
5. CC Switch 会自动将配置同步到对应工具的配置文件

### 2.4 验证 MCP 连接

在 Claude Code 中输入：

```
请使用 Zotero 工具查看我的文献库中有多少篇文献。
```

如果配置正确，Agent 会：
1. 调用 Zotero MCP Server
2. 查询数据库
3. 返回文献数量

**常见问题**：

| 问题 | 解决方法 |
|-----|---------|
| "MCP Server not found" | 检查配置文件路径是否正确 |
| "ZOTERO_DB_PATH not set" | 确认环境变量已设置，或直接在 JSON 中指定 |
| "Permission denied" | 检查 Zotero 数据库文件的读取权限 |
| "Database is locked" | 关闭 Zotero 桌面应用后再试 |
| Claude Code 未识别 MCP | 重启 Claude Code，输入 `/mcp` 检查连接状态 |

## 第三部分：实战任务——文献检索与总结

### 3.1 任务目标

让 Agent 自动完成：
1. 在 Zotero 库中搜索关于 "causal inference" 的文献
2. 选择最近 5 年的高引用论文
3. 下载/读取 PDF（如果本地有）
4. 生成每篇论文的摘要笔记
5. 构建一个文献综述的初步框架

### 3.2 编写任务提示词

在 Claude Code 中输入：

```
请帮我完成以下文献调研任务：

1. 使用 Zotero 工具搜索我的文献库，关键词："causal inference" OR "difference in differences" OR "instrumental variable"
2. 筛选条件：
   - 发表年份 >= 2020
   - 类型为 Journal Article 或 Working Paper
3. 对每篇找到的文献：
   - 获取标题、作者、年份、期刊
   - 检查本地是否有 PDF
   - 如果有 PDF，提取摘要和主要发现
   - 如果没有 PDF，记录为"待下载"
4. 生成一个 Markdown 表格，包含：
   - 标题 | 作者 | 年份 | 期刊 | 是否有 PDF | 核心发现
5. 基于这些文献，生成一个文献综述框架：
   - 研究背景与动机
   - 主要方法论进展（分小标题）
   - 实证应用案例
   - 未来研究方向
   
请将结果保存到 "literature_review_causal_inference.md"
```

### 3.3 观察 Agent 的工作过程

**第一阶段：检索**

Agent 会调用 Zotero MCP Server 的搜索功能：
```
正在搜索 Zotero 文献库...
关键词: "causal inference" OR "difference in differences" OR "instrumental variable"
筛选: 年份 >= 2020
```

**第二阶段：筛选与提取**

对每篇文献，Agent 会：
1. 获取元数据（标题、作者、年份等）
2. 检查本地存储路径是否有 PDF
3. 如果有，使用 PDF 解析工具提取内容

**第三阶段：生成报告**

Agent 会生成结构化的 Markdown 文件：

```markdown
# Causal Inference 文献调研报告

## 检索条件
- 关键词: "causal inference" OR "difference in differences" OR "instrumental variable"
- 年份: >= 2020
- 类型: Journal Article, Working Paper

## 文献列表

| 标题 | 作者 | 年份 | 期刊 | PDF | 核心发现 |
|------|------|------|------|-----|---------|
| ... | ... | ... | ... | ✅ | ... |

## 文献综述框架

### 1. 研究背景与动机
...

### 2. 主要方法论进展
#### 2.1 Difference-in-Differences 的新发展
...
#### 2.2 Instrumental Variables 的稳健性改进
...

### 3. 实证应用案例
...

### 4. 未来研究方向
...

## 待下载文献
- [ ] 作者 (年份). 标题. 期刊.
```

### 3.4 人工审查与迭代

Agent 生成的初稿需要人工审查：

1. **核对文献信息**：确认标题、作者、年份无误
2. **补充遗漏**：Agent 可能遗漏了某些相关文献
3. **修正理解**：Agent 对论文核心发现的总结可能有偏差
4. **深化分析**：在 Agent 框架基础上添加自己的批判性思考

**迭代提示词示例**：

```
请补充以下文献到综述中：
- Goodman-Bacon (2021) on DID with variation in treatment timing
- Callaway & Sant'Anna (2021) on multiple time periods DID

请重点分析这两篇论文的方法论贡献，并说明它们如何改变了传统 DID 的应用方式。
```

## 第四部分：进阶功能——PDF 深度解析

### 4.1 安装 PDF 解析工具

Zotero MCP Server 本身可以获取 PDF 路径，但需要额外的工具来解析 PDF 内容。

**推荐方案**：使用 `pymupdf`（fitz）进行 PDF 文本提取

```bash
# 在 zotero-mcp 的虚拟环境中安装
pip install pymupdf
```

### 4.2 配置 PDF 解析 MCP Server

创建一个新的 MCP Server 专门处理 PDF：

```python
# pdf_parser_mcp.py
import fitz  # pymupdf
from mcp.server import Server
from mcp.types import TextContent

app = Server("pdf-parser")

@app.tool()
def extract_pdf_text(pdf_path: str, max_pages: int = 10) -> str:
    """Extract text from a PDF file"""
    doc = fitz.open(pdf_path)
    text = []
    for i, page in enumerate(doc):
        if i >= max_pages:
            break
        text.append(page.get_text())
    doc.close()
    return "\n".join(text)

@app.tool()
def extract_pdf_metadata(pdf_path: str) -> dict:
    """Extract metadata from a PDF file"""
    doc = fitz.open(pdf_path)
    metadata = {
        "title": doc.metadata.get("title", ""),
        "author": doc.metadata.get("author", ""),
        "pages": len(doc),
    }
    doc.close()
    return metadata

if __name__ == "__main__":
    app.run()
```

### 4.3 更新 MCP 配置

在 `.mcp.json` 或 `claude_desktop_config.json` 中添加 PDF Parser：

```json
{
  "mcpServers": {
    "zotero": {
      "command": "python",
      "args": ["-m", "zotero_mcp"],
      "env": {
        "ZOTERO_DB_PATH": "/Users/<用户名>/Zotero/zotero.sqlite"
      },
      "disabled": false,
      "autoApprove": []
    },
    "pdf-parser": {
      "command": "python",
      "args": ["/path/to/pdf_parser_mcp.py"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### 4.4 深度解析任务示例

```
请帮我深度解析以下文献：

1. 使用 Zotero 找到 Goodman-Bacon (2021) 的论文
2. 获取本地 PDF 路径
3. 使用 PDF 解析工具提取：
   - 摘要
   - 引言（前3页）
   - 主要定理/命题
   - 实证应用部分
4. 生成结构化的阅读笔记：
   - 研究问题
   - 核心方法论贡献
   - 关键假设
   - 与之前方法的对比
   - 对我的研究的启示
   
保存到 "goodman_bacon_2021_notes.md"
```

## 第五部分：自动化工作流

### 5.1 创建自定义指令

在 Claude Code 设置中添加文献调研专用指令：

1. 在项目根目录创建或编辑 `CLAUDE.md` 文件
2. 添加：

```
你是一位经济学文献调研专家。在使用 Zotero 工具时：

1. 检索策略：
   - 先使用宽泛关键词，再逐步缩小范围
   - 注意同义词和不同表述（如 "DID" vs "difference-in-differences"）
   - 结合作者名进行精确检索

2. 文献筛选：
   - 优先选择顶级期刊（AER, QJE, Econometrica, JPE, ReStud）
   - 关注高引用量和近年发表
   - 保留经典文献（即使年份较早）

3. 笔记规范：
   - 使用 Markdown 格式
   - 每篇文献包含：基本信息、核心观点、方法论、对我的启发
   - 标注文献之间的关联（如 "扩展了 xxx 的方法"）

4. 综述框架：
   - 按主题或方法论组织，而非按时间顺序
   - 突出争议和未解决问题
   - 明确指出现有研究的局限性
```

### 5.2 批量处理脚本

对于大规模文献调研，可以创建批量处理脚本：

```python
# batch_literature_review.py
import json
from pathlib import Path

def create_review_batch(keywords, year_range, output_dir):
    """Create a batch of review tasks"""
    tasks = []
    for keyword in keywords:
        task = {
            "keyword": keyword,
            "year_range": year_range,
            "output_file": f"{output_dir}/{keyword.replace(' ', '_')}_review.md"
        }
        tasks.append(task)
    
    # Save tasks
    with open(f"{output_dir}/review_tasks.json", "w") as f:
        json.dump(tasks, f, indent=2)
    
    return tasks

# Example usage
keywords = [
    "causal inference",
    "synthetic control",
    "regression discontinuity",
    "instrumental variables"
]

tasks = create_review_batch(
    keywords=keywords,
    year_range=(2020, 2025),
    output_dir="./literature_reviews"
)

print(f"Created {len(tasks)} review tasks")
```

### 5.3 定期更新机制

设置定期任务，自动更新文献追踪：

```bash
# 添加到 crontab（macOS/Linux）
# 每周一早上 9 点运行
0 9 * * 1 cd ~/research && python update_literature_tracker.py
```

`update_literature_tracker.py`：
```python
#!/usr/bin/env python3
"""Weekly literature tracker update"""

import subprocess
from datetime import datetime

def main():
    # Run Claude Code to check for new papers
    prompt = """
    请检查 Zotero 库中最近一周新增的文献，
    重点关注以下主题：causal inference, DID, IV
    生成一份简报，保存到 "weekly_literature_brief.md"
    """
    
    # This would need to be adapted to your specific setup
    # For now, manual execution is recommended
    print(f"Literature tracker updated at {datetime.now()}")
    print("Please run the review task manually in Claude Code")

if __name__ == "__main__":
    main()
```

## 第六部分：常见问题与解决方案

### 6.1 性能优化

| 问题 | 原因 | 解决方案 |
|-----|------|---------|
| 检索速度慢 | 数据库大、查询复杂 | 添加索引、限制返回数量 |
| PDF 解析超时 | 文件大、页数多 | 限制解析页数、使用异步处理 |
| 内存占用高 | 同时加载多个 PDF | 流式处理、分页加载 |

### 6.2 数据安全

| 风险 | 防护措施 |
|-----|---------|
| API Key 泄露 | 使用环境变量、定期轮换 |
| 文献数据泄露 | 本地处理、不上传云端 |
| 敏感信息提取 | 配置过滤规则、人工审查 |

### 6.3 准确性保障

| 场景 | 建议 |
|-----|------|
| Agent 误解论文 | 人工核对关键结论 |
| 遗漏重要文献 | 多轮检索、使用不同关键词 |
| 引用格式错误 | 使用 Zotero 原生导出功能 |

## 总结

本文介绍了：

1. **MCP 协议**：理解 Model Context Protocol 的核心概念和架构
2. **Zotero MCP Server**：完整安装和配置流程
3. **文献检索实战**：从搜索到生成综述框架的完整工作流
4. **PDF 深度解析**：提取文本、元数据、结构化内容
5. **自动化工作流**：自定义指令、批量处理、定期更新

**关键原则**：
- MCP 让 Agent 与工具通信标准化
- Zotero + MCP = 文献库的智能化入口
- 人工审查是保障准确性的最后防线

**下一步**：

在下一篇文章中，我们将学习如何给 Agent 接入 **Stata**，实现：
- 自动编写 do-file
- 运行回归分析
- 生成结果表格和图表
- 解读统计输出

---

**延伸阅读：**

- MCP 官方文档：https://modelcontextprotocol.io/
- Zotero 文档：https://www.zotero.org/support/
- pymupdf 文档：https://pymupdf.readthedocs.io/

**工具推荐：**

- Zotero：开源文献管理工具
- zotero-mcp：社区 MCP Server 实现
- pymupdf：高性能 PDF 解析库

---

*本文是 EconAgora "AI Agent 科研助手"系列的第二篇。如有问题，欢迎在 Twitter @EconAgora 讨论。*
