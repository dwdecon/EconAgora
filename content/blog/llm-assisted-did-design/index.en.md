---
slug: llm-assisted-did-design
title: Designing a Credible Difference-in-Differences Study with Claude
excerpt: A hands-on guide to using Claude as a research-design partner for DiD studies, covering treatment-group definition, parallel-trends reasoning, spillover and anticipation checks, mechanism analysis, and robustness planning.
description: Use Claude as a thinking partner to design credible difference-in-differences studies. Covers treatment groups, parallel trends, spillovers, mechanisms, and robustness checks.
category: Causal Inference
date: '2026-05-14'
readTime: 18 min
tags:
- DID
- Causal Inference
- LLM
- Claude
- Parallel Trends
- Spillover Effects
- Mechanism Analysis
- Robustness
- Tutorial
author: David Dai
authorRole: Economics Researcher
issue: EA-2026-05-002
cover: /blog-covers/2026/05/llm-assisted-did-design.svg
series: paper-projects
seriesOrder: 1
status: published
---

![Paper Projects series](/blog-covers/series-paper-projects.png)

## Introduction

Difference-in-differences (DiD) is one of the workhorse tools of empirical economics. Its appeal is simple: if treated and control units would have followed similar trends in the absence of treatment, the control group's post-period change provides a credible counterfactual for the treated group. Under that parallel-trends assumption, the DiD estimator recovers an average treatment effect on the treated.

But parallel trends cannot be tested directly. Decisions about how to define the treatment group, which units belong in the control group, whether agents anticipated the policy, how spillovers propagate across markets, and which mechanisms could explain the result all rest on the researcher's judgment. Missing one plausible threat can unravel an otherwise clean identification strategy.

This post treats Claude as a **research-design partner**: the researcher frames the question and makes the final calls, while Claude helps generate candidate designs, systematize threats, and produce falsifiable predictions. By the end, you should be able to:

1. Generate and evaluate multiple treatment-group definitions using structured prompts.
2. Move beyond visual pre-trend checks toward an explicit threat-list plus falsifiable parallel-trends argument.
3. Check for spillovers and anticipation effects, then adjust the sample or model accordingly.
4. Decompose treatment effects into theoretically grounded mechanisms.
5. Write a reproducible and defensible robustness plan before running the main regression.

If you are starting from a vague research idea and want to sketch the overall paper structure first, use [research-planning](/skills/lingzhi227/agent-research-skills/research-planning) to outline the project before diving into the DiD details below.

## Prerequisites

- Access to Claude through the Anthropic web interface, API, or Claude Code.
- A clearly stated research question, a policy shock or event, and an outcome variable.
- A rough sense of your panel structure: units, time frequency, treatment status, and time span.
- Familiarity with DiD basics: two-way fixed effects (TWFE), event-study specifications, and the parallel-trends assumption.

## Workflow overview

The design process has five steps. Each step assigns Claude a different role and a corresponding prompt:

| Step | Claude's role | Core task |
|------|---------------|-----------|
| 1 | Research-design consultant | Generate and evaluate treatment-group definitions |
| 2 | Econometrics referee | Argue for parallel trends and list threats |
| 3 | Industrial-organization economist | Check spillovers and anticipation effects |
| 4 | Mechanism analyst | Propose mechanisms and testable predictions |
| 5 | Robustness referee | Build a pre-analysis checklist and pre-registration plan |

The following sections expand each step. Every section includes a prompt you can copy and adapt.

## Step 1: Treatment-group definition — do not let "by state" be the only option

How you define treatment determines the starting point of the identification argument. The most obvious definition often comes from the policy text, but it is rarely the only credible one. Claude's value here is to generate alternative definitions quickly and spell out their trade-offs.

### 1.1 Prompt template

```
You are a labor economist or public economist who understands DiD identification logic.

I am studying the effect of {policy name} on {outcome variable}.
Policy effective date: {YYYY-MM}.
Available panel data: {unit, e.g., firm, county, individual}, {frequency}, {time span}.

Please do the following:
1. Propose 5 different treatment-group definitions. Each should rest on a distinct identification logic (e.g., directly affected vs. unaffected, treatment intensity, geographic proximity, industry exposure, early vs. late adopters).
2. For each definition, explain:
   - The rule that separates treated and control units.
   - Its advantages and potential problems.
   - The likelihood that parallel trends holds (high / medium / low), with reasoning.
   - Whether it is suitable as the main specification or as a robustness check.
3. Recommend a main definition and state which alternative should be used first if the parallel-trends assumption is challenged.

Output the results as a table.
```

### 1.2 Example: New Jersey's 1992 minimum-wage increase

Using Card and Krueger's (1994) classic study as a running example, Claude might return something like:

| Scheme | Treatment definition | Identification logic | Advantages | Potential problems | Parallel-trends likelihood |
|--------|---------------------|----------------------|------------|-------------------|---------------------------|
| A | All fast-food restaurants in New Jersey | Maps directly onto the policy text | Most transparent; matches the policy narrative | Large heterogeneity in treatment intensity | Medium |
| B | NJ restaurants whose initial wage was below the new minimum | Clear treatment intensity | More homogeneous treatment effect | Possible pre-treatment selection | Medium-low |
| C | NJ border-county restaurants vs. PA border-county restaurants | Geographic proximity, strong comparability | Treated and control units face similar local shocks | Small sample; cross-border commuting creates spillovers | High |
| D | Multiple states that raised wages simultaneously vs. states that did not | Larger sample, more statistical power | Higher power | Heterogeneous treatment timing | Medium |
| E | All NJ fast-food restaurants vs. all PA fast-food restaurants, excluding border counties | Reduces spatial spillovers | Cleaner control group | Control group may be less representative | Medium |

**Researcher's call:** Scheme C is usually the main story because it compresses state-level business-cycle differences. Schemes A and E should appear as robustness checks to show that the result is not driven by sample selection.

### 1.3 A note on staggered adoption

If the policy rolls out across regions at different times, treatment timing becomes part of the definition. Goodman-Bacon (2021) shows that TWFE DiD decomposes into comparisons between pairs of treatment cohorts, and already-treated units can receive negative weights. Callaway and Sant'Anna (2021) provide alternative estimators that compute group-time average treatment effects. When you ask Claude to think through a staggered design, add:

- Which units were treated early? Do you expect their treatment effects to differ from late adopters?
- Are there never-treated or last-treated units that can serve as a clean control group?
- Should you report event-study coefficients by cohort rather than a single TWFE coefficient?

## Step 2: Parallel-trends reasoning — from graphs to threat lists

An event-study plot tells you only whether pre-treatment trends look parallel. It does not tell you why they might diverge, nor which unobserved time-varying confounders could invalidate the design. Parallel trends therefore needs a **structured identification argument**, not just a visual check.

Claude's role is to help you list the threats, propose tests, and suggest fixes.

### 2.1 Prompt template

```
You are a strict econometrics referee reviewing a DiD identification strategy.

Study setup:
- Treatment group: {description}
- Control group: {description}
- Outcome variable: {variable}
- Policy implementation date: {YYYY-MM}
- Time span: {start} to {end}
- Frequency: {annual / quarterly / monthly}

Please do the following:
1. List 5-7 factors that could violate parallel trends. For each factor, explain:
   - The mechanism through which it biases the estimator.
   - How to test whether it is a problem in the data.
   - How to correct for it in the model or sample if the threat is real.
2. Recommend an event-study specification, including:
   - The reference period.
   - Whether to include relative time period -1.
   - How to handle anticipation effects.
   - How to report coefficients and confidence intervals.
3. Rate the overall credibility of the identification strategy on a 1-10 scale and give 3 concrete improvements.

Output each threat as "mechanism / test / correction."
```

### 2.2 Common threats and responses

For a Card-and-Krueger-style NJ-PA design, Claude would typically flag:

1. **Region-specific shocks.** New Jersey and Pennsylvania may experience different business cycles.
   - *Test:* Compare employment trends in the five years before the policy; add state-by-time fixed effects.
   - *Correction:* Interaction-weighted DiD or synthetic control.

2. **Industry-specific shocks.** The fast-food industry may have experienced a national shock in 1992.
   - *Test:* Compare fast-food trends in other states.
   - *Correction:* Add industry-by-time fixed effects; use additional unaffected industries as controls.

3. **Anticipation effects.** Employers may adjust hiring before the policy takes effect.
   - *Test:* Include lead coefficients in the event study.
   - *Correction:* Use the policy announcement date as the event time, or drop the period between announcement and implementation.

4. **Selection into treatment.** Counties that raised the minimum wage may differ systematically from those that did not.
   - *Test:* Check covariate balance between treated and control units before treatment.
   - *Correction:* Add covariates, matching, or reweighting.

5. **Measurement error in the outcome.** Employment may be measured differently in the two states.
   - *Test:* Check data sources and variable definitions; use alternative outcome measures.
   - *Correction:* Report robustness using different employment concepts.

**Key principle:** Parallel-trends reasoning should be falsifiable. Claude can list the threats, but you must eliminate them with data and literature, not with model output.

## Step 3: Spillovers and anticipation — SUTVA is not free

DiD requires that treatment status of one unit does not affect the outcome of another unit (no spillovers) and that control units do not change behavior before treatment because they expect it (no anticipation). These assumptions fail easily when policies have broad geographic reach, blurred boundaries, or fast information diffusion.

### 3.1 Prompt template

```
You are an industrial-organization economist who studies interactions across markets, regions, or individuals.

Study setup:
- Treatment group: {description}
- Control group: {description}
- Market structure: {competitive / oligopoly / etc.}
- Geographic scope: {state / county / city / border}
- Was the policy announced before it took effect? {yes / no; if yes, how far in advance?}

Please do the following:
1. List all plausible spillover channels: labor mobility, cross-border consumer purchases, firm relocation or entry/exit, input-output linkages, price pass-through, information or network effects, etc.
2. For each channel, explain:
   - The mechanism and expected direction of bias.
   - Observable traces it would leave in the data.
   - How to detect it (spatial DiD, dropping boundary observations, instrumental variables, etc.).
3. List possible anticipation effects and how to test for them using event-study leads.
4. If spillovers or anticipation are severe, suggest sample restrictions or model adjustments.

Output as a "channel / mechanism / trace / detection / correction" table.
```

### 3.2 Detecting and correcting spillovers

For the minimum-wage example, the main spillover channels are:

| Channel | Mechanism | Trace in the data | Detection | Correction |
|---------|-----------|-------------------|-----------|------------|
| Cross-state commuting | Higher NJ wages attract PA workers | Employment falls in PA border counties | Compare border vs. non-border counties | Exclude counties with easy commuting; define treatment intensity by commuting flows |
| Cross-border consumer spending | PA consumers shop in NJ | Sales rise in NJ border counties | Compare sales changes | Interpret sales results cautiously; control for sales where appropriate |
| Firm location / entry-exit | Firms move to lower-cost control areas | More PA entry and more NJ exit | Use firm entry/exit panels | Focus on short-run static effects; model long-run dynamics separately |
| Price pass-through | Higher costs raise product prices | NJ fast-food prices rise relative to PA | Use price panels | Control for prices; use real wages |

### 3.3 Handling anticipation effects

Anticipation contaminates the pre-treatment counterfactual because control units may already be adjusting before the policy takes effect. Detection is straightforward:

- Include lead coefficients in the event study.
- If the leads are statistically different from zero, anticipation is present.
- Re-estimate using the **policy announcement date** as the event time, or drop the period between announcement and implementation and treat it as an adjustment window.

## Step 4: Mechanism analysis — from "significant" to "why significant"

Mechanism analysis should not be an after-the-fact story. You should articulate theoretically interpretable and empirically testable mechanisms before estimating the main effect. Claude can help you break mechanisms into competing hypotheses and design the corresponding empirical tests.

### 4.1 Prompt template

```
You are a labor economist or public economist studying policy transmission mechanisms.

Research question: {question}
Main finding to explain: {direction and magnitude of the treatment effect}
Available variables: {list}

Please do the following:
1. Propose 4-6 possible mechanisms. For each mechanism, explain:
   - The theoretical basis, with classic references or reasoning.
   - An empirical strategy to test it (regression specification, subsample, interaction, mediator, etc.).
   - What you should observe in the data if the mechanism is active.
   - What you should observe if the mechanism is not active.
2. Discuss whether the mechanisms are substitutes, complements, or simultaneously valid.
3. Recommend 2-3 mechanisms to test first and explain why.
4. Suggest mediator or moderator variables and where they belong in the regression.

Output each mechanism as "theory / test / prediction / priority."
```

### 4.2 Possible mechanisms for the minimum-wage employment effect

For the finding that fast-food employment in New Jersey did not fall after the minimum-wage increase, Claude might propose:

1. **Labor-supply expansion.** Higher wages draw more workers into the market.
   - *Test:* Labor-force participation, job applications.
   - *Prediction:* Employment stays flat or rises; hours per worker may fall.

2. **Cost pass-through.** Firms raise prices, so demand declines are offset.
   - *Test:* Price and sales changes.
   - *Prediction:* Prices rise; sales fall only modestly.

3. **Efficiency-wage effect.** Higher wages motivate workers and reduce turnover.
   - *Test:* Sales per worker, separation rates.
   - *Prediction:* Productivity rises; turnover falls.

4. **Capital-labor substitution.** Firms replace low-skill workers with automation.
   - *Test:* Capital investment, skill mix.
   - *Prediction:* Low-skill employment falls; capital spending rises in the long run.

5. **Market concentration and bargaining power.** Large firms absorb the shock; small firms exit.
   - *Test:* Heterogeneity by firm size; concentration changes.
   - *Prediction:* Employment stable at large firms, declining at small firms.

**Researcher's call:** Mechanism analysis fails when "anything is possible." After Claude generates the list, prioritize 2-3 mechanisms based on theoretical importance and data availability. If a mechanism cannot be falsified, do not include it in the paper.

## Step 5: Robustness planning — write the checklist before the regression

Robustness checks should not be patches applied after the main regression. They should be planned during the design stage. Claude can generate an actionable checklist so you do not forget key checks.

### 5.1 Prompt template

```
You are a strict empirical referee reviewing the robustness of a DiD study.

Study setup: {brief description}
Main regression model: {e.g., TWFE, Callaway-Sant'Anna, stacked DiD}
Treatment-group definition: {scheme}

Please do the following:
1. Generate a checklist of at least 8 robustness checks covering:
   - Alternative treatment-group definitions.
   - Alternative control-group definitions.
   - Changes to the time window (shorter / longer, dropping periods around the policy).
   - Sample restrictions (outliers, border counties, specific industries).
   - Covariate and fixed-effect specifications.
   - Clustering level for standard errors.
   - Placebo and permutation tests.
   - Alternative estimators under heterogeneous treatment timing.
2. For each check, state:
   - Its purpose.
   - The exact operation.
   - The passing criterion (what result supports the main conclusion).
3. Indicate which checks must be completed before the main regression and which can be added afterward.
4. Recommend the core items for a pre-analysis plan.

Output as a checklist.
```

### 5.2 Example robustness checklist

| # | Check | Operation | Passing criterion |
|---|-------|-----------|-------------------|
| 1 | Alternative treatment definitions | Re-run using schemes B, C, and D | Coefficient sign and significance align with the main result |
| 2 | Alternative control groups | Use full-state samples, non-border counties, or synthetic control | Baseline result holds |
| 3 | Time window | Extend or shorten the window by two years on each side | Result does not depend on window choice |
| 4 | Drop border counties | Exclude observations within 50 km of the treated-control boundary | Coefficient is stable |
| 5 | Covariate specification | Add unit-specific trends interacted with baseline characteristics | Main coefficient is stable |
| 6 | Standard-error clustering | Cluster at county and state levels; use Conley spatial standard errors | Inference is unchanged |
| 7 | Placebo test | Randomly assign treatment status 500 times | Placebo coefficients cluster around zero |
| 8 | Alternative estimator | Callaway-Sant'Anna or stacked DiD | Direction matches TWFE |

## A reproducible workflow: wire Claude into code

The following Python script uses the official Anthropic SDK to automate the five-step workflow. Replace the study details and prompts with your own.

```python
import os
from anthropic import Anthropic


class ClaudeDIDPartner:
    def __init__(self, api_key: str = None, model: str = "claude-sonnet-4-20250514"):
        self.client = Anthropic(api_key=api_key or os.environ.get("ANTHROPIC_API_KEY"))
        self.model = model

    def ask(self, system: str, prompt: str, max_tokens: int = 2500) -> str:
        message = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text

    def step1_treatment_definitions(self, policy: str, outcome: str, context: str) -> str:
        system = (
            "You are a DiD research-design consultant. Output a table comparing "
            "treatment-group definitions and their implications for parallel trends."
        )
        prompt = f"""I am studying the effect of {policy} on {outcome}.
Study context: {context}
Generate 5 treatment-group definitions using the Step 1 template and recommend a main definition."""
        return self.ask(system, prompt)

    def step2_parallel_trends(self, treatment: str, control: str, outcome: str,
                              time_span: str, policy_time: str) -> str:
        system = (
            "You are a strict econometrics referee. For every parallel-trends threat, "
            "you must provide a test and a correction."
        )
        prompt = f"""Treatment group: {treatment}
Control group: {control}
Outcome variable: {outcome}
Time span: {time_span}
Policy implementation date: {policy_time}
Assess parallel-trends credibility using the Step 2 template."""
        return self.ask(system, prompt)

    def step3_spillovers(self, treatment: str, control: str,
                         market: str, geography: str) -> str:
        system = (
            "You are an industrial-organization economist. Output a table with "
            "channel, mechanism, trace, detection, and correction."
        )
        prompt = f"""Treatment group: {treatment}
Control group: {control}
Market structure: {market}
Geographic scope: {geography}
Check for spillovers and anticipation using the Step 3 template."""
        return self.ask(system, prompt)

    def step4_mechanisms(self, question: str, finding: str) -> str:
        system = (
            "You are a mechanism-analysis consultant. Each mechanism must include "
            "theoretical grounding, an empirical test, and a falsifiable prediction."
        )
        prompt = f"""Research question: {question}
Main finding: {finding}
Design mechanism analysis using the Step 4 template."""
        return self.ask(system, prompt)

    def step5_robustness(self, design: str, model: str, treatment_def: str) -> str:
        system = (
            "You are a strict empirical referee. Generate an actionable robustness checklist."
        )
        prompt = f"""Study setup: {design}
Main regression model: {model}
Treatment-group definition: {treatment_def}
Generate a robustness checklist and pre-analysis plan using the Step 5 template."""
        return self.ask(system, prompt)

    def run_pipeline(self, config: dict, output_path: str = "did_design_memo.md"):
        sections = [
            ("Step 1: Treatment-group definitions",
             self.step1_treatment_definitions(config["policy"], config["outcome"], config["context"])),
            ("Step 2: Parallel-trends reasoning",
             self.step2_parallel_trends(config["treatment"], config["control"], config["outcome"],
                                        config["time_span"], config["policy_time"])),
            ("Step 3: Spillovers and anticipation",
             self.step3_spillovers(config["treatment"], config["control"],
                                   config["market"], config["geography"])),
            ("Step 4: Mechanism analysis",
             self.step4_mechanisms(config["question"], config["finding"])),
            ("Step 5: Robustness planning",
             self.step5_robustness(config["design"], config["model"], config["treatment"])),
        ]
        with open(output_path, "w", encoding="utf-8") as f:
            for title, content in sections:
                f.write(f"## {title}\n\n{content}\n\n")
        print(f"Design memo saved to {output_path}")


if __name__ == "__main__":
    partner = ClaudeDIDPartner()
    config = {
        "policy": "New Jersey's 1992 minimum-wage increase",
        "outcome": "fast-food employment",
        "context": (
            "In April 1992 New Jersey raised its minimum wage from $4.25 to $5.05. "
            "Data are a panel of fast-food restaurants in New Jersey and Pennsylvania in 1992-1993."
        ),
        "treatment": "Fast-food restaurants in New Jersey",
        "control": "Fast-food restaurants in Pennsylvania",
        "time_span": "1992-1993",
        "policy_time": "1992-04",
        "market": "Competitive labor market",
        "geography": "New Jersey-Pennsylvania border",
        "question": "Effect of a minimum-wage increase on fast-food employment",
        "finding": "Employment did not fall significantly and may have risen slightly",
        "design": "New Jersey-Pennsylvania border-county DiD",
        "model": "Two-way fixed effects event study",
    }
    partner.run_pipeline(config)
```

The script writes a `did_design_memo.md` file. Do not paste it directly into your paper. Treat it as a working document: review each item, drop unsupported threats, add empirical evidence, and only then write the identification section.

When you turn the design into polished paper prose, pair it with [econ-write](/skills/hanlulong/econ-writing-skill/econ-write) to check the structure and phrasing common in economics writing.

## Boundaries of human-AI collaboration

| Task | Claude is good for | The researcher must do |
|------|--------------------|------------------------|
| Generate treatment-group schemes | Brainstorming and listing trade-offs | Final choice and theoretical justification |
| Parallel-trends reasoning | Building a threat list and suggesting tests | Verify each threat with data and draw conclusions |
| Spillovers / anticipation | Proposing channels | Detect in the data and adjust the sample |
| Mechanism analysis | Theoretical framing and falsifiable predictions | Select priorities and run the tests |
| Robustness planning | Generating a checklist | Execute the checks and interpret the results |

**Three rules:**

1. **Do not** treat Claude's ratings or recommendations as conclusions. They reflect patterns in training data, not evidence from your sample.
2. **Do not** paste unpublished results, sensitive microdata, or confidential information into prompts.
3. **Do not** ignore knowledge cutoffs. For very recent policies, provide full context in the prompt.

## Next steps

After completing the DiD design memo, the usual next steps are:

1. Translate the treatment-group definitions and data requirements into a pre-analysis plan.
2. Implement the baseline regression and event-study plots in Stata, R, or Python.
3. Use an agent toolchain to turn the natural-language design into runnable code.

## Related Skills

- [econ-write](/skills/hanlulong/econ-writing-skill/econ-write): An economics-writing assistant that integrates more than 50 top-tier writing guides. Use it to turn your identification strategy into clean, defensible paper paragraphs.
- [research-planning](/skills/lingzhi227/agent-research-skills/research-planning): A research-planning skill that generates a paper outline, method design, and task-dependency list from a research topic. Useful for sketching the overall project before working through the DiD details.

## References

- Card, D., & Krueger, A. B. (1994). Minimum Wages and Employment: A Case Study of the Fast-Food Industry in New Jersey and Pennsylvania. *American Economic Review*, 84(4), 772-793.
- Goodman-Bacon, A. (2021). Difference-in-differences with variation in treatment timing. *Journal of Econometrics*, 225(2), 254-277.
- Callaway, B., & Sant'Anna, P. H. (2021). Difference-in-differences with multiple time periods. *Journal of Econometrics*, 225(2), 200-230.
- Angrist, J. D., & Pischke, J. S. (2009). *Mostly Harmless Econometrics*. Princeton University Press.

*This post is the first in the EconAgora Paper Projects series. Questions or suggestions? Discuss with us on X @EconAgora.*
