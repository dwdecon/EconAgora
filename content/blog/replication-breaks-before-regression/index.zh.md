---
slug: replication-breaks-before-regression
title: 为什么复现往往死在回归之前
excerpt: 真正拖垮复现项目的通常不是估计量，而是文件命名、变量字典、版本漂移和路径管理这些回归之前的工程细节。
category: 复现工程
date: '2026-03-19'
readTime: 10 分钟
tags:
- 论文复现
- 数据治理
- 工程规范
- 版本控制
- 可复现研究
author: EconAgora Methods Desk
authorRole: 复现方法编辑
issue: EA-2026-03-003
cover: /blog-covers/2026/05/replication-breaks-before-regression.png
series: paper-projects
seriesOrder: 4
status: published
---

研究者通常会把注意力集中在回归表能不能跑出来，但复现项目最常见的失败点，发生在估计量出现之前。一份脚本今天能跑，不代表三个月后还能跑；原始数据看起来很完整，不代表变量字典能把每个字段解释清楚；目录结构在本地合理，不代表换一台机器就能复现。真正拖垮复现项目的，往往不是估计量本身，而是文件命名、变量字典、版本漂移和路径管理这些被低估的工程细节。

Gentzkow 与 Shapiro 的 *Code and Data for the Social Sciences: A Practitioner’s Guide* 是经济学复现工程的经典指南，强调文件组织、版本控制、自动化与文档化[^1]。美国经济学协会（AEA）期刊的数据与代码可及性政策，说明了顶级期刊对复现材料的最低要求[^2]。Gary King 的 *Replication, Replication* 则从政治学方法论角度，阐述了复现的标准、意义与常见失败原因[^3]。Dataverse 作为社会科学数据仓储平台，提供了长期保存、版本管理与 DOI 引用机制[^4]。

本文把这些经验浓缩成一套可在项目启动时就落地的复现治理规则。

## 1. 回归不是最常见的失败点

复现失败通常被想象成“回归系数跑不出来”或“结果与原论文不一致”。但更多时候，失败发生在更早的阶段：

- 找不到主脚本，或不知道哪条脚本才是入口；
- 路径写死，换一台机器所有相对路径都失效；
- 中间文件命名混乱，无法判断哪些是生成、哪些是手动编辑；
- 变量字典缺失，复现者必须反向猜测每个变量的生成逻辑；
- 依赖版本未记录，软件升级后代码 silently 报错或结果改变。

这些问题不会在论文审稿时暴露，却会在三个月后、换一个环境时集中爆发。

## 2. 路径与版本漂移是最隐蔽的风险

路径漂移和版本漂移是复现失败中最难排查的两类问题。

**路径漂移**：脚本中硬编码了 `C:/Users/作者名字/data/` 或 `/Users/作者名字/project/`。原作者的电脑能跑，任何其他人的电脑都跑不了。

**版本漂移**：R 包、Python 库或 Stata  ado 文件在几个月内更新，函数默认行为改变。没有记录版本，复现者很难判断结果差异来自代码还是环境。

规避方法：

```python
# 推荐：使用相对路径与项目根目录变量
from pathlib import Path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data" / "raw"
OUTPUT_DIR = PROJECT_ROOT / "outputs"
```

```r
# 推荐：R 中使用 here 包
library(here)
data_dir <- here("data", "raw")
output_dir <- here("outputs")
```

版本控制则依赖 `requirements.txt`、`renv.lock`、Stata 的 `ado` 清单，或 Docker 镜像。

## 3. 把复现仓库视为产品，而不是附件

一个合格的复现仓库必须解释输入、处理过程和输出之间的关系。核心文档包括：

- **README**：告诉别人从哪里开始，运行顺序是什么，预期输出在哪里。
- **数据字典**：说明每个变量如何生成、取值含义、缺失值处理。
- **依赖列表**：软件版本、包版本、系统环境。
- **运行入口**：一条命令或一个主脚本能跑完整个流程。
- **中间产物说明**：哪些文件可以删除重建，哪些是手动编辑的，必须保留。

建议目录结构：

```text
replication-package/
├── README.md
├── requirements.txt          # 或 renv.lock, environment.yml
├── run_all.py / run_all.do / run_all.R
├── scripts/
│   ├── 01_clean_data.py
│   ├── 02_construct_vars.py
│   ├── 03_analysis.py
│   └── 04_tables_figures.py
├── data/
│   ├── raw/                  # 原始数据，只读
│   ├── intermediate/         # 中间产物，可重建
│   └── final/                # 清洗后数据，可重建
├── outputs/
│   ├── tables/
│   └── figures/
└── docs/
    └── data_dictionary.md
```

## 4. 三条硬规则

无论项目大小，建议坚守三条规则：

1. **原始数据永远只读**。任何清洗或转换都写入新的文件，保留原始数据不变。这样即使后续发现错误，也能从起点重新跑。
2. **每个脚本只承担单一阶段责任**。不要把数据清洗、变量构造、回归、出表全部塞进一个文件。阶段清晰，才容易定位错误。
3. **任何手动操作都要写回文档**。如果你用 Excel 手工调整过某个变量，或用命令行运行过某条一次性命令，必须记录步骤、原因和结果文件。手动操作是复现黑洞的主要来源。

## 5. 让 AI 协助复现，但不接管判断

LLM 很适合做复现中的机械性工作：

- 整理运行日志，定位报错位置；
- 生成目录树，检查文件是否齐全；
- 根据代码自动生成变量说明；
- 把 README 模板填入项目实际信息。

但 AI 不应替你决定以下问题：

- 两个看似相近的数据版本是否可互换；
- 某个缺失值处理是否合理；
- 某个关键边界是否成立；
- 复现结果与原论文的差异是否可接受。

这些判断需要领域知识和研究责任，不能外包给模型。

## 6. 最小可复现仓库检查表

项目启动时或提交前，建议逐项核对：

- [ ] 目录结构清晰，README 说明入口；
- [ ] 依赖列表完整，版本可锁定；
- [ ] 数据字典覆盖核心变量；
- [ ] 原始数据只读，中间产物可重建；
- [ ] 运行入口能一键跑通（至少在同一环境）；
- [ ] 输出文件有校验或哈希；
- [ ] Git 版本标签已打（release）；
- [ ] 所有手动操作已记录。

## 7. 常见错误

- **把 README 当成装饰**：README 必须回答“从哪开始跑”。
- **依赖只写包名不写版本**：三个月后环境变化，复现者无从下手。
- **中间产物与源代码混放**：导致无法判断哪些文件可删除重建。
- **过度依赖 AI 判断数据等价性**：数据版本差异可能改变结论。

## 8. 下一步

复现治理是研究资产化的基础。但要把复现结果长期保存、共享和引用，还需要把研究数据与代码发布到可信仓储，并建立 DOI 与版本管理习惯。下一篇将讨论如何发布可复现研究包。

---

## 参考与延伸阅读

[^1]: Gentzkow, M., & Shapiro, J. M. *Code and Data for the Social Sciences: A Practitioner’s Guide*. https://web.stanford.edu/~gentzkow/research/CodeAndData.pdf
[^2]: American Economic Association. *Data and Code Availability Policy*. https://www.aeaweb.org/journals/policies/data-code
[^3]: King, G. *Replication, Replication*. https://gking.harvard.edu/replication
[^4]: Dataverse Project. https://dataverse.org/
