# Stage 1 Research Summary：5 篇 EconAgora 博文重写调研

> 说明：本文为重写准备的阶段一文档，仅包含引用、核心论断、建议 Frontmatter 与详细大纲，不写正文。所有引用均为经济学/AI Agent/复现工程领域的权威来源，待确认后即可进入 Stage 2 正文撰写。

---

## 1. prompt-skill-tool-copilot（ai-research-best-practices #5）

主题：从 Prompt、Skill、Tool 三层构建经济学研究 Copilot。

### 来源（4 条）

1. **Anthropic, *Building effective agents*** — https://www.anthropic.com/engineering/building-effective-agents  
   提出不要把 Agent 做得过重，应通过提示模板、工作流与工具调用的组合，在可靠性与灵活性之间取得平衡。

2. **OpenAI, *Function calling guide*** — https://platform.openai.com/docs/guides/function-calling  
   官方工具调用指南，说明如何把大模型输出绑定到可执行函数、数据库与外部 API。

3. **Lilian Weng, *LLM Powered Autonomous Agents*** — https://lilianweng.github.io/posts/2023-06-23-llm-agent/  
   系统梳理 Agent 的 Planning、Memory、Tool Use 三大模块，是理解“认知架构分层”的基础读物。

4. **Wang et al., *The Rise and Potential of Large Language Model Based Agents: A Survey* (arXiv:2309.07864)** — https://arxiv.org/abs/2309.07864  
   大模型 Agent 综述，覆盖 Profile、Memory、Planning、Action 四层设计，对应本文的 Skill/Memory/Tool 拆分思路。

### 核心论断

经济学研究 Copilot 的稳定性，来自把提示策略、领域技能与工具调用拆成可独立演化的三层，而不是把所有判断都压给单一大模型对话。

### 建议 Frontmatter

```yaml
slug: prompt-skill-tool-copilot
title: 用 Prompt、Skill、Tool 三层构建经济学研究 Copilot
excerpt: 把研究 Copilot 当成聊天窗口会很快触顶；更可持续的做法是把它拆成提示模板、领域技能和工具接口三层，每层都能独立迭代。
category: 系统设计
date: '2026-02-26'
readTime: 13 分钟
tags:
- Copilot
- 提示工程
- 工具集成
- 工作流架构
- Agent 设计
author: EconAgora Product Studio
authorRole: Agent 产品编辑
issue: EA-2026-02-002
illustration: copilotLayers
cover: /blog-covers/2026/05/prompt-skill-tool-copilot.png
series: ai-research-best-practices
seriesOrder: 5
status: published
```

### 详细大纲

1. **问题：单一会话式 Copilot 的天花板**  
   - 上下文长度有限、每次对话“从零开始”、输出风格随轮次漂移。
   - 经济学任务需要稳定：识别策略、稳健性排列、数据口径等不能靠临场发挥。

2. **Prompt 层：把研究问题压缩为边界清晰的指令模板**  
   - 任务分解（文献综述/识别策略/稳健性/写作）。
   - 角色、输入、输出格式、约束条件、示例（few-shot）五要素。
   - 不要追求“万能 prompt”，而是建立可版本化的模板库。

3. **Skill 层：保存经济学的工作法，而不只是事实**  
   - 识别策略常见质疑清单、稳健性检验优先级、文献综述的问题意识组织方式。
   - Skill 是“领域规则 + 判断经验”的结构化封装。
   - 与通用 prompt 的区别：Skill 是可被工具调用的模块。

4. **Tool 层：把建议变成动作**  
   - 必须能读取目录、调用数据库（Dataverse/WB/国家统计局）、生成代码文件、检查日志。
   - 工具输出回注到对话，形成闭环。
   - 示例：让 Copilot 调用 Stata/R/Python 执行稳健性脚本并解析结果。

5. **三层接口与替换原则**  
   - Prompt 可换模型，Skill 可换学科方向，Tool 可换执行环境。
   - 每层都有版本号、回退策略和错误边界。

6. **给经济学研究者的落地清单**  
   - 先固定 3 个高频任务模板；
   - 把最常被追问的审稿意见写成 Skill；
   - 至少接入一个可执行工具（代码解释器、数据库或文件系统）。

---

## 2. agent-memory-for-semesters（ai-research-best-practices #4）

主题：让经济学 Agent 的记忆跨学期存活。

### 来源（4 条）

1. **Lilian Weng, *LLM Powered Autonomous Agents*（Memory 章节）** — https://lilianweng.github.io/posts/2023-06-23-llm-agent/  
   将 Agent 记忆区分为感觉记忆、短期记忆与长期记忆，并讨论向量检索作为长期记忆载体的优劣。

2. **Packer et al., *MemGPT: Towards LLMs as Operating Systems* (arXiv:2310.08560)** — https://arxiv.org/abs/2310.08560  
   提出分层记忆（上下文 / 外部存储 / 分层归档），解决长上下文与持久化记忆问题。

3. **Park et al., *Generative Agents: Interactive Simulacra of Human Behavior* (arXiv:2304.03442)** — https://arxiv.org/abs/2304.03442  
   引入 memory stream、reflection 与 retrieval，展示长期经验如何被结构化为可回忆事件。

4. **LangChain, *Memory* 概念文档** — https://python.langchain.com/docs/concepts/memory/  
   列出对话记忆、实体记忆、向量检索记忆等实现方式，强调不同记忆类型服务于不同任务。

### 核心论断

让经济学 Agent 在学期更替后仍保持价值的记忆系统，必须把事实、判断与制度上下文分层保存，并为每条记忆设置失效条件与回链证据。

### 建议 Frontmatter

```yaml
slug: agent-memory-for-semesters
title: 让经济学 Agent 的记忆跨学期存活
excerpt: 研究 Agent 的记忆不应只是向量检索；真正难保存的是决策理由、失败尝试与合作规范，并且每条记忆都需要失效条件与原始证据回链。
category: 知识管理
date: '2026-02-14'
readTime: 9 分钟
tags:
- Agent 记忆
- 知识库
- 研究协作
- 长期上下文
- 知识管理
author: EconAgora Knowledge Desk
authorRole: 知识系统编辑
issue: EA-2026-02-001
illustration: memoryArchive
cover: /blog-covers/2026/05/agent-memory-for-semesters.png
series: ai-research-best-practices
seriesOrder: 4
status: published
```

### 详细大纲

1. **为什么“记住所有对话”不够**  
   - 向量检索只保存了文本相似度，没保存“为什么这样决策”。
   - 学期更替后，新成员面对旧结论无法判断其有效性。

2. **把记忆分成三层：事实、判断、制度**  
   - **事实层**：变量定义、数据口径、来源链接、样本范围。
   - **判断层**：为何选择某识别策略、放弃某变量的原因、稳健性结论。
   - **制度层**：导师偏好、课程目标、合作规范、审稿人风格。
   - 三层不能混写，否则检索时互相污染。

3. **记忆条目必须带时间戳和失效条件**  
   - 数据更新、政策背景变化、课程轮替都会让旧结论失效。
   - 每条重要记忆标注：生效时间、预期失效条件、最后验证时间。

4. **最好的记忆系统能把人带回原始证据**  
   - 每条结论回链到笔记、脚本、论文或数据文件。
   - 避免记忆层本身成为新的黑箱。

5. **跨学期交接的最小可行流程**  
   - 学期末输出“记忆快照”：未完成假设、已验证结论、待验证问题。
   - 新学期先进行失效审查，再继承可用记忆。

6. **反模式与检查清单**  
   - 反模式：把聊天记录直接 embedding；把所有结论混在一个知识库。
   - 清单：分层了吗？有失效条件吗？能回链证据吗？有交接仪式吗？

---

## 3. from-pdf-to-panel（paper-projects #3）

主题：经济学文献综述的四代理工作流。

### 来源（4 条）

1. **PRISMA 2020 Statement** — https://prisma-statement.org/prisma-2020/  
   系统综述与元分析的国际报告规范，强调可重复检索、筛选流程与结构化数据提取。

2. **Connected Papers, *About*** — https://www.connectedpapers.com/about  
   基于共引图构建文献网络，说明“论文之间的关系”比“单篇摘要”更有助于综述。

3. **Elicit, *About*** — https://elicit.com/about  
   AI 研究助手，通过抽取论文中的关键信息（样本、方法、结论）来加速系统性综述。

4. **Semantic Scholar, *About*** — https://www.semanticscholar.org/about  
   开放学术图谱与 API，为大规模文献索引、元数据抽取提供基础设施。

### 核心论断

文献综述效率提升的关键，不是让模型直接生成成稿，而是先把 PDF 拆成标准化证据卡片，再让 Reader、Mapper、Skeptic、Synthesizer 四层代理接力输出可质疑、可复用的研究资产。

### 建议 Frontmatter

```yaml
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
illustration: reviewFlow
cover: /blog-covers/2026/05/from-pdf-to-panel.png
series: paper-projects
seriesOrder: 3
status: published
```

### 详细大纲

1. **为什么大多数综述在第一轮就失真**  
   - 对话式总结把识别假设、样本口径、数据限制揉成模糊叙事。
   - 没有结构化字段，后续无法比较、质疑与复现。

2. **标准化拆解：把 PDF 变成证据卡片**  
   - 必填字段：claim、data、method、sample、limitation。
   - 可选字段：识别策略、稳健性、政策背景、可复现性评级。
   - 一张卡片就是一行 panel 数据。

3. **四层代理接力**  
   - **Reader**：只负责提取与校验字段，不做评价。
   - **Mapper**：建立跨论文对照表（主题 × 方法 × 数据），发现冲突与空白。
   - **Skeptic**：专门回答“这条结论在哪一步最脆弱”。
   - **Synthesizer**：基于前三层输出写综述，成稿天然带证据索引。

4. **应该追踪的三个运营指标**  
   - 文献卡片复用率；
   - 识别策略冲突发现率；
   - 从综述到回归脚本的转化率。

5. **从 Panel 到可复现研究设计**  
   - 用整理后的 panel 直接生成假设清单、变量定义、识别策略对比表。
   - 让综述成为研究组的长期资产，而不是一次性写作任务。

6. **落地工具链建议**  
   - PDF 解析（GROBID / Marker）→ 字段抽取（LLM + schema）→ 向量/表格存储（SQLite/DuckDB）→ 可视化（Obsidian / Streamlit）。

---

## 4. auditing-ai-identification（paper-projects #2）

主题：如何审计 AI 生成的识别策略。

### 来源（4 条）

1. **Angrist & Pischke, *Mostly Harmless Econometrics*** — https://www.mostlyharmlesseconometrics.com/  
   应用计量经济学核心教材，系统讲解识别、反事实与因果推断的可证伪逻辑。

2. **Scott Cunningham, *Causal Inference: The Mixtape*** — https://mixtape.scunning.com/  
   面向实证研究者的因果推断指南，强调识别策略的制度基础与假设可检验性。

3. **Athey & Imbens, *The State of Applied Econometrics: Causality and Policy Evaluation* (JEP)** — https://www.aeaweb.org/articles?id=10.1257/jep.31.2.3  
   《经济展望期刊》综述，讨论现代应用计量中识别策略的评估标准与常见陷阱。

4. **NIST, *AI Risk Management Framework*** — https://www.nist.gov/itl/ai-risk-management-framework  
   美国国家标准与技术研究院的 AI 风险管理框架，提供可审计、可测试、可治理的方法论。

### 核心论断

审计 AI 生成的识别策略，必须把方案拆成“处理可界定、对照可比、假设可检验、数据可支撑、结果可替代”五个可证伪问题，而不是只判断叙事是否自洽。

### 建议 Frontmatter

```yaml
slug: auditing-ai-identification
title: 如何审计 AI 生成的识别策略
excerpt: LLM 可以快速提出看似合理的 DID/IV/RDD 方案，但真正的问题不在叙事是否优美，而在方案能否通过一套可逐项检查的审计表。
category: 因果推断
date: '2026-03-09'
readTime: 11 分钟
tags:
- 识别策略
- 审计框架
- LLM 方法论
- 因果推断
- 反事实
author: EconAgora Causal Lab
authorRole: 因果推断编辑
issue: EA-2026-03-001
illustration: auditCompass
cover: /blog-covers/2026/05/auditing-ai-identification.png
series: paper-projects
seriesOrder: 2
status: published
```

### 详细大纲

1. **LLM 识别方案的诱惑与风险**  
   - 模型擅长生成“听起来合理”的 DID、RDD、IV。
   - 危险：把叙事自洽当成识别有效。

2. **先问反事实是否存在**  
   - AI 往往默认存在可比较对象，但没有证明制度、时点或选择机制的可比性。
   - 反事实不是数学假设，而是制度事实。

3. **五问审计表**  
   - **处理可界定**：处理变量能否被清晰操作化？
   - **对照可比**：对照组与处理组在选择机制上是否满足可比条件？
   - **假设可检验**：关键识别假设能否被数据或制度事实反驳？
   - **数据可支撑**：所需变量是否“必须”而非仅“想要”？样本是否足够？
   - **结果可替代**：若改变估计方法或窗口，结论是否仍成立？

4. **强制失败情境与最弱前提**  
   - 要求模型写出最脆弱的前提，而不是最优美的叙事。
   - 要求模型给出至少一个会让方案失败的情境。

5. **人机分工的新边界**  
   - AI：快速铺开假设空间与替代设计。
   - 人类：压缩空间、拒绝错误路径、把设计绑定到真实制度背景。

6. **可复用的审计清单**  
   - 生成一个 Markdown/Excel 检查表，供每次评审 AI 方案时使用。

---

## 5. replication-breaks-before-regression（paper-projects #4）

主题：为什么复现往往死在回归之前。

### 来源（4 条）

1. **Gentzkow & Shapiro, *Code and Data for the Social Sciences: A Practitioner’s Guide*** — https://web.stanford.edu/~gentzkow/research/CodeAndData.pdf  
   经济学复现工程经典指南，强调文件组织、版本控制、自动化与文档化的最佳实践。

2. **American Economic Association, *Data and Code Availability Policy*** — https://www.aeaweb.org/journals/policies/data-code  
   AEA 期刊数据与代码可及性政策，说明顶级期刊对复现材料的最低要求。

3. **Gary King, *Replication, Replication*** — https://gking.harvard.edu/replication  
   政治学方法论经典文章，阐述复现的标准、意义与常见失败原因。

4. **Dataverse Project** — https://dataverse.org/  
   社会科学数据仓储与发布平台，提供长期保存、版本管理与 DOI 引用机制。

### 核心论断

复现项目在回归之前就已失败，根源在于路径漂移、版本失控、文件命名与数据字典缺失；把复现仓库当作产品来治理，是避免失败的前提。

### 建议 Frontmatter

```yaml
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
illustration: replicationStack
cover: /blog-covers/2026/05/replication-breaks-before-regression.png
series: paper-projects
seriesOrder: 4
status: published
```

### 详细大纲

1. **回归不是最常见的失败点**  
   - 研究者往往聚焦于回归表能否跑出。
   - 实际失败多发生在文件组织、路径、版本与文档阶段。

2. **路径与版本漂移是最隐蔽的风险**  
   - 脚本今天能跑，三个月后可能因为目录结构、软件版本、中间文件命名变化而失败。
   - 任何无记录的变化都会让复现者开始猜测。

3. **把复现仓库视为产品，而不是附件**  
   - README 必须说明“从哪里开始”。
   - 数据字典说明每个变量如何生成。
   - 中间产物明确能否删除与重建。

4. **三条硬规则**  
   - 原始数据永远只读；
   - 每个脚本只承担单一阶段责任；
   - 任何手动操作都要写回文档。

5. **让 AI 协助复现，但不接管判断**  
   - AI 适合整理日志、生成目录树、补齐变量说明。
   - 人类必须决定两个相似数据版本是否可互换、关键边界是否成立。

6. **最小可复现仓库检查表**  
   - 目录结构、README、依赖列表、数据字典、运行入口、输出校验、版本标签、手动步骤记录。

---

## 待确认事项

- 各篇建议 Frontmatter 中的 `title` / `excerpt` / `tags` 是否需要进一步调整？
- 是否需要对某些引用补充更具体的小节/页码？
- 进入 Stage 2 后，是否需要统一每篇的字数、配图说明与 CTA？
