---
slug: "llm-assisted-did-design"
title: "使用 LLM 辅助 DID 识别策略设计"
excerpt: "本文介绍如何利用 Claude 和 GPT-4 辅助设计双重差分法（DID）的识别策略，包括处理组定义、平行趋势检验和溢出效应评估的完整工作流。"
category: "因果推断"
date: "2026-05-14"
readTime: "15 分钟"
tags:
  - "LLM"
  - "DID"
  - "因果推断"
  - "工具教程"
  - "Claude"
author: "戴伟德"
authorRole: "经济学研究者"
issue: "Volume 2605"
illustration: "generated"
cover: "/blog-covers/2026/05/llm-assisted-did-design.png"
source: "arXiv:2605.xxxxx"
---

## 引言

双重差分法（Difference-in-Differences, DID）是经济学实证研究中最常用的因果推断工具之一。然而，DID 的识别假设——特别是平行趋势假设——往往难以严格验证。研究者通常依赖图形判断和安慰剂检验，但这些方法存在主观性强、覆盖不全面的问题。

近年来，大型语言模型（LLM）展现出强大的文本理解和逻辑推理能力。本文提出一种系统性的方法，利用 Claude 和 GPT-4 辅助 DID 识别策略的设计与评估。核心思路是：将 LLM 作为"识别策略顾问"，通过结构化提示词（Structured Prompting）让模型扮演不同角色，分别负责处理组定义、平行趋势评估、溢出效应检查和机制分析。

## 为什么需要 LLM 辅助

传统的 DID 设计流程存在三个痛点：

**第一，处理组定义的主观性。** 研究者往往基于经验判断选择处理组，但难以穷尽所有可能的定义方式。例如，在研究最低工资政策影响时，处理组可以是"提高最低工资的州"，也可以是"提高幅度超过 10% 的州"，或者是"相对联邦最低工资提高的州"。不同定义可能导致截然不同的结论。

**第二，平行趋势检验的局限性。** 常用的事件研究图只能展示处理前的趋势是否平行，但无法告诉我们：如果平行趋势不成立，问题出在哪里？是处理组选择不当，还是存在时变混淆因素？

**第三，溢出效应的忽视。** 处理组和对照组之间可能存在相互作用（如劳动力跨州流动），导致 SUTVA 假设 violated。传统方法很难系统性地识别这类问题。

LLM 的优势在于：它可以快速生成多种处理组定义方案、从不同角度评估平行趋势的合理性、并提出可能的溢出渠道。当然，LLM 的建议需要结合领域知识进行判断，不能盲目采纳。

## 核心方法：四步工作流

### 步骤一：生成处理组定义方案

首先，我们让 LLM 扮演"研究设计顾问"，基于研究问题生成多种处理组定义方案。

**提示词模板：**

```
你是一位劳动经济学专家。我正在研究 [具体政策] 对 [结果变量] 的影响，
计划使用双重差分法（DID）。

请帮我生成 5 种不同的处理组定义方案，要求：
1. 每种方案基于不同的识别逻辑
2. 说明每种方案的优点和潜在问题
3. 评估每种方案满足平行趋势假设的可能性
4. 推荐最适合的方案并说明理由

研究背景：
- 政策实施时间：[时间]
- 处理区域：[区域描述]
- 结果变量：[变量描述]
- 数据频率：[年度/季度/月度]
```

**实际案例：最低工资政策**

以 Card and Krueger (1994) 的经典研究为例，我们询问 Claude 关于新泽西州最低工资提高的处理组定义方案。

Claude 返回了以下方案：

| 方案 | 处理组定义 | 优点 | 潜在问题 |
|-----|-----------|------|---------|
| A | 新泽西州所有快餐店 | 最直观，符合政策文本 | 处理强度异质性大 |
| B | 新泽西州初始工资低于新最低工资的店 | 处理强度明确 | 可能存在选择偏差 |
| C | 新泽西州与宾州边境的店（处理）vs 宾州边境的店（对照） | 地理接近，可比性强 | 样本量小，溢出效应风险 |
| D | 新泽西州 + 其他同期提薪的州（处理）vs 未提薪的州（对照） | 样本量大，统计功效高 | 处理时间不一致 |
| E | 新泽西州快餐店（处理）vs 宾州快餐店（对照），但排除边境县 | 减少溢出效应 | 对照组可能不具代表性 |

Claude 推荐方案 C，理由是："边境县设计（border county design）可以最大程度保证处理组和对照组的可比性，因为相邻县的快餐店面临相似的劳动力市场条件和消费者需求冲击。"

**研究者判断：** Claude 的建议有道理，但需要注意：
- 边境县可能存在跨州通勤，导致溢出效应
- 样本量确实较小，需要检验统计功效
- 应该同时报告方案 A（全样本）作为稳健性检验

### 步骤二：平行趋势假设评估

接下来，我们让 LLM 扮演"计量经济学审查员"，评估平行趋势假设的合理性。

**提示词模板：**

```
你是一位计量经济学专家，专门审查 DID 设计的识别假设。

请基于以下信息，评估平行趋势假设的合理性：

处理组：[描述]
对照组：[描述]
结果变量：[描述]
时间跨度：[起始年份] - [结束年份]
政策实施时间：[时间]

要求：
1. 列出 3-5 个可能违反平行趋势的因素
2. 对每个因素，说明：
   - 为什么会影响平行趋势
   - 如何检验该因素是否造成问题
   - 如果存在问题，如何修正（如加入控制变量、使用合成控制法等）
3. 评估整体识别策略的可信度（1-10 分）
4. 提出改进建议
```

**Claude 的评估示例：**

针对 Card and Krueger 的研究，Claude 识别出以下潜在威胁：

**威胁 1：区域特定的时间趋势**
- **问题：** 新泽西州和宾州可能有不同的经济周期
- **检验：** 检查政策实施前 5 年的就业趋势是否平行
- **修正：** 加入州-时间交互固定效应，或使用交互加权 DID

**威胁 2：行业特定冲击**
- **问题：** 1992 年快餐行业可能受到全国性冲击（如麦当劳推出超值套餐）
- **检验：** 比较其他州的快餐业趋势
- **修正：** 加入行业-时间固定效应

**威胁 3：预期效应**
- **问题：** 雇主可能在政策实施前调整雇佣行为
- **检验：** 检查政策宣布到实施之间的就业变化
- **修正：** 使用事件研究法，将政策宣布作为事件时间

**整体可信度评分：7/10**

Claude 认为主要优势是处理组和对照组地理接近、行业相同；主要风险是样本量小、可能存在跨州溢出。

### 步骤三：溢出效应检查

第三步，我们让 LLM 扮演"产业组织经济学家"，分析可能的溢出效应渠道。

**提示词模板：**

```
你是一位产业组织经济学专家，研究市场间的相互影响。

请分析以下 DID 设计中可能存在的溢出效应（Spillover Effects）：

处理组：[描述]
对照组：[描述]
市场结构：[描述，如竞争性/寡头垄断]
地理范围：[描述]

要求：
1. 列出所有可能的溢出渠道：
   - 劳动力流动
   - 消费者跨区购买
   - 企业迁移/进入退出
   - 价格传导
   - 网络效应
2. 对每个渠道：
   - 说明作用机制
   - 评估影响方向和大小
   - 提出检测方法
3. 如果溢出效应存在，建议修正方法：
   - 空间 DID
   - 排除边界样本
   - 工具变量法
```

**Claude 的分析示例：**

针对新泽西-宾州边境设计，Claude 识别出以下溢出渠道：

**渠道 1：劳动力跨州通勤**
- **机制：** 新泽西州工资提高后，宾州居民可能跨州到新泽西工作
- **影响：** 宾州（对照组）的就业可能下降，导致低估处理效应
- **检测：** 比较边境县与非边境县的就业变化差异
- **修正：** 使用通勤数据定义处理强度，或排除通勤便利的县

**渠道 2：消费者跨州消费**
- **机制：** 宾州消费者可能到新泽西消费（如果价格差异不大）
- **影响：** 新泽西（处理组）的销售额可能上升，高估处理效应
- **检测：** 分析销售额数据，比较边境店与非边境店
- **修正：** 使用销售额作为结果变量时需谨慎解释

**渠道 3：企业选址决策**
- **机制：** 新企业可能优先选择宾州（成本较低），现有企业可能迁出
- **影响：** 长期动态效应，短期可能不明显
- **检测：** 分析企业进入退出数据
- **修正：** 使用长期面板数据，或关注短期静态效应

### 步骤四：机制分析设计

最后，我们让 LLM 帮助设计机制分析（Mechanism Analysis）。

**提示词模板：**

```
你是一位劳动经济学专家，研究政策传导机制。

请为以下 DID 研究设计机制分析方案：

研究问题：[描述]
主要发现：[描述处理效应的大小和方向]

要求：
1. 提出 3-5 个可能的作用机制
2. 对每个机制：
   - 说明理论依据
   - 设计检验该机制的实证策略
   - 说明预期结果（如果该机制成立）
3. 讨论机制之间的替代或互补关系
4. 建议中介变量或调节变量
```

**Claude 的机制分析示例：**

针对最低工资提高的就业效应，Claude 提出以下机制：

**机制 1：劳动力供给增加**
- **理论：** 更高工资吸引更多工人进入劳动力市场
- **检验：** 分析劳动力参与率变化，区分集约边际和广延边际
- **预期：** 如果该机制主导，应观察到就业增加但人均工时下降

**机制 2：企业成本推动的价格调整**
- **理论：** 企业转嫁成本到价格，导致需求下降
- **检验：** 分析价格变化和销售额变化
- **预期：** 如果该机制主导，应观察到价格上升、销售额下降

**机制 3：生产率提升**
- **理论：** 效率工资效应，更高工资激励工人更努力
- **检验：** 分析劳动生产率（销售额/员工数）
- **预期：** 如果该机制主导，应观察到生产率上升

**机制 4：资本替代劳动**
- **理论：** 企业用自动化设备替代低技能工人
- **检验：** 分析资本投资、技能结构变化
- **预期：** 如果该机制主导，应观察到低技能就业下降、资本投资增加

## 完整代码实现

以下是将上述工作流自动化的 Python 脚本：

```python
import os
import json
from typing import List, Dict
from openai import OpenAI

class DIDDesignAssistant:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
    
    def generate_treatment_definitions(
        self, 
        policy: str, 
        outcome: str, 
        context: str
    ) -> List[Dict]:
        """步骤一：生成处理组定义方案"""
        
        prompt = f"""
        你是一位劳动经济学专家。我正在研究 {policy} 对 {outcome} 的影响，
        计划使用双重差分法（DID）。
        
        请帮我生成 5 种不同的处理组定义方案...
        
        研究背景：{context}
        """
        
        response = self.client.chat.completions.create(
            model="claude-sonnet-4-20250514",
            messages=[
                {"role": "system", "content": "你是一位经验丰富的劳动经济学研究者。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        # 解析响应，提取结构化数据
        return self._parse_treatment_definitions(
            response.choices[0].message.content
        )
    
    def assess_parallel_trends(
        self,
        treatment_group: str,
        control_group: str,
        outcome: str,
        time_span: str,
        policy_time: str
    ) -> Dict:
        """步骤二：评估平行趋势假设"""
        
        prompt = f"""
        你是一位计量经济学专家...
        
        处理组：{treatment_group}
        对照组：{control_group}
        结果变量：{outcome}
        时间跨度：{time_span}
        政策实施时间：{policy_time}
        """
        
        response = self.client.chat.completions.create(
            model="claude-sonnet-4-20250514",
            messages=[
                {"role": "system", "content": "你是一位严格的计量经济学审查员。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=2000
        )
        
        return self._parse_assessment(response.choices[0].message.content)
    
    def check_spillovers(
        self,
        treatment: str,
        control: str,
        market_structure: str,
        geography: str
    ) -> List[Dict]:
        """步骤三：检查溢出效应"""
        
        prompt = f"""
        你是一位产业组织经济学专家...
        
        处理组：{treatment}
        对照组：{control}
        市场结构：{market_structure}
        地理范围：{geography}
        """
        
        response = self.client.chat.completions.create(
            model="claude-sonnet-4-20250514",
            messages=[
                {"role": "system", "content": "你专门研究市场间的相互影响。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            max_tokens=2000
        )
        
        return self._parse_spillovers(response.choices[0].message.content)
    
    def design_mechanism_analysis(
        self,
        research_question: str,
        main_finding: str
    ) -> List[Dict]:
        """步骤四：设计机制分析"""
        
        prompt = f"""
        你是一位劳动经济学专家...
        
        研究问题：{research_question}
        主要发现：{main_finding}
        """
        
        response = self.client.chat.completions.create(
            model="claude-sonnet-4-20250514",
            messages=[
                {"role": "system", "content": "你专门研究政策传导机制。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        return self._parse_mechanisms(response.choices[0].message.content)
    
    def run_full_pipeline(self, study_config: Dict) -> Dict:
        """运行完整工作流"""
        
        print("🚀 启动 DID 设计辅助工作流")
        
        # 步骤一
        print("\n📝 步骤 1/4: 生成处理组定义方案...")
        treatments = self.generate_treatment_definitions(
            study_config["policy"],
            study_config["outcome"],
            study_config["context"]
        )
        print(f"   生成 {len(treatments)} 种方案")
        
        # 步骤二
        print("\n📊 步骤 2/4: 评估平行趋势假设...")
        assessment = self.assess_parallel_trends(
            study_config["treatment_group"],
            study_config["control_group"],
            study_config["outcome"],
            study_config["time_span"],
            study_config["policy_time"]
        )
        print(f"   可信度评分: {assessment['score']}/10")
        
        # 步骤三
        print("\n🌊 步骤 3/4: 检查溢出效应...")
        spillovers = self.check_spillovers(
            study_config["treatment_group"],
            study_config["control_group"],
            study_config["market_structure"],
            study_config["geography"]
        )
        print(f"   识别 {len(spillovers)} 个溢出渠道")
        
        # 步骤四
        print("\n⚙️  步骤 4/4: 设计机制分析...")
        mechanisms = self.design_mechanism_analysis(
            study_config["research_question"],
            study_config["main_finding"]
        )
        print(f"   提出 {len(mechanisms)} 个作用机制")
        
        return {
            "treatments": treatments,
            "assessment": assessment,
            "spillovers": spillovers,
            "mechanisms": mechanisms
        }

# 使用示例
if __name__ == "__main__":
    assistant = DIDDesignAssistant(os.environ["OPENAI_API_KEY"])
    
    config = {
        "policy": "新泽西州 1992 年最低工资提高",
        "outcome": "快餐业就业",
        "context": "1992 年 4 月，新泽西州将最低工资从 $4.25 提高到 $5.05...",
        "treatment_group": "新泽西州快餐店",
        "control_group": "宾夕法尼亚州快餐店",
        "time_span": "1992-1993",
        "policy_time": "1992年4月",
        "market_structure": "竞争性劳动力市场",
        "geography": "新泽西-宾州边境",
        "research_question": "最低工资提高对快餐业就业的影响",
        "main_finding": "就业未显著下降，甚至可能略有上升"
    }
    
    results = assistant.run_full_pipeline(config)
    
    # 保存结果
    with open("did_design_report.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("\n✅ 报告已保存至 did_design_report.json")
```

## 实践建议

### 1. 提示词工程的重要性

LLM 的输出质量高度依赖提示词设计。建议：

- **角色设定：** 明确指定 LLM 扮演的专家角色（"你是一位劳动经济学专家"）
- **结构化输出：** 要求模型按特定格式返回（表格、评分、优先级）
- **迭代优化：** 根据第一轮输出调整提示词，获得更精确的结果

### 2. 人机协作的最佳实践

LLM 是辅助工具，不是替代品：

| 任务 | LLM 适合 | 研究者必须做 |
|-----|---------|-----------|
| 生成处理组方案 | ✅ 头脑风暴 | ✅ 最终选择 |
| 评估平行趋势 | ✅ 识别潜在威胁 | ✅ 实证检验 |
| 检查溢出效应 | ✅ 提出可能渠道 | ✅ 数据验证 |
| 设计机制分析 | ✅ 理论框架 | ✅ 实证检验 |
| 解释结果 | ✅ 多角度解读 | ✅ 最终判断 |

### 3. 常见陷阱

**陷阱 1：过度依赖 LLM 的判断**
- LLM 可能生成看似合理但实际错误的建议
- 必须结合领域知识和数据验证

**陷阱 2：忽视模型的知识截止日期**
- Claude 和 GPT-4 的知识有截止日期
- 对于最新政策或数据，需要提供上下文

**陷阱 3：提示词泄露敏感信息**
- 不要在提示词中包含未发表的研究结果
- 注意数据隐私和保密要求

## 总结

本文介绍了一种利用 LLM 辅助 DID 识别策略设计的系统性方法。通过四步工作流（处理组定义、平行趋势评估、溢出效应检查、机制分析），研究者可以：

1. **拓展思路：** 发现传统方法可能忽略的处理组定义和威胁因素
2. **提高效率：** 快速生成多种方案并进行初步筛选
3. **增强严谨性：** 系统性地检查识别假设，减少遗漏

**关键原则：** LLM 是"研究助理"而非"研究主导者"。它的建议需要经过严格的实证检验和领域专家评审。

未来研究方向包括：将这一工作流扩展到其他因果推断方法（如断点回归、工具变量法）、开发自动化的提示词优化算法、以及建立 LLM 辅助研究设计的最佳实践指南。

---

**延伸阅读：**

- Card, D., & Krueger, A. B. (1994). Minimum Wages and Employment: A Case Study of the Fast-Food Industry in New Jersey and Pennsylvania. *American Economic Review*, 84(4), 772-793.
- Goodman-Bacon, A. (2021). Difference-in-differences with variation in treatment timing. *Journal of Econometrics*, 225(2), 254-277.
- Callaway, B., & Sant'Anna, P. H. (2021). Difference-in-differences with multiple time periods. *Journal of Econometrics*, 225(2), 200-230.

**工具推荐：**

- Claude (Anthropic): 适合深度推理和结构化分析
- GPT-4 (OpenAI): 适合代码生成和快速原型
- Perplexity: 适合文献检索和事实核查

---

*本文是 EconAgora AI 工具系列的第一篇。如果你有任何问题或建议，欢迎在 Twitter 上 @EconAgora 讨论。*
