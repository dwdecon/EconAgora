---
slug: claude-code-stata-mcp
title: Driving Stata with Claude Code and stata-mcp
excerpt: A hands-on guide for empirical researchers who want to control Stata through natural language using Claude Code and the hanlulong/stata-mcp server. Covers data cleaning, OLS regression, difference-in-differences, and producing publication-ready figures and tables.
description: Learn how to connect Claude Code to Stata via the hanlulong/stata-mcp MCP server and run data cleaning, regression, DID, and figure/table workflows from plain English prompts.
cover: /blog-covers/2026/05/claude-code-stata-mcp.png
category: AI Tools
date: '2026-05-16'
readTime: 18 min
tags:
- Claude Code
- Stata
- MCP
- Empirical Analysis
- Econometrics
- Difference-in-Differences
author: David Dai
authorRole: Economics Researcher
issue: EA-2026-05-004
illustration: generated
series: ai-research-best-practices
seriesOrder: 3
status: published
---

![AI Research Best Practices series cover](/blog-covers/series-ai-research-best-practices.png)

# Driving Stata with Claude Code and stata-mcp

## Introduction

Most empirical economists spend much of their day inside Stata: cleaning data, running regressions, exporting tables, and refining figures. The work is rewarding, but the loop of checking syntax, scrolling through help files, and debugging do-files is slow.

This post shows how to speed up that loop by connecting **Claude Code** to Stata through the **Model Context Protocol (MCP)** and the community-built server **`hanlulong/stata-mcp`**. Once configured, you can describe what you want in plain English—"run a DID with robust standard errors and save the event-study plot"—and Claude will generate, execute, and save the corresponding Stata code. You stay in charge of the research question and identification strategy; the agent handles the mechanics.

This is the third post in the *AI Research Best Practices* series. The earlier posts covered building a tool-using research agent and connecting a Zotero library to the workflow.

## What you need

Before starting, make sure you have:

1. **Claude Code** installed and logged in (see the first post in this series).
2. **Stata 16 or later** installed (Stata/BE, Stata/SE, or Stata/MP all work).
3. **Node.js 18 or later**, because `stata-mcp` runs on Node.js:

```bash
node --version
```

If your version is too old, install Node.js 20 with `nvm`:

```bash
nvm install 20
nvm use 20
```

## What is stata-mcp?

`hanlulong/stata-mcp` is an open-source MCP server that wraps Stata's command-line interface so Claude Code can call Stata as a tool. In practice it lets you:

- Send natural-language instructions and receive runnable Stata commands.
- Execute do-files or one-off commands.
- Read Stata output back into the conversation.
- Save graphs, tables, and log files to your project folder.

The value is not that the model replaces your judgment. The value is that you can iterate faster on specification choices, robustness checks, and exploratory analysis while the full code is kept visible and reusable.

## Install and configure stata-mcp

### Step 1: locate your Stata executable

The path varies by operating system. Confirm the file exists before writing it into the config:

**macOS**
```bash
ls /Applications/Stata/StataMP.app/Contents/MacOS/StataMP
```

**Linux (Stata 17 example)**
```bash
ls /usr/local/stata17/stata
```

**Windows**
```powershell
ls "C:\Program Files\Stata17\StataMP-64.exe"
```

Use the exact path on your machine in the next step.

### Step 2: create `.mcp.json`

Create a `.mcp.json` file in your project root. The recommended setup uses `npx` so you do not need a global install:

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

- `command`: `npx` runs the package directly.
- `args`: `-y` accepts any install prompt; `stata-mcp` is the package name.
- `STATA_PATH`: the absolute path to your Stata binary.

If you prefer a global install, run:

```bash
npm install -g stata-mcp
```

Then change `.mcp.json` to:

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

### Step 3: start Claude Code and check the connection

From your project directory:

```bash
claude
```

Claude Code reads `.mcp.json` automatically and tries to connect to the Stata server. Test it with a simple prompt:

```text
Load the built-in auto.dta dataset, show the variable structure, and run descriptive statistics.
```

If the connection works, Claude will run something like:

```stata
sysuse auto.dta, clear
describe
summarize
```

## Scenario 1: data cleaning and descriptive statistics

Start with the routine but essential step of loading data, checking missing values, creating new variables, and producing grouped summary statistics.

We use Stata's built-in `auto.dta`, which contains 1978 U.S. vehicle data on price, mileage, weight, and origin.

### Prompt

```text
Load auto.dta, check variable types and missing values, drop observations where rep78 is missing, generate log price by foreign status, and report mean price, weight, and mpg by domestic versus foreign cars.
```

### Generated Stata code

```stata
sysuse auto.dta, clear
describe
misstable summarize

drop if missing(rep78)
gen ln_price = ln(price)

tabulate foreign, summarize(price weight mpg) means
```

### Output example

```text
foreign       mean(price)  mean(weight)  mean(mpg)
Domestic       6,072.423    3,317.115      19.827
Foreign        6,384.682    2,318.500      24.773
Total          6,165.257    3,016.947      21.297
```

Always inspect the sample size after dropping missing values and check that the group differences make economic sense. If you need a publication-ready table, ask Claude to export with `estout` or `outreg2` to LaTeX or Word.

## Scenario 2: OLS regression with robust standard errors

Baseline regressions in economics almost always report robust standard errors. Here is how to ask for one directly.

### Prompt

```text
Regress price on mpg, controlling for weight and foreign origin. Report robust standard errors. Then export the table to LaTeX and save it as results/table1.tex.
```

### Generated Stata code

```stata
sysuse auto.dta, clear
regress price mpg weight i.foreign, robust
```

### Output example

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

### Interpretation

- `weight` is positive and significant at the 1% level: heavier cars command higher prices, conditional on the other controls.
- `mpg` is not statistically significant once weight and origin are included.
- `foreign = Foreign` carries a large, significant premium.

For the table export, Claude will typically install `estout` if needed and write something like:

```stata
ssc install estout, replace
eststo clear
eststo: regress price mpg weight i.foreign, robust
esttab using "results/table1.tex", replace ///
    star(* 0.1 ** 0.05 *** 0.01) ///
    b(%9.3f) se(%9.3f) ///
    r2 ar2 N ///
    title("Baseline OLS Results")
```

> Confirm that any package installed by the agent comes from a trusted source such as SSC.

## Scenario 3: difference-in-differences

DID is a workhorse design for policy evaluation. Because `auto.dta` is not a panel, we construct a two-period example purely for illustration.

### Setup

- Treatment group: `foreign == 1`
- Control group: `foreign == 0`
- Pre-period: first 37 observations treated as 1977
- Post-period: remaining 37 observations treated as 1978

### Prompt

```text
Build a two-period panel from auto.dta using the first 37 observations as 1977 and the rest as 1978. Treat foreign cars as the treatment group. Estimate a DID model with robust standard errors and discuss the parallel-trends assumption.
```

### Generated Stata code

```stata
sysuse auto.dta, clear

* Construct two-period panel
gen year = 1977 if _n <= 37
replace year = 1978 if _n > 37

gen treated = (foreign == 1)
gen post = (year == 1978)
gen did = treated * post

* Basic DID regression
regress price did treated post, robust
```

### Output example

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

### Parallel trends and identification

The DID estimator relies on the parallel-trends assumption: absent treatment, the outcome would have evolved similarly in treatment and control groups. In this constructed example the year variable is artificial, so the assumption should not be taken literally. In real work, verify it with pre-period event-study estimates:

```text
If I had multi-year panel data, run an event-study DID with the period before treatment as the reference and plot 90% confidence intervals.
```

A corresponding template:

```stata
* Event-study template (requires multi-period panel data)
forvalues t = -4/4 {
    if `t' != -1 {
        gen lead_lag`t' = (relative_year == `t')
    }
}
reghdfe y lead_lag* x1 x2, absorb(id year) vce(cluster id)
coefplot, keep(lead_lag*) vertical yline(0) xline(-1) ///
    ciopts(recast(rcap)) title("Event-study: parallel-trends check")
graph export results/event_study.png, replace
```

> Real DID analysis should be grounded in the methods literature, such as Card & Krueger (1994), Goodman-Bacon (2021), and Callaway & Sant'Anna (2021). Code generation is a convenience, not a substitute for design justification.

## Scenario 4: figures and tables

Good figures need clear labels, titles, and export formats. Ask for them directly.

### Scatter plot with fitted line

**Prompt**

```text
Draw a scatter plot of price against weight with a linear fit line. Label axes clearly, title it "Car Price and Weight", and save it as results/price_weight.png.
```

**Generated Stata code**

```stata
sysuse auto.dta, clear

scatter price weight || lfit price weight, ///
    title("Car Price and Weight") ///
    xtitle("Weight (lbs)") ///
    ytitle("Price (USD)") ///
    legend(label(1 "Observations") label(2 "Linear fit") rows(1) position(6))

graph export results/price_weight.png, replace width(1200)
```

### Grouped scatter plot

**Prompt**

```text
Plot mpg against price separately for domestic and foreign cars and save the figure as results/mpg_price_by_origin.png.
```

**Generated Stata code**

```stata
sysuse auto.dta, clear

scatter price mpg, by(foreign, title("Price and MPG by Origin")) ///
    xtitle("Miles per gallon") ///
    ytitle("Price (USD)")

graph export results/mpg_price_by_origin.png, replace width(1200)
```

### Keep outputs organized

A simple project structure helps reproducibility:

```
project/
├── data/
├── do_files/
├── results/
│   ├── tables/
│   └── figures/
└── logs/
```

Ask Claude to save do-files, figures, and tables into the right folders as it works.

## A reproducible workflow

The main risk of an AI-assisted workflow is that steps disappear into the chat history. Adopt a few habits to keep your work reproducible:

1. **Ask for a complete do-file**

```text
Combine the data cleaning, regression, DID, and figure code into one do-file named do_files/main_analysis.do.
```

2. **Keep a Stata command log**

```stata
capture mkdir logs
cmdlog using "logs/analysis_log.txt", replace
```

3. **Version-control the code**

```bash
git add do_files/main_analysis.do results/
git commit -m "Add baseline regression, DID, and figures"
```

4. **Review outputs yourself**

Check sample sizes, coefficient signs, significance levels, variable definitions, and whether identification assumptions are credible. The model is fast; you are still responsible for the economics.

## Troubleshooting

### stata-mcp cannot find Stata

Find the correct path and update `STATA_PATH` in `.mcp.json`:

```bash
which stata
find / -name "stata*" -type f 2>/dev/null
```

Then restart Claude Code.

### Claude Code does not call the Stata tool

1. Validate `.mcp.json` syntax.
2. Confirm `npx` can launch the package:

```bash
npx -y stata-mcp --version
```

3. Restart Claude Code:

```bash
claude --restart
```

### Stata commands time out

Add a timeout in milliseconds to `.mcp.json`:

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

## Conclusion

Claude Code plus `hanlulong/stata-mcp` turns Stata into a tool that an agent can call from natural-language instructions. For empirical researchers, this means less time searching for syntax and more time thinking through specification, identification, and interpretation.

The workflow is most useful when you:

- start with simple tasks and grow to more complex designs;
- always ask for and review the full generated code;
- save outputs into a reproducible project structure;
- and remain responsible for the economic reasoning behind every coefficient.

If you are building reusable Stata workflows, the [`/skills/dylantmoore/stata-skill/stata`](/skills/dylantmoore/stata-skill/stata) skill contains command templates and analysis snippets that fit naturally alongside this setup. For broader data-cleaning and exploratory-analysis routines, the [`/skills/lingzhi227/agent-research-skills/data-analysis`](/skills/lingzhi227/agent-research-skills/data-analysis) skill pairs well with the Stata MCP server.

## References

- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code/overview)
- [Model Context Protocol documentation](https://modelcontextprotocol.io/introduction)
- [hanlulong/stata-mcp GitHub repository](https://github.com/hanlulong/stata-mcp)
- [Stata documentation](https://www.stata.com/features/documentation/)
- Angrist, J. D., & Pischke, J. S. (2009). *Mostly Harmless Econometrics*. Princeton University Press.

## Related Skills

- [`/skills/dylantmoore/stata-skill/stata`](/skills/dylantmoore/stata-skill/stata): reusable Stata command templates and analysis snippets for Claude Code.
- [`/skills/lingzhi227/agent-research-skills/data-analysis`](/skills/lingzhi227/agent-research-skills/data-analysis): data cleaning, exploratory analysis, and visualization routines that complement the Stata MCP server.
