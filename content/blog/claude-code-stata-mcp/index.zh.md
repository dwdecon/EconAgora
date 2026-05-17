---
slug: "claude-code-stata-mcp"
title: "使用 Claude Code 安装 stata-mcp 进行实证分析"
excerpt: "本文详细介绍如何通过 Claude Code 安装和配置 stata-mcp MCP server，实现 AI 辅助的 Stata 实证分析工作流，提升经济学研究效率。"
cover: "/blog-covers/2026/05/claude-code-stata-mcp.png"
category: "AI 工具"
date: "2026-05-16"
readTime: "12 分钟"
tags:
  - "Claude Code"
  - "Stata"
  - "MCP"
  - "实证分析"
  - "计量经济学"
author: "戴伟德"
authorRole: "经济学研究者"
issue: "Volume 2605"
illustration: "generated"
---

# 使用 Claude Code 安装 stata-mcp 进行实证分析

## 引言

在经济学研究中，Stata 是最常用的计量分析软件之一。然而，传统的 Stata 工作流需要研究者手动编写 do-file、查阅文档、调试代码。随着 AI 技术的发展，我们可以通过 **Model Context Protocol (MCP)** 将 Claude Code 与 Stata 连接，实现 AI 辅助的实证分析工作流。

本文将详细介绍如何：
1. 理解 MCP 协议及其在经济学研究中的应用
2. 在 Claude Code 中安装和配置 stata-mcp
3. 使用 AI 辅助完成数据清洗、回归分析、结果输出

## 什么是 MCP？

**Model Context Protocol (MCP)** 是 Anthropic 推出的开源标准协议，用于连接 AI 应用与外部系统。类比来说，MCP 就像 AI 应用的 USB-C 接口——提供标准化的方式让 AI 连接数据源、工具和工作流。

对于经济学研究者，MCP 意味着：
- **直接操作 Stata**：通过自然语言指令让 AI 执行 Stata 命令
- **自动化分析**：AI 可以读取数据、运行回归、生成图表
- **智能文档**：自动查阅 Stata 文档，获取命令用法和公式

## 准备工作

### 1. 安装 Claude Code

Claude Code 是 Anthropic 推出的命令行 AI 编程工具。安装方法：

```bash
# macOS
brew install claude-code

# 或使用 npm
npm install -g @anthropic/claude-code
```

### 2. 确认 Stata 安装

确保你的系统已安装 Stata（Stata/BE、Stata/SE 或 Stata/MP 均可），并且 `stata` 命令可在终端中调用。

```bash
# 测试 Stata 是否可用
stata --version
```

### 3. 安装 Node.js

stata-mcp 需要 Node.js 环境：

```bash
# 检查 Node.js 版本
node --version  # 需要 v18 或更高

# 安装 nvm（如未安装）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装 Node.js v20
nvm install 20
nvm use 20
```

## 安装 stata-mcp

### 方法一：通过 Claude Code 直接安装

Claude Code 支持通过 MCP 配置文件直接添加本地或远程 MCP server。

#### 1. 创建 MCP 配置文件

在项目根目录创建 `.mcp.json` 文件：

```json
{
  "mcpServers": {
    "stata": {
      "command": "npx",
      "args": ["-y", "stata-mcp"],
      "env": {
        "STATA_PATH": "/usr/local/stata17/stata"
      }
    }
  }
}
```

**配置说明**：
- `command`: 使用 `npx` 直接运行 stata-mcp（无需全局安装）
- `STATA_PATH`: 你的 Stata 可执行文件路径
  - macOS: `/Applications/Stata/StataMP.app/Contents/MacOS/StataMP`
  - Linux: `/usr/local/stata17/stata`
  - Windows: `C:\Program Files\Stata17\StataMP-64.exe`

#### 2. 启动 Claude Code 并连接 MCP

```bash
# 在项目目录中启动 Claude Code
claude

# Claude Code 会自动读取 .mcp.json 并连接 stata-mcp
```

### 方法二：手动安装 stata-mcp

如果方法一不适用，可以手动安装：

```bash
# 全局安装 stata-mcp
npm install -g stata-mcp

# 验证安装
stata-mcp --version
```

然后在 `.mcp.json` 中配置：

```json
{
  "mcpServers": {
    "stata": {
      "command": "stata-mcp",
      "args": [],
      "env": {
        "STATA_PATH": "/usr/local/stata17/stata"
      }
    }
  }
}
```

## 使用 Claude Code + Stata 进行实证分析

### 场景一：数据清洗与描述性统计

启动 Claude Code 后，你可以直接用自然语言与 Stata 交互：

**研究者**：加载 auto.dta 数据集，显示描述性统计

**Claude Code**（通过 stata-mcp 执行）：
```stata
sysuse auto.dta, clear
describe
summarize
```

**输出结果**：
```
Variable      Obs        Mean    Std. dev.       Min        Max
────────────────────────────────────────────────────────────────
make           74
price          74    6165.257    2949.496       3291      15906
mpg            74     21.2973    5.785503         12         41
rep78          69    3.405797    .9899323          1          5
...
```

### 场景二：回归分析

**研究者**：运行 price 对 mpg 和 weight 的 OLS 回归，并输出稳健标准误

**Claude Code**：
```stata
regress price mpg weight, robust
```

**结果解读**：
```
Linear regression                           Number of obs =      74
                                            F(2, 71)      =   35.58
                                            Prob > F      =  0.0000
                                            R-squared     =  0.5000
                                            Root MSE      =  2416.7

──────────────────────────────────────────────────────────────────────
             |               Robust
       price | Coefficient  std. err.      t    P>|t|     [95% conf. interval]
─────────────┼────────────────────────────────────────────────────────
         mpg |  -49.51222   86.15604    -0.57   0.567    -221.3025     122.278
      weight |   1.746559   .6413538     2.72   0.008      .467736    3.025382
       _cons |   1946.069    3597.05     0.54   0.590    -5226.245    9118.382
──────────────────────────────────────────────────────────────────────
```

**Claude Code 自动解读**：
> weight 的系数为 1.75，且在 1% 水平上显著（p=0.008），说明汽车重量每增加 1 单位，价格平均上涨约 1.75 美元。mpg 的系数不显著（p=0.567），说明在控制重量后，油耗对价格的影响不显著。

### 场景三：高级计量分析

**研究者**：使用 DID 方法评估政策效应，处理组为 foreign==1，政策实施年份为 1978

**Claude Code**：
```stata
* 生成年份变量（模拟面板数据）
gen year = 1978 if _n <= 37
replace year = 1977 if _n > 37

* 生成处理变量
gen treated = (foreign == 1)
gen post = (year == 1978)
gen did = treated * post

* DID 回归
regress price did treated post, robust
```

**Claude Code 自动输出**：
- 回归结果表格
- DID 识别假设讨论
- 稳健性检验建议

### 场景四：自动化图表生成

**研究者**：绘制 price 与 weight 的散点图，并添加回归线

**Claude Code**：
```stata
scatter price weight || lfit price weight, ///
    title("汽车价格与重量关系") ///
    xtitle("重量 (lbs)") ///
    ytitle("价格 (USD)") ///
    legend(off)
graph export price_weight.png, replace
```

## 工作流优化建议

### 1. 使用 Claude Code 的 Memory 功能

Claude Code 支持记忆功能，可以保存常用的 Stata 分析模板：

```
/memory save stata-template "标准实证分析流程：
1. 数据清洗（缺失值、异常值处理）
2. 描述性统计
3. 相关性分析
4. 基准回归
5. 稳健性检验
6. 异质性分析"
```

### 2. 批量分析

对于多个数据集的重复分析，可以编写 Claude Code 指令：

```
对 data/ 目录下的所有 .dta 文件执行：
1. 加载数据
2. 运行 summarize
3. 运行回归 y ~ x1 + x2 + controls
4. 输出结果到 results/ 目录
```

### 3. 与版本控制集成

Claude Code 原生支持 Git，可以自动管理分析代码版本：

```bash
# Claude Code 会自动跟踪 do-file 的修改
git add analysis.do
git commit -m "添加 DID 分析"
```

## 常见问题排查

### Q1: stata-mcp 无法找到 Stata

**解决方案**：
```bash
# 查找 Stata 安装路径
which stata
# 或
find / -name "stata*" -type f 2>/dev/null

# 在 .mcp.json 中更新 STATA_PATH
```

### Q2: Claude Code 无法连接 MCP server

**解决方案**：
```bash
# 检查 .mcp.json 语法
npx jsonlint .mcp.json

# 重启 Claude Code
claude --restart
```

### Q3: Stata 命令执行超时

**解决方案**：在 `.mcp.json` 中增加超时设置：
```json
{
  "mcpServers": {
    "stata": {
      "command": "npx",
      "args": ["-y", "stata-mcp"],
      "env": {
        "STATA_PATH": "/usr/local/stata17/stata",
        "TIMEOUT": "300000"
      }
    }
  }
}
```

## 总结

通过 Claude Code + stata-mcp，经济学研究者可以：

1. **降低技术门槛**：用自然语言替代复杂的 Stata 命令
2. **提升效率**：AI 自动完成代码编写、结果解读、文档生成
3. **保证可复现性**：所有分析步骤自动记录为 do-file
4. **集成现代工作流**：与 Git、VS Code、云端存储无缝衔接

这种 AI 辅助的实证分析模式，代表了经济学研究方法的未来方向。建议研究者从简单的描述性统计开始，逐步探索更复杂的计量分析场景。

## 参考资源

- [Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code/overview)
- [MCP 协议介绍](https://modelcontextprotocol.io/introduction)
- [Stata 官方文档](https://www.stata.com/features/documentation/)
- [stata-mcp GitHub 仓库](https://github.com/mchen006/stata-mcp)
