---
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
cover: /blog-covers/2026/05/prompt-skill-tool-copilot.png
series: ai-research-best-practices
seriesOrder: 5
status: published
---

把大模型当成一个聪明的研究助理，打开对话窗口就开始问，是许多团队使用 Copilot 的第一步。但很快会发现：同样的问题问第二遍，答案风格变了；上下文一长，模型开始遗忘关键约束；最需要稳定的审稿意见回复、稳健性排列、数据口径说明，却每次都要从头再解释。问题不在模型不够聪明，而在我们把所有判断都压进了一段临时对话。

更可持续的做法，是把研究 Copilot 拆成三层可独立演化的架构：Prompt 层压缩表达，Skill 层保存学科工作法，Tool 层把建议变成动作。Anthropic 在 *Building effective agents* 中提醒我们，不要把 Agent 做得过重，而应通过提示模板、工作流与工具调用的组合，在可靠性与灵活性之间取得平衡[^1]。Wang 等人的 Agent 综述则进一步把设计拆为 Profile、Memory、Planning、Action 四层，其中 Planning 与 Action 的分离，正对应本文 Prompt/Skill 与 Tool 的拆分思路[^4]。

## 1. 问题：单一会话式 Copilot 的天花板

经济学研究任务有几个共同特点：任务周期长、上下文重、对一致性的要求高。一次对话能承载的信息有限，而研究者的提问方式又往往带有大量背景噪声。结果常见问题包括：

- 输出风格随轮次漂移，同一任务两次运行结果不一致；
- 每次都要重复说明识别策略、稳健性优先级、数据口径；
- 模型的建议无法直接写入文件、调用数据库或执行代码；
- 难以追踪“这个结论是哪一次对话产生的”。

Lilian Weng 对 LLM Agent 的梳理指出，Planning、Memory、Tool Use 是 Agent 的三大核心模块[^3]。如果三者混在同一个聊天窗口里，没有一个模块能被单独优化。

## 2. Prompt 层：把研究问题压缩为边界清晰的指令模板

Prompt 层不是“写一段好 prompt”，而是建立一套可版本化的模板库。一个好的研究指令模板，至少包含五个要素：

- **任务**：文献综述、识别策略设计、稳健性排列、段落润色等；
- **角色**：模型在这次任务中扮演的专家身份；
- **输入**：数据文件、论文片段、变量列表、研究背景；
- **输出格式**：表格、JSON、Markdown、Stata/R/Python 代码；
- **约束条件**：不要做的事、必须保留的字段、引用格式。

例如，一个用于稳健性检验的 prompt 模板可以这样写：

```markdown
# 角色
你是一位应用计量经济学审稿人。

# 任务
针对以下 DID 设计，列出 5 个最可能威胁识别可信度的因素，
并按“可检验程度”与“对主结果的潜在影响”两维度打分。

# 输入
研究问题：……
处理组定义：……
对照组来源：……
数据时期：……

# 输出格式
Markdown 表格，列：威胁因素 | 机制说明 | 可检验程度（1-5） | 潜在影响（1-5） | 建议检验方法。

# 约束
- 不要给出通用建议，每项必须绑定到本研究的具体设定。
- 如果某因素无法从现有信息判断，标注“信息不足”。
```

不要追求“万能 prompt”。越具体的模板，越容易被测试、版本化和复用。

## 3. Skill 层：保存经济学的工作法，而不只是事实

Skill 层保存的是“领域规则 + 判断经验”的结构化封装。它与 Prompt 层的区别在于：Skill 是可被工具调用的模块，能在不同任务之间复用。

经济学研究中适合积累为 Skill 的内容包括：

- 识别策略常见质疑清单（DID 的平行趋势、IV 的相关性与排他性、RDD 的连续性）；
- 稳健性检验优先级排列；
- 文献综述的问题意识组织方式；
- 数据口径与变量命名规范；
- 审稿意见回复模板。

例如，一个 `identification-audit` Skill 的核心指令可以是：

```yaml
---
name: identification-audit
description: |
  审计 AI 生成的识别策略。把方案拆成五个可证伪问题：
  处理可界定、对照可比、假设可检验、数据可支撑、结果可替代。
---

# 执行步骤
1. 要求调用者提供识别策略简述、数据来源与主要假设。
2. 逐条回答五问，每项必须给出“通过 / 需补充 / 不通过”的判断。
3. 列出最脆弱的前提和至少一个会导致方案失败的现实情境。
4. 输出 Markdown 检查表，并给出下一步建议。
```

Skill 的好处是：它把一次性 prompt 变成可维护的资产。团队可以围绕同一 Skill 持续迭代，而不必在每次对话中重新协商规则。

## 4. Tool 层：把建议变成动作

如果 Copilot 只能给建议，研究的最后一公里仍然要靠人手动完成。Tool 层让模型能够：

- 读取项目目录与文件内容；
- 调用数据库或 API（Dataverse、World Bank、国家统计局）；
- 生成并执行 Stata/R/Python 脚本；
- 检查日志、对比输出、写入结果文件；
- 把执行结果回注到对话，形成完整反馈循环。

OpenAI 的 Function Calling 指南指出，工具调用的本质是把模型输出绑定到可执行函数[^2]。对于经济学研究而言，这意味着模型提出的稳健性检验，可以直接触发一段代码运行，并把结果解析成表格返回。

一个最小可行的 Tool 链路示例：

```python
# tools/run_robustness.py
def run_robustness(spec_id: str, data_path: str, script_path: str) -> dict:
    """
    运行稳健性脚本并返回关键统计量。
    """
    import subprocess, json, os
    output_file = f"outputs/robustness_{spec_id}.json"
    subprocess.run(
        ["python", script_path, "--data", data_path, "--out", output_file],
        check=True
    )
    with open(output_file, "r", encoding="utf-8") as f:
        return json.load(f)
```

模型通过 Tool Calling 调用这个函数后，可以立即把返回的系数、标准误、显著性写进检查表，而不是让研究者自己复制粘贴。

## 5. 三层接口与替换原则

三层架构的核心价值，在于每层都可以独立替换：

- **Prompt 层**可换模型。只要模板结构稳定，从 Claude 切到 GPT-4 或 DeepSeek，输出仍可控。
- **Skill 层**可换学科方向。经济学 Skill 可以复用框架，把内容换成金融学、政治学或社会学的规则。
- **Tool 层**可换执行环境。本地脚本、远程服务器、云函数都可以接入，只要接口一致。

为保证稳定性，每层都应有自己的版本号、回退策略和错误边界。例如，Tool 调用失败时，Copilot 不应继续编造结果，而应回退到“请人工检查脚本日志”的预设流程。

## 6. 常见错误与规避方法

- **把所有判断都写进一个长 prompt**：难以维护，输出不稳定。应拆成 Prompt + Skill + Tool。
- **Skill 只保存事实，不保存判断规则**：事实会过时，判断规则才是长期资产。
- **Tool 层没有错误处理**：模型可能把失败输出当成正确结果。必须设置校验和回退。
- **忽视版本控制**：Prompt 模板和 Skill 文件应纳入 Git，每次调整都有记录。

## 7. 给经济学研究者的应用清单

如果你正在搭建自己的研究 Copilot，建议按以下顺序推进：

1. 先固定 3 个高频任务模板（如文献综述、稳健性审计、识别策略设计）；
2. 把最常被追问的审稿意见写成 Skill，而不是每次手写 prompt；
3. 至少接入一个可执行工具（代码解释器、数据库查询或文件系统）；
4. 为每层建立版本号，并记录哪次调整带来了什么效果变化；
5. 让 Tool 输出回注到工作区，而不是只停留在对话层。

## 8. 下一步

三层架构只是基础。要让 Copilot 在学期更替后仍然可靠，还需要一套把事实、判断与制度上下文分层保存的记忆系统。下一篇将讨论如何让经济学 Agent 的记忆跨学期存活。

---

## 参考与延伸阅读

[^1]: Anthropic. *Building effective agents*. https://www.anthropic.com/engineering/building-effective-agents
[^2]: OpenAI. *Function calling guide*. https://platform.openai.com/docs/guides/function-calling
[^3]: Weng, L. *LLM Powered Autonomous Agents*. https://lilianweng.github.io/posts/2023-06-23-llm-agent/
[^4]: Wang, L., Ma, C., Feng, X., et al. *The Rise and Potential of Large Language Model Based Agents: A Survey*. arXiv:2309.07864. https://arxiv.org/abs/2309.07864
