---
slug: skill-based-literature-review
series: ai-research-best-practices
seriesOrder: 6
title: 基于 Claude Code Skill 的文献综述方法：从 PDF 到结构化研究资产
excerpt: 将 Claude Code Skill 作为文献综述的可复用组件：结合 Zotero 与 MCP，把经济学文献解构为标准化字段，构建可横向比较、可追溯验证的文献矩阵，并讨论其与现有综述方法论的关系。
category: AI 工具
date: '2026-07-05'
readTime: 20 分钟
tags:
  - Claude Code
  - Skill
  - 文献综述
  - Zotero
  - MCP
  - 研究设计
  - Obsidian
author: 戴伟德
authorRole: 经济学研究者
issue: EA-2026-07-004
cover: /blog-covers/2026/07/skill-based-literature-review.png
status: published
---

![AI 科研最佳实践系列横幅](/blog-covers/series-ai-research-best-practices.png)

>这是 EconAgora「AI 科研最佳实践」系列的第 6 篇。前几篇分别介绍了 [科研 Agent 的搭建](/blog/ai-agent-research-setup)、[Zotero + MCP 接入 Agent](/blog/agent-zotero-integration)、[Stata MCP 实证分析](/blog/claude-code-stata-mcp)、[Agent 记忆跨学期存活](/blog/agent-memory-for-semesters) 与 [Prompt/Skill/Tool 三层架构](/blog/prompt-skill-tool-copilot)。

很多研究者使用大语言模型做文献综述时，第一步就错位：他们要求模型直接输出“综述成稿”，却没有先把每篇论文拆成可检索、可比较、可质疑的工作单元。结果往往是一段看似流畅的文本，其中识别策略、数据口径与结论边界相互糅合，读后似乎理解了全局，实则只留下一层模糊叙事。

经济学研究真正需要的是结构。你需要回答：谁在研究什么问题，使用何种识别方法，依赖什么数据条件，结论在哪些边界下成立。这些字段不拆开，后续的设计、复现与扩展就无法开展。本文提出一种替代方案：把 Claude Code Skill 作为文献综述的**可复用工程组件**，在 Zotero 与 MCP 的基础上，将 PDF 文献解构为标准化字段，输出可直接服务于研究设计的文献矩阵。

这不是让 AI 替你写综述，而是让它替你完成最机械、最易出错的第一步：按统一 schema 提取信息。综合判断仍由研究者完成。

![文献综述工作流：从 Zotero PDF 到结构化笔记与矩阵，再到人工综合](/blog-covers/2026/07/illustrations/workflow.svg)

*图 1：工作流总览。PDF 经 Claude Code Skill 解构为标准化字段，形成单篇笔记与比较矩阵，最终由研究者完成综合与写作。*

## 1. 文献综述的方法论基础

在引入工具之前，先明确我们要做什么。Scribbr 将文献综述归纳为五步：检索文献、评估来源、识别主题与争议/缺口、拟定结构、写作[^1]。PRISMA 则进一步为系统综述规定了可复现的筛选与报告框架[^2]。

经济学实证研究的综述通常介于两者之间：它不是医学式的系统综述，也不应是随意的摘要堆砌。我们可以称之为**结构化叙述性综述**（structured narrative review）：允许研究者根据研究问题进行目的性抽样，但要求每篇文献的关键信息以统一字段呈现，并保留可追溯的证据链。

本文的方法正是服务于这一目标：用 Skill 把“评估来源”和“识别主题/争议/缺口”这两个步骤中高度重复、高度结构化的部分自动化，把研究者的时间释放给真正的综合与判断。

## 2. 工具链与前置条件

本方案依赖以下工具链：

- **Claude Code**：命令行 Agent 工具，负责解析 PDF 并执行 Skill。
- **Zotero**：文献管理与 PDF 批注中心，通过 collection/tag 组织文献，提供内置 PDF 阅读器、笔记模板与回链功能[^3][^4][^5]。
- **Zotero MCP / JavaScript API / Web API**：让 Agent 能访问 Zotero 的条目元数据与本地 PDF 路径[^6][^7]。
- **Better BibTeX**（可选但推荐）：为每篇文献生成稳定的 citation key，便于 Skill 输出与 LaTeX/Markdown 写作工具链衔接[^8]。
- **Connected Papers**（可选）：用于发现相关文献与关键节点[^15]。
- **Obsidian**（可选）：作为项目知识库，保存 Skill 输出的结构化笔记[^12]。

你需要先完成本系列前两篇的环境搭建：Claude Code 已安装并能运行，Zotero 本地客户端已启动，Zotero MCP 或本地 API 可访问。

## 3. Claude Code Skill 的核心机制

Claude Code Skill 是 Anthropic 提出的 Agent 能力扩展机制。一个 Skill 通常包含一个 `SKILL.md` 文件，以及可选的 `references/`、`templates/`、`scripts/` 子目录[^9][^10]。当 Skill 被加载时，其 frontmatter 与指令会被注入到当前会话的上下文中，模型据此执行特定任务。

与一次性长 prompt 相比，Skill 的优势在于：

- **可复用**：同一 Skill 可在多个项目中调用。
- **可版本化**：Skill 文件可以纳入 Git 管理。
- **可参数化**：通过 frontmatter 中的 `arguments` 定义输入变量。
- **可共享**：可以在团队或社区中分发。

对于文献综述，Skill 的设计原则应是：

- **提取优先于综合**：Skill 只负责按 schema 提取字段，不写综述段落。
- **结构化字段优先于叙述**：输出表格与 YAML frontmatter，而非连贯文本。
- **可追溯优先于流畅**：每个关键字段必须标注来源页码或位置。

## 4. Paper Note Schema：文献提取的标准化字段

这是整个方法的核心。我们为每篇文献定义以下字段：

| 字段 | 含义 | 经济学意义 |
|---|---|---|
| `citekey` | 稳定引用标识 | 与 Zotero / Better BibTeX 对齐 |
| `title` | 论文标题 | 元数据 |
| `authors` | 作者 | 元数据 |
| `year` | 发表年份 | 用于时间序列与演进分析 |
| `venue` | 期刊 / 工作论文来源 | 用于质量初筛 |
| `research_question` | 研究问题 | 综述的组织锚点 |
| `identification_strategy` | 识别策略（DID、IV、RD 等） | 方法比较的核心 |
| `data_source` | 数据来源与时期 | 外部效度评估 |
| `sample` | 样本范围与筛选条件 | 结论边界判断 |
| `key_findings` | 核心估计结果 | 需要具体数值与显著性 |
| `limitations` | 识别假设、数据限制、潜在偏误 | 证据强度判断 |
| `evidence_strength` | 证据强度评级（如 A/B/C） | 综合时的权重依据 |
| `page_references` | 关键字段的原文页码 | 可追溯性 |
| `zotero_link` | Zotero 本地链接 | 快速跳回原文 |
| `tags` | 主题 / 方法 / 数据类型标签 | 后续聚类与筛选 |

这些字段并非随意罗列，而是对应经济学实证研究设计的关键决策点：研究问题决定你要归入哪一类文献；识别策略决定方法可信度；数据来源与样本决定外部效度；局限性决定你能不能把该结论推广到自己的研究设定。

![Paper Note Schema：将论文解构为标准化字段](/blog-covers/2026/07/illustrations/schema.svg)

*图 2：Paper Note Schema。每篇论文被拆分为元数据、研究设计、证据与可追溯性四类字段，便于横向比较与复用。*

## 5. 编写 `literature-review` Skill

在 Claude Code 项目的 `.claude/skills/literature-review/` 目录下创建 `SKILL.md`：

```yaml
---
name: literature-review
description: |
  Extract structured paper notes from a folder of PDFs according to the
  EconAgora literature-review schema. Outputs individual notes plus a
  comparison matrix. Does NOT write prose synthesis.
arguments:
  - name: topic
    description: Research topic used to scope extraction (e.g., "minimum wage employment").
  - name: pdf_folder
    description: Path to folder containing PDFs.
  - name: output_folder
    description: Path where structured notes and matrix will be written.
---

# Literature Review Skill

## Goal

Read every PDF in `pdf_folder` and produce:

1. One per-paper note in `output_folder/notes/{citekey}.md`.
2. One comparison matrix in `output_folder/matrix.md`.

## Extraction rules

- Use the schema defined in the frontmatter of each paper note (see template).
- Fill every field if possible. If a field cannot be determined from the paper,
  write `[待确认]` and, when possible, indicate the likely location (e.g.,
  "Table 1, page 12").
- For `key_findings`, include point estimates and significance levels when
  available. Do not paraphrase away numbers.
- For `limitations`, distinguish between identification assumptions and data
  limitations.
- Rate `evidence_strength` conservatively: A = credible causal evidence with
  clear identification; B = plausible but with caveats; C = descriptive or
  preliminary.
- Every claim in `key_findings` must carry a `page_references` entry.

## Output template

Each paper note must start with:

```yaml
---
citekey: ""
title: ""
authors: ""
year: ""
venue: ""
research_question: ""
identification_strategy: ""
data_source: ""
sample: ""
key_findings: ""
limitations: ""
evidence_strength: ""
page_references: ""
zotero_link: ""
tags: []
---
```

Then include a 3-5 bullet summary under `## Summary` and, if needed, a
`## Open questions` section.

## Matrix rules

The matrix must be a Markdown table with columns:
`citekey | year | identification_strategy | data_source | sample | key_findings | evidence_strength | limitations`.
Sort rows by year, then by evidence_strength descending.

## When stuck

- If a PDF is a scanned image, stop and report: ask the user to run OCR first.
- If the paper is math-heavy and extraction is unreliable, flag the note with
  `math_extraction: unreliable`.
```

这个 Skill 的核心约束是**不自作主张写综述**。它只输出结构化数据，把判断留给研究者。

![Skill 调用与输出：输入参数、PDF 文件夹、输出笔记与矩阵](/blog-covers/2026/07/illustrations/skill-call.svg)

*图 3：Skill 调用链。输入研究主题与 PDF 文件夹，Skill 输出单篇文献笔记与可排序的比较矩阵。*

## 6. 运行示例：最低工资文献矩阵

假设你正在研究最低工资对就业的因果效应，已在 Zotero 中收集了 Card and Krueger (1994) 等论文的 PDF。运行：

```bash
/literature-review "minimum wage employment" ./papers ./output/lit-review
```

Skill 会输出 `matrix.md`，其内容可能如下（示意）：

| citekey | year | identification_strategy | data_source | sample | key_findings | evidence_strength | limitations |
|---|---|---|---|---|---|---|---|
| cardkrueger1994 | 1994 | 双重差分（DID），新泽西州最低工资上调 vs 宾夕法尼亚州对照 | 快餐店电话调查，1992 年 2-12 月 | 新泽西州与宾夕法尼亚州东部 410 家快餐店 | 最低工资提高后，新泽西州快餐业就业相对宾州无显著下降，部分规格下甚至上升 | A- | 样本为快餐业，外部效度受限；对照组选择依赖地理邻近假设 |
| neumarkwascher2000 | 2000 | DID，使用州级面板数据 | 美国 50 州及华盛顿特区，1973-1996 | 青少年劳动力市场 | 最低工资提高对青少年就业有显著负向影响 | B+ | 跨州 DID 可能受同期政策与宏观冲击干扰；模型设定敏感性较高 |
| allegrettoetal2011 | 2011 | 边界断点设计（Border discontinuity） | QCEW 与 CPS 数据，1990-2006 | 相邻州/县边界两侧 | 控制州固定效应与边界配对后，最低工资对就业的负向效应大幅减弱 | A- | 边界两侧经济同质性假设可能不成立 |

这个表格的价值在于：它不是一段关于“最低工资到底好不好”的叙事，而是把不同研究的识别策略、数据与结论边界并置，让你一眼看出分歧来自哪里——是识别策略不同，还是数据时期不同，抑或是样本行业不同。

## 7. 从矩阵到综述：人工综合的方法

![从矩阵到综述：聚类、识别冲突、追问边界、撰写带页码引用的段落](/blog-covers/2026/07/illustrations/synthesis.svg)

*图 4：从矩阵到综述。研究者先按识别策略聚类，再比较结果差异并追问边界条件，最终写出带具体页码引用的综述段落。*

有了矩阵，综述写作就变成了一项结构化的比较工作，而不是从头搜索记忆。建议按以下步骤进行：

**第一步：按主题聚类。** 例如把所有使用 DID 的研究归为一组，把使用边界断点设计的归为另一组。

**第二步：识别冲突与边界。** 比较同类方法下的结果差异，追问：数据时期是否不同？样本行业是否不同？控制变量是否有差异？

**第三步：撰写综述段落。** 使用如下模板：

> Card and Krueger (1994) 利用新泽西州 1992 年最低工资上调与宾夕法尼亚州的对照，通过双重差分发现快餐业就业未出现显著下降 [p. 784]；而 Neumark and Wascher (2000) 基于州级面板数据得出青少年就业显著负向影响的结论 [p. xx]。Allegretto et al. (2011) 进一步指出，当使用边界断点设计控制州级异质性后，负向效应明显减弱 [p. xx]。这一分歧提示，最低工资的就业效应高度依赖于识别策略与样本边界。

这种写法的关键是：每个判断都带有方法、数据与页码引用，读者可以按图索骥。

## 8. 与 Obsidian / 项目知识库的集成

单次运行的 Skill 输出只是起点。如果长期研究，应参考 claude-scholar 的 `Sources/Papers → Knowledge → Writing` 三层结构[^12]：

- `Sources/Papers/`：保存 Skill 生成的单篇文献笔记。
- `Knowledge/`：保存综合产物，如主题分类、方法比较、研究缺口图。
- `Writing/`：保存实际写入论文的综述段落与大纲。

在 Obsidian 中，你可以通过 `[[citekey]]` 链接把单篇笔记与综合笔记关联起来，形成可双向跳转的知识网络。长期积累后，文献矩阵会变成项目知识资产，支持后续研究复用。

## 9. 边界、局限与质量控制

必须明确这一方法的边界：

- **Skill 不替代判断。** 它只降低信息整理成本，综合、评估与写作仍需研究者完成。
- **PDF 质量决定提取上限。** 扫描版 PDF 需要先 OCR；公式密集的论文可能无法可靠提取；复杂表格需要人工核对。
- **每个关键字段必须可追溯。** 如果 Skill 输出的 `key_findings` 没有页码，研究者应要求它补充或自行核对。
- **避免错误的效率指标。** 衡量这一工作流的价值，不应是“节省了多少小时”，而应是**文献卡片的跨项目复用率**、**不同研究间识别策略冲突的发现率**，以及**从综述结论到可执行回归脚本的转化率**。这些是研究过程指标，不是运营指标。

## 10. 完整目录结构与 Skill 模板

建议的项目目录如下：

```text
my-project/
├── .claude/
│   └── skills/
│       └── literature-review/
│           ├── SKILL.md
│           └── references/
│               └── schema.yaml
├── papers/
│   ├── cardkrueger1994.pdf
│   ├── neumarkwascher2000.pdf
│   └── allegrettoetal2011.pdf
├── notes/
│   ├── cardkrueger1994.md
│   ├── neumarkwascher2000.md
│   └── allegrettoetal2011.md
└── matrix.md
```

`references/schema.yaml` 可以存放字段的完整定义与示例，便于在多个 Skill 或项目中复用。

## 11. 结论

文献综述的质量瓶颈通常不是信息获取，而是**提取与整合的标准化不足**。通过 Claude Code Skill，研究者可以把经济学文献解构为统一字段，构建可横向比较、可追溯验证的文献矩阵。这一方法不追求全自动写作，而是把 AI 的机械提取能力与研究者的综合判断能力分开，各司其职。

下一篇将讨论如何把这一文献矩阵进一步扩展为论文写作大纲，并继续用 Skill 管理从大纲到初稿的过程。

## 相关 Skill

- [literature-search](/skills/lingzhi227/agent-research-skills/literature-search)：系统化的学术文献检索策略与关键词扩展方法。
- [literature-review](/skills/lingzhi227/agent-research-skills/literature-review)：多视角对话式文献综述，帮助生成矩阵、批注与主题归类。
- [deep-research](/skills/lingzhi227/agent-research-skills/deep-research)：六阶段系统文献综述流程，适合需要跨库检索和严格筛选的研究。

---

## 参考与延伸阅读

[^1]: McCombes, S. (2025, January 22). *How to Write a Literature Review | Guide, Examples, & Templates*. Scribbr. https://www.scribbr.com/methodology/literature-review/
[^2]: *PRISMA Statement*. https://www.prisma-statement.org/
[^3]: *Zotero Documentation*. https://www.zotero.org/support/
[^4]: *Collections and Tags | Zotero Documentation*. https://www.zotero.org/support/collections_and_tags
[^5]: *PDF Reader and Note Editor | Zotero Documentation*. https://www.zotero.org/support/pdf_reader
[^6]: *Zotero JavaScript API*. https://www.zotero.org/support/dev/client_coding/javascript_api
[^7]: *Zotero Web API v3*. https://www.zotero.org/support/dev/web_api/v3/start
[^8]: *Better BibTeX for Zotero*. https://retorque.re/zotero-better-bibtex/
[^9]: *Claude Code Skills Documentation*. https://docs.anthropic.com/en/docs/claude-code/skills
[^10]: *Claude Code Repository*. https://github.com/anthropics/claude-code
[^12]: Galaxy-Dawn. *claude-scholar*. https://github.com/Galaxy-Dawn/claude-scholar
[^15]: *Connected Papers*. https://www.connectedpapers.com/

Card, David, and Alan B. Krueger. 1994. "Minimum Wages and Employment: A Case Study of the Fast-Food Industry in New Jersey and Pennsylvania." *American Economic Review* 84 (4): 772–793. https://www.jstor.org/stable/2118030
