---
slug: "llm-assisted-did-design"
title: "Using LLMs to Assist DID Identification Strategy Design"
excerpt: "This article introduces how to leverage Claude and GPT-4 to assist in designing Difference-in-Differences (DID) identification strategies, including treatment group definition, parallel trends testing, and spillover effect assessment."
category: "Causal Inference"
date: "2026-05-14"
readTime: "15 min"
tags:
  - "LLM"
  - "DID"
  - "Causal Inference"
  - "Tutorial"
  - "Claude"
author: "戴伟德"
authorRole: "Economics Researcher"
issue: "Volume 2605"
illustration: "generated"
cover: "/blog-covers/2026/05/llm-assisted-did-design.svg"
source: "arXiv:2605.xxxxx"
---

## Introduction

Difference-in-Differences (DID) is one of the most widely used causal inference tools in empirical economics research. However, DID's identification assumptions—particularly the parallel trends assumption—are often difficult to validate rigorously. Researchers typically rely on visual inspection and placebo tests, but these methods suffer from subjectivity and incomplete coverage.

In recent years, Large Language Models (LLMs) have demonstrated powerful text understanding and logical reasoning capabilities. This article proposes a systematic approach to leveraging Claude and GPT-4 to assist in the design and evaluation of DID identification strategies. The core idea is to use LLMs as "identification strategy consultants," employing structured prompting to have the model play different roles responsible for treatment group definition, parallel trends assessment, spillover effect checking, and mechanism analysis.

## Why We Need LLM Assistance

Traditional DID design workflows have three pain points:

**First, the subjectivity of treatment group definition.** Researchers often select treatment groups based on experience, but struggle to exhaust all possible definitions. For example, when studying the impact of minimum wage policies, the treatment group could be defined as "states that raised the minimum wage," "states that raised it by more than 10%," or "states that raised it relative to the federal minimum wage." Different definitions may lead to substantially different conclusions.

**Second, the limitations of parallel trends testing.** Common event study plots can only show whether pre-treatment trends were parallel, but cannot tell us: if parallel trends do not hold, where is the problem? Is it inappropriate treatment group selection, or time-varying confounding factors?

**Third, the neglect of spillover effects.** There may be interactions between treatment and control groups (such as cross-state labor mobility), leading to violations of the SUTVA assumption. Traditional methods struggle to systematically identify such issues.

The advantage of LLMs is that they can quickly generate multiple treatment group definition schemes, assess the reasonableness of parallel trends from different angles, and propose possible spillover channels. Of course, LLM suggestions need to be evaluated with domain knowledge and should not be blindly adopted.

## Core Method: Four-Step Workflow

### Step 1: Generate Treatment Group Definition Schemes

First, we have the LLM play the role of a "research design consultant," generating multiple treatment group definition schemes based on the research question.

**Prompt Template:**

```
You are a labor economics expert. I am studying the impact of [specific policy] on [outcome variable],
planning to use the Difference-in-Differences (DID) method.

Please help me generate 5 different treatment group definition schemes, with the following requirements:
1. Each scheme should be based on a different identification logic
2. Explain the advantages and potential issues of each scheme
3. Assess the likelihood of each scheme satisfying the parallel trends assumption
4. Recommend the most suitable scheme and explain why

Research context:
- Policy implementation time: [time]
- Treatment areas: [area description]
- Outcome variable: [variable description]
- Data frequency: [annual/quarterly/monthly]
```

**Real Case: Minimum Wage Policy**

Using Card and Krueger's (1994) classic study as an example, we asked Claude about treatment group definition schemes for New Jersey's minimum wage increase.

Claude returned the following schemes:

| Scheme | Treatment Group Definition | Advantages | Potential Issues |
|--------|---------------------------|------------|------------------|
| A | All fast-food restaurants in New Jersey | Most intuitive, aligns with policy text | Large heterogeneity in treatment intensity |
| B | NJ restaurants with initial wages below the new minimum | Clear treatment intensity | Potential selection bias |
| C | NJ-Pennsylvania border restaurants (treatment) vs PA border restaurants (control) | Geographic proximity, strong comparability | Small sample size, spillover risk |
| D | NJ + other states that raised wages simultaneously (treatment) vs states that didn't (control) | Large sample size, high statistical power | Inconsistent treatment timing |
| E | NJ fast-food restaurants (treatment) vs PA fast-food restaurants (control), excluding border counties | Reduces spillover effects | Control group may not be representative |

Claude recommended Scheme C, reasoning: "The border county design can maximize comparability between treatment and control groups because adjacent counties' fast-food restaurants face similar labor market conditions and consumer demand shocks."

**Researcher Judgment:** Claude's suggestion makes sense, but we need to note:
- Border counties may have cross-state commuting, leading to spillover effects
- The sample size is indeed small, requiring statistical power testing
- Scheme A (full sample) should be reported as a robustness check

### Step 2: Parallel Trends Assumption Assessment

Next, we have the LLM play the role of an "econometrics reviewer," assessing the reasonableness of the parallel trends assumption.

**Prompt Template:**

```
You are an econometrics expert specializing in reviewing DID design identification assumptions.

Please assess the reasonableness of the parallel trends assumption based on the following information:

Treatment group: [description]
Control group: [description]
Outcome variable: [description]
Time span: [start year] - [end year]
Policy implementation time: [time]

Requirements:
1. List 3-5 factors that may violate parallel trends
2. For each factor, explain:
   - Why it would affect parallel trends
   - How to test whether this factor causes problems
   - If problems exist, how to correct (e.g., adding control variables, using synthetic control methods)
3. Assess overall identification strategy credibility (1-10 scale)
4. Provide improvement suggestions
```

**Claude's Assessment Example:**

For the Card and Krueger study, Claude identified the following potential threats:

**Threat 1: Region-specific time trends**
- **Problem:** New Jersey and Pennsylvania may have different economic cycles
- **Test:** Check whether employment trends were parallel in the 5 years before policy implementation
- **Correction:** Add state-time interaction fixed effects, or use interaction-weighted DID

**Threat 2: Industry-specific shocks**
- **Problem:** The fast-food industry may have experienced national shocks in 1992 (e.g., McDonald's value menu launch)
- **Test:** Compare fast-food industry trends in other states
- **Correction:** Add industry-time fixed effects

**Threat 3: Anticipation effects**
- **Problem:** Employers may adjust hiring behavior before policy implementation
- **Test:** Check employment changes between policy announcement and implementation
- **Correction:** Use event study method, treating policy announcement as event time

**Overall Credibility Score: 7/10**

Claude believes the main strengths are the geographic proximity and same industry of treatment and control groups; the main risks are small sample size and potential cross-state spillovers.

### Step 3: Spillover Effect Checking

In the third step, we have the LLM play the role of an Industrial Organization economist, analyzing possible spillover effect channels.

**Prompt Template:**

```
You are an Industrial Organization economics expert studying interactions between markets.

Please analyze potential spillover effects in the following DID design:

Treatment group: [description]
Control group: [description]
Market structure: [description, e.g., competitive/oligopoly]
Geographic scope: [description]

Requirements:
1. List all possible spillover channels:
   - Labor mobility
   - Cross-regional consumer purchasing
   - Firm relocation/entry-exit
   - Price transmission
   - Network effects
2. For each channel:
   - Explain the mechanism
   - Assess direction and magnitude of impact
   - Propose detection methods
3. If spillover effects exist, suggest correction methods:
   - Spatial DID
   - Exclude boundary samples
   - Instrumental variable method
```

**Claude's Analysis Example:**

For the New Jersey-Pennsylvania border design, Claude identified the following spillover channels:

**Channel 1: Cross-state labor commuting**
- **Mechanism:** After NJ wage increases, PA residents may commute to NJ for work
- **Impact:** PA (control group) employment may decrease, leading to underestimated treatment effects
- **Detection:** Compare employment changes in border vs. non-border counties
- **Correction:** Use commuting data to define treatment intensity, or exclude counties with convenient commuting

**Channel 2: Cross-state consumer spending**
- **Mechanism:** PA consumers may spend in NJ (if price differences are small)
- **Impact:** NJ (treatment group) sales may increase, overestimating treatment effects
- **Detection:** Analyze sales data, comparing border vs. non-border stores
- **Correction:** Exercise caution when interpreting sales as outcome variable

**Channel 3: Firm location decisions**
- **Mechanism:** New firms may prefer PA (lower costs), existing firms may relocate
- **Impact:** Long-term dynamic effects, possibly not apparent in short term
- **Detection:** Analyze firm entry and exit data
- **Correction:** Use long-term panel data, or focus on short-term static effects

### Step 4: Mechanism Analysis Design

Finally, we have the LLM help design the Mechanism Analysis.

**Prompt Template:**

```
You are a labor economics expert studying policy transmission mechanisms.

Please design a mechanism analysis scheme for the following DID study:

Research question: [description]
Main finding: [description of treatment effect size and direction]

Requirements:
1. Propose 3-5 possible mechanisms
2. For each mechanism:
   - Explain theoretical basis
   - Design empirical strategy to test this mechanism
   - State expected results (if this mechanism holds)
3. Discuss substitution or complementarity relationships between mechanisms
4. Suggest mediator or moderator variables
```

**Claude's Mechanism Analysis Example:**

For the employment effects of minimum wage increases, Claude proposed the following mechanisms:

**Mechanism 1: Increased labor supply**
- **Theory:** Higher wages attract more workers into the labor market
- **Test:** Analyze labor force participation rate changes, distinguishing intensive and extensive margins
- **Expected:** If this mechanism dominates, employment should increase but hours per worker should decrease

**Mechanism 2: Cost-push price adjustments by firms**
- **Theory:** Firms pass costs to prices, leading to decreased demand
- **Test:** Analyze price and sales changes
- **Expected:** If this mechanism dominates, prices should rise and sales should fall

**Mechanism 3: Productivity improvement**
- **Theory:** Efficiency wage effects, higher wages motivate workers to work harder
- **Test:** Analyze labor productivity (sales/employee count)
- **Expected:** If this mechanism dominates, productivity should increase

**Mechanism 4: Capital substitution for labor**
- **Theory:** Firms replace low-skill workers with automated equipment
- **Test:** Analyze capital investment, skill structure changes
- **Expected:** If this mechanism dominates, low-skill employment should decrease and capital investment should increase

## Complete Code Implementation

Below is a Python script that automates the above workflow:

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
        """Step 1: Generate treatment group definition schemes"""
        
        prompt = f"""
        You are a labor economics expert. I am studying the impact of {policy} on {outcome},
        planning to use the Difference-in-Differences (DID) method.
        
        Please help me generate 5 different treatment group definition schemes...
        
        Research context: {context}
        """
        
        response = self.client.chat.completions.create(
            model="claude-sonnet-4-20250514",
            messages=[
                {"role": "system", "content": "You are an experienced labor economics researcher."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        # Parse response, extract structured data
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
        """Step 2: Assess parallel trends assumption"""
        
        prompt = f"""
        You are an econometrics expert...
        
        Treatment group: {treatment_group}
        Control group: {control_group}
        Outcome variable: {outcome}
        Time span: {time_span}
        Policy implementation time: {policy_time}
        """
        
        response = self.client.chat.completions.create(
            model="claude-sonnet-4-20250514",
            messages=[
                {"role": "system", "content": "You are a strict econometrics reviewer."},
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
        """Step 3: Check spillover effects"""
        
        prompt = f"""
        You are an Industrial Organization economics expert...
        
        Treatment group: {treatment}
        Control group: {control}
        Market structure: {market_structure}
        Geographic scope: {geography}
        """
        
        response = self.client.chat.completions.create(
            model="claude-sonnet-4-20250514",
            messages=[
                {"role": "system", "content": "You specialize in studying interactions between markets."},
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
        """Step 4: Design mechanism analysis"""
        
        prompt = f"""
        You are a labor economics expert...
        
        Research question: {research_question}
        Main finding: {main_finding}
        """
        
        response = self.client.chat.completions.create(
            model="claude-sonnet-4-20250514",
            messages=[
                {"role": "system", "content": "You specialize in studying policy transmission mechanisms."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        return self._parse_mechanisms(response.choices[0].message.content)
    
    def run_full_pipeline(self, study_config: Dict) -> Dict:
        """Run complete workflow"""
        
        print("🚀 Launching DID Design Assistant Workflow")
        
        # Step 1
        print("\n📝 Step 1/4: Generating treatment group definition schemes...")
        treatments = self.generate_treatment_definitions(
            study_config["policy"],
            study_config["outcome"],
            study_config["context"]
        )
        print(f"   Generated {len(treatments)} schemes")
        
        # Step 2
        print("\n📊 Step 2/4: Assessing parallel trends assumption...")
        assessment = self.assess_parallel_trends(
            study_config["treatment_group"],
            study_config["control_group"],
            study_config["outcome"],
            study_config["time_span"],
            study_config["policy_time"]
        )
        print(f"   Credibility score: {assessment['score']}/10")
        
        # Step 3
        print("\n🌊 Step 3/4: Checking spillover effects...")
        spillovers = self.check_spillovers(
            study_config["treatment_group"],
            study_config["control_group"],
            study_config["market_structure"],
            study_config["geography"]
        )
        print(f"   Identified {len(spillovers)} spillover channels")
        
        # Step 4
        print("\n⚙️  Step 4/4: Designing mechanism analysis...")
        mechanisms = self.design_mechanism_analysis(
            study_config["research_question"],
            study_config["main_finding"]
        )
        print(f"   Proposed {len(mechanisms)} mechanisms")
        
        return {
            "treatments": treatments,
            "assessment": assessment,
            "spillovers": spillovers,
            "mechanisms": mechanisms
        }

# Usage example
if __name__ == "__main__":
    assistant = DIDDesignAssistant(os.environ["OPENAI_API_KEY"])
    
    config = {
        "policy": "New Jersey 1992 minimum wage increase",
        "outcome": "fast-food industry employment",
        "context": "In April 1992, New Jersey raised the minimum wage from $4.25 to $5.05...",
        "treatment_group": "New Jersey fast-food restaurants",
        "control_group": "Pennsylvania fast-food restaurants",
        "time_span": "1992-1993",
        "policy_time": "April 1992",
        "market_structure": "competitive labor market",
        "geography": "New Jersey-Pennsylvania border",
        "research_question": "Impact of minimum wage increase on fast-food employment",
        "main_finding": "Employment did not significantly decrease, may have slightly increased"
    }
    
    results = assistant.run_full_pipeline(config)
    
    # Save results
    with open("did_design_report.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("\n✅ Report saved to did_design_report.json")
```

## Practical Recommendations

### 1. The Importance of Prompt Engineering

LLM output quality heavily depends on prompt design. Recommendations:

- **Role assignment:** Clearly specify the expert role the LLM should play ("You are a labor economics expert")
- **Structured output:** Require the model to return results in specific formats (tables, ratings, priorities)
- **Iterative optimization:** Adjust prompts based on initial outputs to obtain more precise results

### 2. Best Practices for Human-AI Collaboration

LLMs are assistive tools, not replacements:

| Task | LLM Suitable | Researcher Must Do |
|------|-------------|-------------------|
| Generate treatment group schemes | ✅ Brainstorming | ✅ Final selection |
| Assess parallel trends | ✅ Identify potential threats | ✅ Empirical testing |
| Check spillover effects | ✅ Propose possible channels | ✅ Data validation |
| Design mechanism analysis | ✅ Theoretical framework | ✅ Empirical testing |
| Interpret results | ✅ Multi-angle interpretation | ✅ Final judgment |

### 3. Common Pitfalls

**Pitfall 1: Over-reliance on LLM judgment**
- LLMs may generate suggestions that seem reasonable but are actually incorrect
- Must combine with domain knowledge and data validation

**Pitfall 2: Ignoring model knowledge cutoff dates**
- Claude and GPT-4 have knowledge cutoff dates
- For latest policies or data, provide context

**Pitfall 3: Prompt leakage of sensitive information**
- Do not include unpublished research results in prompts
- Pay attention to data privacy and confidentiality requirements

## Summary

This article introduced a systematic method for leveraging LLMs to assist in DID identification strategy design. Through the four-step workflow (treatment group definition, parallel trends assessment, spillover effect checking, mechanism analysis), researchers can:

1. **Expand thinking:** Discover treatment group definitions and threat factors that traditional methods might overlook
2. **Improve efficiency:** Quickly generate multiple schemes and conduct preliminary screening
3. **Enhance rigor:** Systematically check identification assumptions, reducing omissions

**Key principle:** LLMs are "research assistants" not "research leaders." Their suggestions require rigorous empirical testing and domain expert review.

Future research directions include: extending this workflow to other causal inference methods (such as regression discontinuity, instrumental variables), developing automated prompt optimization algorithms, and establishing best practice guidelines for LLM-assisted research design.

---

**Further Reading:**

- Card, D., & Krueger, A. B. (1994). Minimum Wages and Employment: A Case Study of the Fast-Food Industry in New Jersey and Pennsylvania. *American Economic Review*, 84(4), 772-793.
- Goodman-Bacon, A. (2021). Difference-in-differences with variation in treatment timing. *Journal of Econometrics*, 225(2), 254-277.
- Callaway, B., & Sant'Anna, P. H. (2021). Difference-in-differences with multiple time periods. *Journal of Econometrics*, 225(2), 200-230.

**Tool Recommendations:**

- Claude (Anthropic): Suitable for deep reasoning and structured analysis
- GPT-4 (OpenAI): Suitable for code generation and rapid prototyping
- Perplexity: Suitable for literature search and fact-checking

---

*This article is the first in the EconAgora AI Tools series. If you have any questions or suggestions, feel free to discuss on Twitter @EconAgora.*
