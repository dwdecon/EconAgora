---
slug: from-pdf-to-panel
title: 从 PDF 到 Panel：经济学文献综述的四代理工作流
excerpt: 把文献综述当成流水线：先用 Reader 把论文拆成标准字段，再用 Mapper/Skeptic/Synthesizer 接力，最后输出的是可索引、可质疑、可转成回归脚本的 panel。
category: 研究工作流
date: '2026-03-28'
readTime: 12 分钟
tags:
- 文献综述
- 多代理
- 工作流设计
- 证据卡片
- 复现工程
author: EconAgora Editorial Desk
authorRole: 研究流程编辑
issue: EA-2026-03-002
cover: /blog-covers/2026/05/from-pdf-to-panel.png
series: paper-projects
seriesOrder: 3
status: published
---

很多研究者使用大语言模型做文献综述时，第一步就错位：他们要求模型直接输出“综述成稿”，却没有先把每篇论文拆成可检索、可比较、可质疑的工作单元。结果往往是一段看似流畅的文本，其中识别策略、数据口径与结论边界相互糅合，读后似乎理解了全局，实则只留下一层模糊叙事。

经济学研究真正需要的是结构。你需要回答：谁在研究什么问题，使用何种识别方法，依赖什么数据条件，结论在哪些边界下成立。这些字段不拆开，后续的设计、复现与扩展就无法开展。PRISMA 2020 为系统综述规定了可重复检索、筛选流程与结构化数据提取的框架[^1]；Connected Papers 则通过共引图展示“论文之间的关系”比“单篇摘要”更有助于综述[^2]。Elicit 与 Semantic Scholar 进一步说明，把论文拆成关键信息字段，是加速系统性综述的基础[^3][^4]。

本文提出一种替代方案：用 Reader、Mapper、Skeptic、Synthesizer 四个代理把文献综述变成一条流水线，输出的是可索引、可质疑、可转成回归脚本的 panel。

## 1. 为什么大多数综述在第一轮就失真

一段对话式总结往往会把论文的识别假设、样本口径和数据限制揉在一起。你读起来像是获得了全局理解，实际上只是得到了一层模糊叙事。具体表现为：

- 识别策略被一句话带过，无法与其他研究比较；
- 样本范围和数据来源混在一起，难以判断外部效度；
- 稳健性检验结论没有被单独记录；
- 不同论文之间的矛盾被“综合”成平均意见，而不是被结构化呈现。

失真的根源，是把“提取信息”和“综合判断”交给了同一个黑箱步骤。

## 2. 标准化拆解：把 PDF 变成证据卡片

第一步不是写综述，而是把每篇论文拆成标准化字段。我们建议的必填字段包括：

| 字段 | 含义 |
|---|---|
| `claim` | 核心因果主张 |
| `data` | 数据来源与时期 |
| `method` | 识别策略（DID、IV、RD 等） |
| `sample` | 样本范围与筛选条件 |
| `limitation` | 识别假设、数据限制、潜在偏误 |

可选字段包括：处理变量操作化方式、稳健性检验清单、政策背景、可复现性评级、页码引用。

一张证据卡片就是一行 panel 数据。例如：

```yaml
---
citekey: cardkrueger1994
claim: 新泽西州 1992 年最低工资提高未导致快餐业就业显著下降
data: 快餐店电话调查，1992 年 2-12 月
method: 双重差分（DID），新泽西 vs 宾夕法尼亚东部
sample: 新泽西州与宾夕法尼亚州东部 410 家快餐店
limitation: 样本局限于快餐业；对照组可比性依赖地理邻近假设
page_references: "Table 3, p. 784"
evidence_strength: A-
---
```

Reader 代理的唯一职责，就是按这个 schema 提取与校验字段，不做评价。如果某字段无法从论文中确认，应标注“待确认”并给出可能位置。

## 3. 四层代理接力

### 3.1 Reader：只做提取

Reader 读取 PDF，输出标准化证据卡片。它的关键约束是：不综合、不评价、不省略数字。若论文中有关键估计值，必须保留点估计与显著性。

### 3.2 Mapper：建立跨论文对照表

Mapper 把多张证据卡片按主题、方法、数据、时期等维度挂到同一个索引里，输出对照表。它的价值在于发现冲突与空白：

- 同一方法在不同数据时期是否得出不同结论？
- 同一主题是否被某种识别方法主导？
- 哪些数据限制在多篇论文中反复出现？

### 3.3 Skeptic：专门寻找证据链断点

Skeptic 只回答一个问题：这条结论在哪一步最脆弱？它要求每条识别策略都给出最弱前提和失败情境，并把质疑写回对应卡片的 `limitation` 字段。

### 3.4 Synthesizer：基于前三层输出成稿

Synthesizer 的任务是写综述段落。由于它只能基于 Reader、Mapper、Skeptic 的输出工作，成稿天然带证据索引。每个判断都可以回链到具体论文、具体字段、具体页码。

```python
# 伪代码示意
pipeline = {
    "reader": extract_cards(pdfs, schema),
    "mapper": build_matrix(cards, dimensions=["topic", "method", "data"]),
    "skeptic": audit_cards(cards, questions=audit_questions),
    "synthesizer": draft_review(audited_cards, output_format="markdown")
}
```

## 4. 应该追踪的三个过程指标

不要只看“节省了多少小时”。更关键的是：

- **文献卡片复用率**：同一张卡片是否在多个分析中被调用；
- **识别策略冲突发现率**：Mapper 是否发现了同一主题下不同方法结论的冲突；
- **从综述到回归脚本的转化率**：整理后的 panel 是否直接生成了假设清单、变量定义或识别策略对比表。

这些指标衡量的是综述是否真正变成了研究资产，而不是一次性写作任务。

## 5. 从 Panel 到可复现研究设计

整理出的 panel 可以直接服务于后续研究：

- 生成假设清单：哪些因果主张尚未被充分检验？
- 生成变量定义表：不同研究如何操作化同一变量？
- 生成识别策略对比表：同一问题在不同识别下的结论差异。

例如，最低工资就业的 panel 可能显示：使用州级面板的研究倾向于发现负向效应，而使用边界县设计的研究则发现效应减弱或消失。这个发现不是综述的“结论”，而是下一步研究设计的起点。

## 6. 落地工具链建议

一条最小可行的工具链：

```text
PDF 解析（GROBID / Marker）
  ↓
字段抽取（LLM + schema 校验）
  ↓
结构化存储（SQLite / DuckDB）
  ↓
对照与可视化（Obsidian / Streamlit）
  ↓
导出为回归设计资产（Markdown / CSV / YAML）
```

工具链不需要一次配齐。先保证 PDF 能稳定拆成卡片，再逐步加入 Mapper 和 Skeptic。

## 7. 常见陷阱

- **让 Synthesizer 跳过前三层直接写综述**：会重新引入模糊叙事。
- **字段设计过细**：导致 Reader 填充率过低，反而失去结构化价值。
- **忽视页码引用**：没有回链的证据卡片无法被验证。
- **把“复用率”当成运营指标**：它衡量的是研究过程质量，不是产出数量。

## 8. 下一步

四代理工作流解决的是“如何把文献综述变成可复用资产”的问题。但在进入回归之前，还有一个更隐蔽的失败点：复现仓库的工程细节。下一篇将讨论为什么复现往往死在回归之前。

---

## 参考与延伸阅读

[^1]: PRISMA. *PRISMA 2020 Statement*. https://prisma-statement.org/prisma-2020/
[^2]: Connected Papers. *About*. https://www.connectedpapers.com/about
[^3]: Elicit. *About*. https://elicit.com/about
[^4]: Semantic Scholar. *About*. https://www.semanticscholar.org/about
