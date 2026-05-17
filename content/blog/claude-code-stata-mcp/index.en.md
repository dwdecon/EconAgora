---
slug: "claude-code-stata-mcp"
title: "Using Claude Code with stata-mcp for Empirical Analysis"
excerpt: "A comprehensive guide on installing and configuring stata-mcp MCP server with Claude Code for AI-assisted Stata empirical analysis workflow."
cover: "/blog-covers/2026/05/claude-code-stata-mcp.png"
category: "AI Tools"
date: "2026-05-16"
readTime: "12 min"
tags:
  - "Claude Code"
  - "Stata"
  - "MCP"
  - "Empirical Analysis"
  - "Econometrics"
author: "David Dai"
authorRole: "Economics Researcher"
issue: "Volume 2605"
illustration: "generated"
---

# Using Claude Code with stata-mcp for Empirical Analysis

## Introduction

Stata is one of the most widely used statistical software packages in economics research. However, traditional Stata workflows require researchers to manually write do-files, consult documentation, and debug code. With the advancement of AI technology, we can now connect Claude Code to Stata through the **Model Context Protocol (MCP)**, enabling AI-assisted empirical analysis workflows.

This article provides a detailed guide on:
1. Understanding MCP and its applications in economics research
2. Installing and configuring stata-mcp in Claude Code
3. Using AI assistance for data cleaning, regression analysis, and result output

## What is MCP?

**Model Context Protocol (MCP)** is an open-source standard protocol launched by Anthropic for connecting AI applications to external systems. Analogously, MCP is like a USB-C port for AI applications—it provides a standardized way for AI to connect to data sources, tools, and workflows.

For economics researchers, MCP enables:
- **Direct Stata Operation**: Execute Stata commands through natural language instructions
- **Automated Analysis**: AI can read data, run regressions, and generate graphs
- **Intelligent Documentation**: Automatically consult Stata documentation for command usage and formulas

## Prerequisites

### 1. Install Claude Code

Claude Code is Anthropic's command-line AI coding tool. Installation:

```bash
# macOS
brew install claude-code

# Or using npm
npm install -g @anthropic/claude-code
```

### 2. Verify Stata Installation

Ensure Stata is installed (Stata/BE, Stata/SE, or Stata/MP) and the `stata` command is available in your terminal.

```bash
# Test if Stata is available
stata --version
```

### 3. Install Node.js

stata-mcp requires Node.js environment:

```bash
# Check Node.js version
node --version  # Requires v18 or higher

# Install nvm (if not installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js v20
nvm install 20
nvm use 20
```

## Installing stata-mcp

### Method 1: Install via Claude Code

Claude Code supports adding local or remote MCP servers through MCP configuration files.

#### 1. Create MCP Configuration File

Create `.mcp.json` in your project root:

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

**Configuration Notes**:
- `command`: Use `npx` to run stata-mcp directly (no global installation needed)
- `STATA_PATH`: Your Stata executable path
  - macOS: `/Applications/Stata/StataMP.app/Contents/MacOS/StataMP`
  - Linux: `/usr/local/stata17/stata`
  - Windows: `C:\Program Files\Stata17\StataMP-64.exe`

#### 2. Launch Claude Code and Connect MCP

```bash
# Launch Claude Code in project directory
claude

# Claude Code will automatically read .mcp.json and connect to stata-mcp
```

### Method 2: Manual Installation

If Method 1 doesn't work, install manually:

```bash
# Install stata-mcp globally
npm install -g stata-mcp

# Verify installation
stata-mcp --version
```

Then configure in `.mcp.json`:

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

## Using Claude Code + Stata for Empirical Analysis

### Scenario 1: Data Cleaning and Descriptive Statistics

After launching Claude Code, you can interact with Stata using natural language:

**Researcher**: Load the auto.dta dataset and show descriptive statistics

**Claude Code** (via stata-mcp):
```stata
sysuse auto.dta, clear
describe
summarize
```

**Output**:
```
Variable      Obs        Mean    Std. dev.       Min        Max
────────────────────────────────────────────────────────────────
make           74
price          74    6165.257    2949.496       3291      15906
mpg            74     21.2973    5.785503         12         41
rep78          69    3.405797    .9899323          1          5
...
```

### Scenario 2: Regression Analysis

**Researcher**: Run OLS regression of price on mpg and weight with robust standard errors

**Claude Code**:
```stata
regress price mpg weight, robust
```

**Result Interpretation**:
```
Linear regression                           Number of obs =      74
                                            F(2, 71)      =   35.58
                                            Prob > F      =  0.0000
                                            R-squared     =  0.5000
                                            Root MSE      =  2416.7

──────────────────────────────────────────────────────────────────────
             |               Robust
       price | Coefficient  std. err.      t    P>|t|     [95% conf. interval]
─────────────┼────────────────────────────────────────────────────────
         mpg |  -49.51222   86.15604    -0.57   0.567    -221.3025     122.278
      weight |   1.746559   .6413538     2.72   0.008      .467736    3.025382
       _cons |   1946.069    3597.05     0.54   0.590    -5226.245    9118.382
──────────────────────────────────────────────────────────────────────
```

**Claude Code Auto-Interpretation**:
> The coefficient for weight is 1.75 and significant at the 1% level (p=0.008), indicating that each additional unit of weight increases price by approximately $1.75 on average. The mpg coefficient is not significant (p=0.567), suggesting that fuel efficiency has no significant effect on price after controlling for weight.

### Scenario 3: Advanced Econometric Analysis

**Researcher**: Use DID method to evaluate policy effects, treatment group is foreign==1, policy implementation year is 1978

**Claude Code**:
```stata
* Generate year variable (simulating panel data)
gen year = 1978 if _n <= 37
replace year = 1977 if _n > 37

* Generate treatment variable
gen treated = (foreign == 1)
gen post = (year == 1978)
gen did = treated * post

* DID regression
regress price did treated post, robust
```

**Claude Code Auto-Output**:
- Regression results table
- DID identification assumptions discussion
- Robustness check suggestions

### Scenario 4: Automated Graph Generation

**Researcher**: Plot scatter plot of price vs weight with regression line

**Claude Code**:
```stata
scatter price weight || lfit price weight, ///
    title("Relationship between Car Price and Weight") ///
    xtitle("Weight (lbs)") ///
    ytitle("Price (USD)") ///
    legend(off)
graph export price_weight.png, replace
```

## Workflow Optimization Tips

### 1. Use Claude Code's Memory Feature

Claude Code supports memory functionality to save commonly used Stata analysis templates:

```
/memory save stata-template "Standard empirical analysis workflow:
1. Data cleaning (missing values, outlier treatment)
2. Descriptive statistics
3. Correlation analysis
4. Baseline regression
5. Robustness checks
6. Heterogeneity analysis"
```

### 2. Batch Analysis

For repetitive analysis across multiple datasets, write Claude Code instructions:

```
For all .dta files in data/ directory:
1. Load data
2. Run summarize
3. Run regression y ~ x1 + x2 + controls
4. Output results to results/ directory
```

### 3. Version Control Integration

Claude Code natively supports Git for automatic analysis code version management:

```bash
# Claude Code automatically tracks do-file modifications
git add analysis.do
git commit -m "Add DID analysis"
```

## Troubleshooting

### Q1: stata-mcp Cannot Find Stata

**Solution**:
```bash
# Find Stata installation path
which stata
# Or
find / -name "stata*" -type f 2>/dev/null

# Update STATA_PATH in .mcp.json
```

### Q2: Claude Code Cannot Connect to MCP Server

**Solution**:
```bash
# Check .mcp.json syntax
npx jsonlint .mcp.json

# Restart Claude Code
claude --restart
```

### Q3: Stata Command Execution Timeout

**Solution**: Add timeout setting in `.mcp.json`:
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

Through Claude Code + stata-mcp, economics researchers can:

1. **Lower Technical Barriers**: Replace complex Stata commands with natural language
2. **Improve Efficiency**: AI automatically completes code writing, result interpretation, and documentation generation
3. **Ensure Reproducibility**: All analysis steps are automatically recorded as do-files
4. **Integrate Modern Workflows**: Seamlessly connect with Git, VS Code, and cloud storage

This AI-assisted empirical analysis model represents the future direction of economics research methodology. Researchers are encouraged to start with simple descriptive statistics and gradually explore more complex econometric analysis scenarios.

## References

- [Claude Code Official Documentation](https://docs.anthropic.com/en/docs/claude-code/overview)
- [MCP Protocol Introduction](https://modelcontextprotocol.io/introduction)
- [Stata Official Documentation](https://www.stata.com/features/documentation/)
- [stata-mcp GitHub Repository](https://github.com/mchen006/stata-mcp)
