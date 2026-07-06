---
slug: claude-code-stata-mcp
title: 使用 Claude Code 安装 stata-mcp 进行实证分析
excerpt: 一份面向经济学研究者的操作教程：通过 Claude Code 配置 hanlulong/stata-mcp，用自然语言驱动 Stata 完成数据清洗、回归、双重差分与图表输出，并建立可复现的实证工作流。
cover: /blog-covers/2026/05/claude-code-stata-mcp.png
category: AI 工具
date: '2026-05-16'
readTime: 18 分钟
tags:
- Claude Code
- Stata
- MCP
- 实证分析
- 计量经济学
- 双重差分法
author: 戴伟德
authorRole: 经济学研究者
issue: EA-2026-05-004
illustration: generated
series: ai-research-best-practices
seriesOrder: 3
status: published
---

![AI 科研最佳实践系列封面](/blog-covers/series-ai-research-best-practices.png)

# 使用 Claude Code 安装 stata-mcp 进行实证分析

## 引言

Stata 是经济学实证研究中最常用的统计软件之一。从数据清洗、描述性统计到回归分析、因果推断，研究者的大部分工作都发生在 Stata 的 do-file 中。但反复查阅命令文档、调试语法、输出表格与图形的流程，仍然消耗大量时间。

在前两篇文章中，我们配置了能调用工具执行任务的科研 Agent，并把 Zotero 文献库接入了工作流。本篇进入研究执行的核心环节：把 Stata 也变成 Agent 可调用的工具，通过自然语言完成实证分析。

我们将使用 **Claude Code** 与 **MCP（Model Context Protocol）协议**，配置由 `hanlulong/stata-mcp` 提供的 Stata MCP Server。配置完成后，你可以在终端中用中文或英文直接下达指令，让 Claude 自动生成并执行 Stata 命令，同时把完整代码保存为可复现的 do-file。

## 前置条件

开始之前，请确认已完成以下准备：

1. **Claude Code 已安装并可以登录运行**。安装方式见本系列第一篇文章。
2. **Stata 已安装**，版本建议为 Stata 16 或更高（Stata/BE、Stata/SE、Stata/MP 均可）。
3. **Node.js 18 或更高版本**。stata-mcp 基于 Node.js 运行，可用以下命令检查：

```bash
node --version
```

若版本不足，建议使用 [nvm](https://github.com/nvm-sh/nvm) 安装 Node.js 20：

```bash
nvm install 20
nvm use 20
```

## 什么是 stata-mcp？

`hanlulong/stata-mcp` 是一个开源的 MCP Server，它把 Stata 的命令行接口封装成 MCP 工具，使 Claude Code 等 Agent 能够通过函数调用的方式执行 Stata 命令。它的核心能力包括：

- 接收自然语言指令，转换为 Stata 命令
- 执行 do-file 或一次性命令
- 返回 Stata 的输出结果
- 保存生成的图形、表格与日志文件

对于经济学研究者，这意味着你可以把精力集中在**研究问题与识别策略**上，而把命令书写、参数调试与输出格式交给 Agent 完成。当你需要检查或修改代码时，Agent 会把完整 Stata 代码展示给你，而不是隐藏执行过程。

## 安装与配置

### 第一步：找到 Stata 可执行文件路径

不同操作系统的默认安装路径不同。请在终端中运行对应命令，确认 Stata 位置：

**macOS：**
```bash
ls /Applications/Stata/StataMP.app/Contents/MacOS/StataMP
```

**Linux（以 Stata 17 为例）：**
```bash
ls /usr/local/stata17/stata
```

**Windows：**
```powershell
ls "C:\Program Files\Stata17\StataMP-64.exe"
```

如果路径不同，请替换为实际路径。这个路径需要写进 MCP 配置文件。

### 第二步：创建 MCP 配置文件

在项目根目录创建 `.mcp.json` 文件。推荐使用 `npx -y stata-mcp` 的方式，无需全局安装：

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

**配置说明：**

- `command`：使用 `npx` 直接运行 `stata-mcp`，每次启动时自动下载或调用最新版本。
- `args`：`-y` 表示自动确认安装，`stata-mcp` 为包名。
- `STATA_PATH`：Stata 可执行文件的绝对路径，必须正确。

如果你更喜欢本地全局安装，也可以先运行：

```bash
npm install -g stata-mcp
```

然后将 `.mcp.json` 中的 `command` 改为 `stata-mcp`，`args` 留空即可。

### 第三步：启动 Claude Code 并验证连接

在项目目录中启动 Claude Code：

```bash
claude
```

启动后，Claude Code 会自动读取 `.mcp.json` 并尝试连接 stata-mcp。你可以用一条简单的自然语言指令验证连接：

```text
请加载系统示例数据 auto.dta，显示变量结构与描述性统计。
```

如果连接正常，Claude 会执行如下命令并返回结果：

```stata
sysuse auto.dta, clear
describe
summarize
```

## 场景一：数据清洗与描述性统计

我们先从最常见的实证准备步骤开始：加载数据、检查变量、处理缺失值、生成新变量并输出描述性统计。

### 示例数据

继续使用 Stata 自带的 `auto.dta` 数据集，它包含 1978 年美国汽车的价格、油耗、重量与产地等信息，适合演示基本操作。

### 自然语言指令

```text
加载 auto.dta，查看变量类型与缺失值情况。删除 rep78 缺失的观测，按 foreign 分组生成价格对数，并输出按国产/进口车分组的价格、重量、mpg 均值。
```

### Claude 生成的 Stata 代码

```stata
sysuse auto.dta, clear
describe
misstable summarize

drop if missing(rep78)
gen ln_price = ln(price)

tabulate foreign, summarize(price weight mpg) means
```

### 输出示例

```text
foreign       mean(price)  mean(weight)  mean(mpg)
Domestic       6,072.423    3,317.115      19.827
Foreign        6,384.682    2,318.500      24.773
Total          6,165.257    3,016.947      21.297
```

研究者应重点检查：

- 删除缺失值后样本量是否仍满足分析需求
- 分组均值差异是否与理论预期一致
- 是否需要对连续变量取对数或标准化

如果你希望把描述性统计输出为可插入论文的表格，可以进一步要求 Claude 使用 `estout` 或 `outreg2` 导出 LaTeX 或 Word 格式。

## 场景二：OLS 回归与稳健标准误

接下来演示回归分析。经济学论文中，基准回归通常需要报告稳健标准误，并检验控制变量对核心解释变量的影响。

### 自然语言指令

```text
以 price 为被解释变量，mpg 为核心解释变量，weight 和 foreign 为控制变量，运行 OLS 回归并报告稳健标准误。然后输出回归结果表格。
```

### Claude 生成的 Stata 代码

```stata
sysuse auto.dta, clear
regress price mpg weight i.foreign, robust
```

### 输出示例

```text
Linear regression                           Number of obs =      74
                                            F(3, 70)      =   52.25
                                            Prob > F      =  0.0000
                                            R-squared     =  0.5006
                                            Root MSE      =  2412.5

------------------------------------------------------------------------------
             |               Robust
       price | Coefficient  std. err.      t    P>|t|     [95% conf. interval]
-------------+----------------------------------------------------------------
         mpg |  -49.51222   86.15604    -0.57   0.567    -221.3025     122.278
      weight |   1.746559   .6413538     2.72   0.008      .467736    3.025382
             |
     foreign |
    Foreign  |    3573.09   639.3489     5.59   0.000     2298.145    4848.035
       _cons |   1946.069    3597.05     0.54   0.590    -5226.245    9118.382
------------------------------------------------------------------------------
```

### 结果解读要点

- `weight` 的系数约为 1.75，在 1% 水平上显著，说明汽车重量每增加一个单位，价格平均上涨约 1.75 美元。
- `mpg` 的系数不显著，说明在控制重量与产地后，油耗对价格没有额外解释力。
- `foreign = Foreign` 的系数显著为正，说明进口车价格显著高于国产车。

你可以让 Claude 继续生成异方差稳健性检验、VIF 多重共线性诊断，或者尝试加入交互项检验调节效应。

### 导出回归表格

```text
把刚才的回归结果导出为 LaTeX 表格，保存到 results/table1.tex。
```

Claude 会调用 `estout` 包完成导出：

```stata
ssc install estout, replace
eststo clear
eststo: regress price mpg weight i.foreign, robust
esttab using "results/table1.tex", replace ///
    star(* 0.1 ** 0.05 *** 0.01) ///
    b(%9.3f) se(%9.3f) ///
    r2 ar2 N ///
    title("基准回归结果")
```

> 提示：如果尚未安装 `estout`，Claude 通常会先执行 `ssc install`，研究者应确认安装来源可信。

## 场景三：双重差分法（DID）

双重差分法（DID）是经济学中评估政策效应的常用方法。本节演示如何用自然语言构造处理组、定义政策时点并估计 DID 系数，同时讨论识别假设。

### 模拟设定

由于 `auto.dta` 不是面板数据，我们构造一个模拟面板结构：

- 处理组：`foreign == 1`（进口车）
- 对照组：`foreign == 0`（国产车）
- 政策前：`year == 1977`
- 政策后：`year == 1978`

### 自然语言指令

```text
用 auto.dta 构造一个两期面板：前 37 个观测为 1977 年，后 37 个为 1978 年。处理组为 foreign==1。估计 DID 模型，report 稳健标准误，并讨论平行趋势假设。
```

### Claude 生成的 Stata 代码

```stata
sysuse auto.dta, clear

* 构造两期面板
gen year = 1977 if _n <= 37
replace year = 1978 if _n > 37

gen treated = (foreign == 1)
gen post = (year == 1978)
gen did = treated * post

* 基础 DID 回归
regress price did treated post, robust
```

### 输出示例

```text
Linear regression                           Number of obs =      74
                                            F(3, 70)      =   13.64
                                            Prob > F      =  0.0000
                                            R-squared     =  0.1847
                                            Root MSE      =  3224.4

------------------------------------------------------------------------------
             |               Robust
       price | Coefficient  std. err.      t    P>|t|     [95% conf. interval]
-------------+----------------------------------------------------------------
         did |   1773.918   1026.824     1.73   0.089    -274.5368    3822.373
     treated |   2014.405   866.6589     2.32   0.023     286.4489    3742.361
        post |   758.3333   749.5596     1.01   0.315    -736.5966    2253.263
       _cons |   4937.083   551.9243     8.95   0.000     3836.521    6037.646
------------------------------------------------------------------------------
```

### 识别假设讨论

DID 的识别依赖于**平行趋势假设**：如果没有政策冲击，处理组与对照组的结果变量应随时间以相似趋势变化。由于本例中的年份是人为构造的，严格意义上不能声称满足平行趋势。实际研究中，研究者需要：

1. 使用政策前多期数据绘制事件研究图，检查处理前系数是否接近零且不显著。
2. 排除其他同期冲击，例如与政策同时发生的其他市场变化。
3. 考虑处理组与对照组的构成差异，必要时加入协变量进行回归调整。

可以让 Claude 继续生成事件研究法代码：

```text
如果有多期数据，请用事件研究法估计 DID，以政策前一期为基期，report 90% 置信区间。
```

```stata
* 事件研究法示意（需要多期面板数据）
forvalues t = -4/4 {
    if `t' != -1 {
        gen lead_lag`t' = (relative_year == `t')
    }
}
reghdfe y lead_lag* x1 x2, absorb(id year) vce(cluster id)
coefplot, keep(lead_lag*) vertical yline(0) xline(-1) ///
    ciopts(recast(rcap)) title("事件研究：平行趋势检验")
graph export results/event_study.png, replace
```

> 注意：真实 DID 分析应参考 Card & Krueger (1994)、Goodman-Bacon (2021) 与 Callaway & Sant'Anna (2021) 等方法论文献，不能仅依赖代码生成。

## 场景四：图表生成

经济学论文中的图表需要清晰的标题、坐标轴标签与可导出的格式。下面演示如何用自然语言生成散点图、拟合线与分组对比图。

### 自然语言指令

```text
绘制 price 与 weight 的散点图，并加上线性拟合线。标题为"汽车价格与重量的关系"，保存为 results/price_weight.png。
```

### Claude 生成的 Stata 代码

```stata
sysuse auto.dta, clear

scatter price weight || lfit price weight, ///
    title("汽车价格与重量的关系") ///
    xtitle("重量 (lbs)") ///
    ytitle("价格 (USD)") ///
    legend(label(1 "观测值") label(2 "线性拟合") rows(1) position(6))

graph export results/price_weight.png, replace width(1200)
```

### 分组对比图

```text
按国产/进口车分组，绘制 mpg 与 price 的散点图，保存为 results/mpg_price_by_origin.png。
```

```stata
sysuse auto.dta, clear

scatter price mpg, by(foreign, title("油耗与价格的分组关系")) ///
    xtitle("每加仑英里数 (mpg)") ///
    ytitle("价格 (USD)")

graph export results/mpg_price_by_origin.png, replace width(1200)
```

### 结果管理建议

建议为每个项目建立固定目录结构：

```
project/
├── data/
├── do_files/
├── results/
│   ├── tables/
│   └── figures/
└── logs/
```

让 Claude 在执行分析时把 do-file、图表与表格统一保存到对应目录，便于复现与版本控制。

## 可复现性工作流

AI 辅助分析的最大风险，是执行过程隐藏在对话中而无法复现。建议采用以下做法：

1. **要求 Claude 把完整 Stata 代码写入 do-file**

```text
把上述分析整理成一个完整的 do-file，保存为 do_files/main_analysis.do，包含数据加载、清洗、回归、DID 与图表输出。
```

2. **使用 Git 记录分析版本**

```bash
git add do_files/main_analysis.do results/
git commit -m "添加基准回归、DID 与图表"
```

3. **保留日志文件**

```stata
capture mkdir logs
cmdlog using "logs/analysis_log.txt", replace
```

4. **人工复核关键输出**

Agent 可能生成语法正确但经济学意义不合理的命令。研究者应重点复核：样本量、系数符号与显著性、变量生成逻辑、识别假设是否成立。

## 常见问题排查

### 问题一：stata-mcp 找不到 Stata

**现象**：Claude 报告 `STATA_PATH` 错误或 Stata 启动失败。

**解决步骤**：

```bash
# Linux/macOS 查找 Stata 路径
which stata
find / -name "stata*" -type f 2>/dev/null
```

确认路径后，更新 `.mcp.json` 中的 `STATA_PATH` 环境变量，并重启 Claude Code。

### 问题二：Claude Code 无法连接 MCP Server

**现象**：输入指令后 Claude 没有调用 Stata 工具。

**解决步骤**：

1. 检查 `.mcp.json` 的 JSON 语法是否有效。
2. 确认 `npx` 可以正常运行：

```bash
npx -y stata-mcp --version
```

3. 重启 Claude Code：

```bash
claude --restart
```

### 问题三：Stata 命令执行超时

**现象**：大数据集或复杂回归导致命令长时间无响应。

**解决**：在 `.mcp.json` 中增加超时时间（单位：毫秒）：

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

通过 Claude Code 与 `hanlulong/stata-mcp`，经济学研究者可以把 Stata 变成 Agent 可调用的工具，用自然语言驱动数据清洗、回归分析、双重差分与图表输出。这种工作流的价值不在于取代研究者对模型与识别策略的判断，而在于：

1. **减少重复劳动**：自动生成命令、表格与图形
2. **降低记忆负担**：无需背诵命令语法与选项
3. **提高可复现性**：完整代码自动保存为 do-file
4. **加速探索性分析**：快速尝试不同模型设定与稳健性检验

建议从简单的描述性统计与 OLS 回归开始，逐步尝试 DID、IV、RDD 等更复杂的计量方法。无论分析多么复杂，研究者始终需要亲自检查识别假设、系数含义与输出结果。

## 参考资源

- [Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code/overview)
- [Model Context Protocol 官方文档](https://modelcontextprotocol.io/introduction)
- [hanlulong/stata-mcp GitHub 仓库](https://github.com/hanlulong/stata-mcp)
- [Stata 官方文档](https://www.stata.com/features/documentation/)
- Angrist, J. D., & Pischke, J. S. (2009). *Mostly Harmless Econometrics*. Princeton University Press.

## 相关 Skill

- [`/skills/dylantmoore/stata-skill/stata`](https://github.com/dylantmoore/stata-skill)：Stata 数据分析 Skill，包含常用命令模板与可复用分析片段，适合在 Claude Code 中加载后辅助实证研究。
- [`/skills/lingzhi227/agent-research-skills/data-analysis`](https://github.com/lingzhi227/agent-research-skills/tree/main/data-analysis)：Agent 研究数据清洗、探索性分析与可视化 Skill，可与 Stata MCP 配合使用，规范数据处理流程。
