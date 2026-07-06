---
slug: ai-agent-research-setup
series: ai-research-best-practices
seriesOrder: 1
title: "What Is an AI Agent? Build Your First Research Agent with VS Code"
excerpt: "A hands-on tutorial for economics researchers: set up a local AI research agent with VS Code, Claude Code, and CC Switch, then download an NBER Working Paper and generate a structured summary end-to-end."
category: AI Tools
date: '2026-05-21'
readTime: 20 min
tags:
  - AI Agent
  - VSCode
  - Claude Code
  - CC Switch
  - Research Tools
  - Tutorial
author: David Dai
authorRole: Economics Researcher
issue: EA-2026-05-001
cover: /blog-covers/2026/05/ai-agent-research-setup-final.png
status: published
---

![AI Research Best Practices series banner](/blog-covers/series-ai-research-best-practices.png)

> This is the first post in the EconAgora *AI Research Best Practices* series.

Since 2024, AI agents have moved from a technical concept to a practical tool on researchers' desks. Unlike a single-turn ChatGPT conversation, an agent can carry out tasks continuously, call tools, read and write files, and embed itself into literature downloads, data cleaning, and empirical analysis.

This post is for economics researchers who want to get the following toolchain running:

1. **VS Code**: editor and integrated terminal environment.
2. **Claude Code**: Anthropic's official CLI agent, which can read project files and execute commands.
3. **CC Switch**: a tool for switching API providers for Claude Code and other CLI tools, so you can move between models with one click.

After the environment is ready, we will complete a first end-to-end research task: **let the agent download an NBER Working Paper and generate a structured summary**.

No heavy programming background is assumed; you only need to install software and open a terminal. If you want to turn this workflow into reusable research infrastructure, the last section points to `research-planning` and `idea-generation` Skills.

## 1. From ChatGPT to Agent: the key difference

ChatGPT is good for question-and-answer: you ask, it replies. An agent is more like a persistent assistant: you state the goal, and it plans, calls tools, reads and writes files, and adjusts when something goes wrong.

| Feature | Web chat (ChatGPT-style) | AI Agent |
|---|---|---|
| Interaction | Single or multi-turn chat | Continuous task execution |
| File handling | Manual upload/download | Reads/writes files in the workspace |
| Tool use | Limited built-ins | Can call search, code execution, databases, etc. |
| Memory | Depends on chat window | Can persist in config files and knowledge bases |
| Workflow | Ask → answer | Goal → plan → execute → reflect → adjust |

**In one sentence**: ChatGPT is an adviser; an agent is an assistant. The adviser gives recommendations; the assistant can actually do the work.

## 2. The three components of a research agent

A research-capable AI agent needs at least three parts:

```text
┌──────────────────────────────────────┐
│              AI Agent Architecture              │
├──────────────────────────────────────┤
│  1. Brain (LLM)                                │
│     - Claude / GPT-4 / DeepSeek / Kimi         │
│     - Handles reasoning, planning, decisions   │
├──────────────────────────────────────┤
│  2. Tools                                      │
│     - File read/write (fs)                     │
│     - Web search and download                  │
│     - Code execution (Bash / Python)           │
│     - Database / library interfaces (MCP)      │
├──────────────────────────────────────┤
│  3. Memory                                     │
│     - Short-term: current task context         │
│     - Long-term: CLAUDE.md, project docs, KB   │
└──────────────────────────────────────┘
```

In economics research, these map to:

- **Brain**: pick the right model for literature summaries, code generation, or causal-inference reasoning.
- **Tools**: call Python to read a CSV, Stata to run a regression, or a Zotero MCP server to search the library.
- **Memory**: use `CLAUDE.md` to store custom instructions such as "you are an economics research assistant," so every session starts with the same rules.

This post focuses on the simplest combination: Claude Code as the agent shell, VS Code as the operating environment, and CC Switch as the model-switching layer.

## 3. Environment setup

### 3.1 Install VS Code

VS Code (Visual Studio Code) is a free editor from Microsoft with a built-in terminal, which makes it easy to work alongside Claude Code.

1. Download the version for your system from <https://code.visualstudio.com/>.
2. Install and complete the initial setup.
3. Open a project folder as your workspace: **File → Open Folder...**, choose or create a directory such as `~/research-agent-demo`.

### 3.2 Install Claude Code

Claude Code is Anthropic's official command-line agent. It runs in the terminal, talks to you interactively, and can read/write files and run commands inside the workspace.

**Prerequisite**: Node.js >= 18. If you do not have it, download the LTS version from <https://nodejs.org/> or install it with your system package manager.

**Install**:

```bash
npm install -g @anthropic-ai/claude-code
```

**Verify**:

```bash
claude --version
```

If you see a version number, the installation succeeded.

### 3.3 Install and configure CC Switch

CC Switch is a cross-platform tool for switching API providers for CLI tools such as Claude Code. It lets you move quickly between Anthropic, Kimi, DeepSeek, and other providers without manually editing config files.

**System requirements**:

- Windows 10 or later
- macOS 12 (Monterey) or later
- Linux: Ubuntu 22.04+ / Debian 11+ / Fedora 34+

**Installation**:

- **Windows**: visit the [CC Switch GitHub Releases](https://github.com/farion1231/cc-switch/releases), download `CC-Switch-v{version}-Windows.msi`, and install it.
- **macOS (Homebrew recommended)**:
  ```bash
  brew tap farion1231/ccswitch
  brew install --cask cc-switch
  ```
  You can also download a `.dmg` manually.
- **Linux**: choose `.deb`, `.rpm`, or `.AppImage` for your distribution.

**Verify**: open CC Switch. If the main window shows recognized CLI tools (e.g., Claude Code) and the current provider status, it is working.

### 3.4 Get API keys and add a provider

An API key is the credential for calling a model service. How to obtain one:

- **Anthropic**: visit <https://console.anthropic.com/>, go to the API Keys page, click **Create Key**, and copy the key starting with `sk-ant-api03-`.
- **Kimi (Moonshot)**: visit <https://platform.moonshot.cn/> and create a key in the API Key management section.
- **DeepSeek**: visit <https://platform.deepseek.com/> and create a key on the API Keys page.
- **Other providers**: create keys in their respective developer consoles.

**Security note**: an API key is like a password. Do not post screenshots of it publicly, and do not commit it to Git inside code or Markdown.

Add a provider in CC Switch:

1. Open CC Switch and click **Add Provider**.
2. Choose a preset, such as "Anthropic" or "Moonshot (Kimi)."
3. Paste the API key and, if needed, the Base URL.
4. Select a default model, e.g., `claude-sonnet-4-20250514`, `kimi-latest`, or `deepseek-chat`.
5. Click **Save**.

Common Chinese-model configurations:

| Model | Provider | Base URL example | Model ID |
|---|---|---|---|
| Kimi | Moonshot | `https://api.moonshot.cn/v1` | `kimi-latest` |
| DeepSeek | DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| Qwen | Alibaba | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-max` |

**Switch provider**:

- In the CC Switch main window, select the target provider and click **Enable**.
- Or use the system-tray icon to switch providers directly; Claude Code does not need to restart.

### 3.5 Launch Claude Code inside VS Code's integrated terminal

Claude Code works best inside the VS Code integrated terminal, because it can directly reference the files you have open.

**Step 1**: open the terminal. Press `` Ctrl+` `` (backtick), or choose **Terminal → New Terminal** from the menu.

**Step 2**: start Claude Code:

```bash
claude
```

On first launch you will be prompted to log in via OAuth; follow the browser instructions.

**Step 3**: verify the connection:

```text
Please briefly introduce yourself.
```

If Claude replies, the setup is complete.

Common commands:

| Command | Purpose |
|---|---|
| `claude` | Start an interactive session |
| `claude "task description"` | Run a one-off task |
| `claude --help` | View all options |
| `/exit` or `Ctrl+D` | Exit Claude Code |

Troubleshooting:

| Issue | Fix |
|---|---|
| API Key invalid | Check that the key was copied fully, with no extra spaces |
| Rate limit exceeded | Wait one minute, upgrade your account, or switch provider |
| No reply or timeout | Check your network and try switching provider in CC Switch |
| Claude Code won't start | Confirm Node.js >= 18 and reinstall if necessary |

## 4. First research task: download an NBER Working Paper and summarize it

### 4.1 Task goal

Have the agent do the following automatically:

1. Fetch the metadata of NBER Working Paper 31952.
2. Extract title, authors, publication date, abstract, and keywords.
3. Translate the abstract into Chinese.
4. Write a ~200-word summary explaining the research question, method, and main findings.
5. Save everything to `paper_summary.md`.

> Note: full NBER working papers usually require a subscription or purchase, but title, authors, and abstract metadata are generally public. This task uses public information; if the page requires login, the agent will fall back to web search.

### 4.2 Grant tool permissions

By default Claude Code can only read and write files in the current workspace. To download web content, it needs network access; to run commands, it needs command execution permission.

1. Start Claude Code.
2. Type `/permissions` to see current permissions.
3. Enable:
   - ✅ Files (read/write)
   - ✅ Web / Fetch
   - ✅ Bash (it will ask for confirmation before each command)

**Safety note**: after Bash is enabled, Claude Code asks for approval before running each command. Review every command before confirming.

### 4.3 Write the task prompt

Enter the following prompt in Claude Code. A specific goal and clear output format reduce the chance of the agent going off track.

```text
Please help me complete the following research task:

1. Visit the NBER website and fetch the public metadata for Working Paper 31952 (URL: https://www.nber.org/papers/w31952).
2. If you cannot access the page directly, use web search to find the paper's title, authors, and abstract.
3. Extract:
   - Title
   - Authors
   - Publication date
   - English abstract
   - Keywords, if available
4. Translate the English abstract into Chinese.
5. Write a ~200-word Chinese summary explaining the research question, identification strategy or method, and main findings.
6. Save all of this to a file named "paper_summary.md" in the current workspace.

Requirements:
- Use UTF-8 encoding.
- Use Markdown format.
- If any item is missing, mark it as "[to verify]".
- Do not invent information that is not explicitly present on the page.
```

### 4.4 Watch the agent execute

After you enter the prompt, Claude Code will display a typical agent loop:

**Step 1: Plan**

The agent breaks the task down:

```text
I will proceed as follows:
1. Try to access the NBER page for paper metadata
2. If access is restricted, switch to web search
3. Extract title, authors, date, abstract, keywords
4. Translate the abstract and write a Chinese summary
5. Save as a Markdown file
```

**Step 2: Execute**

The agent calls a browser or search tool to access the page and scrape visible text.

**Step 3: Reflect and adjust**

If the NBER page requires a subscription, the agent changes strategy:

```text
The NBER page requires a subscription for the full abstract. I will switch to Google Scholar / Semantic Scholar.
```

**Step 4: Complete and save**

Finally, the agent creates `paper_summary.md` with a structure like this:

```markdown
# NBER Working Paper 31952 Summary

## Basic information
- **Title**: The Impact of AI on Scientific Discovery
- **Authors**: Aidan T. Thompson, et al.
- **Date**: 2023-10
- **NBER number**: w31952

## English abstract
[Original abstract]

## Chinese abstract
[Chinese translation]

## Summary
This paper studies the impact of artificial intelligence on scientific discovery. The authors use... [~200 words]

## Keywords
AI, Scientific Discovery, Innovation, Productivity
```

### 4.5 Check the result and verify manually

1. Find `paper_summary.md` in the VS Code Explorer.
2. Open it and check that title, authors, date, and abstract are complete.
3. Spot-check key facts against the NBER page or Google Scholar in a browser.
4. If anything is missing, continue the conversation, for example:
   - "Please add the research method section."
   - "Please translate the keywords into Chinese."
   - "Please add an evaluation of the paper's contribution to the summary."

**Key principle**: agent-generated content always needs human verification, especially when used for writing papers or policy analysis.

## 5. What an agent can and cannot do

Before using an agent in daily work, be clear about its capabilities and limits.

### 5.1 What it can do

| Capability | Example |
|---|---|
| File operations | Read/write local files, create folders, batch rename |
| Web access | Search the web, download public PDFs, call open APIs |
| Code execution | Run Python / R / Stata code, install dependencies |
| Data analysis | Read CSV, generate charts, compute statistics |
| Text processing | Translate, summarize, format, generate Markdown |

### 5.2 What it cannot do

| Limit | Explanation |
|---|---|
| Cannot bypass paywalls | JSTOR, ScienceDirect, full NBER papers need institutional access |
| Cannot operate GUI apps | Stata GUI, Excel, Adobe Reader |
| Cannot handle huge files | PDFs or datasets over ~100 MB may time out |
| Cannot guarantee 100% accuracy | Models may hallucinate or misread web content |

### 5.3 Risks and responsibilities

- **Hallucination risk**: agents may generate plausible-sounding but non-existent citations or data. Anything used in papers, reports, or policy recommendations must be source-checked.
- **Privacy risk**: do not upload de-identified microdata or unpublished drafts to public model services.
- **Cost risk**: agent sessions consume API tokens. Test on small samples before running batch jobs.

## 6. Best practices and advanced configuration

### 6.1 Save custom instructions in CLAUDE.md

If you want the agent to follow economics-research norms every time it starts, create a `CLAUDE.md` in the project root:

```text
You are an economics research assistant. Follow these rules when completing tasks:

1. Prefer academic sources (NBER, arXiv, SSRN, Google Scholar).
2. When citing, provide author, year, title, and working-paper number if available.
3. For data analysis, default to Python (pandas, matplotlib, statsmodels); use Stata when needed.
4. Save results as Markdown, with standard Markdown tables.
5. Mark uncertain information as "[to verify]".
6. Ask for my approval before executing commands, unless they are read-only.
```

Claude Code automatically reads `CLAUDE.md` in the current workspace. If you do literature reviews often, combine this file with the templates in the `research-planning` Skill to create a consistent research-startup routine.

### 6.2 Install common tools

To let the agent handle more complex research tasks, prepare a Python environment in the workspace:

```bash
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install pandas requests beautifulsoup4 PyPDF2
```

Then you can say:

```text
Please read data.csv with Python, compute descriptive statistics for the main variables, and save them to summary_stats.md.
```

### 6.3 Typical scenarios for switching models with CC Switch

Different models excel at different tasks, and CC Switch lets you match the tool to the task:

| Scenario | Recommended provider | Reason |
|---|---|---|
| Chinese documents and polishing | Kimi | Strong Chinese comprehension and long-context handling |
| Stata / Python code generation | DeepSeek | Stable code generation in Chinese contexts |
| Complex reasoning and identification strategy | Anthropic Claude | Strong academic reasoning and structured output |

To switch, just enable the target provider in CC Switch; the next message in Claude Code will use the new model without restarting the terminal.

### 6.4 Save the workspace configuration

To make it easy to resume later, save the current VS Code setup as a workspace file:

1. In VS Code: **File → Save Workspace As...**.
2. Name it `ResearchAgent.code-workspace`.
3. Save it in the project folder.

Double-clicking that file later restores the full window layout, terminal history, and project files.

## 7. Summary and next steps

This post covered:

1. **The core idea of an AI agent**: the evolution from ChatGPT to agents, and the three components of brain, tools, and memory.
2. **Environment setup**: installing VS Code, Claude Code, and CC Switch; logging in and switching providers.
3. **Hands-on task**: automatically downloading and summarizing an NBER Working Paper into a structured summary.
4. **Capability boundaries**: agents can handle public web pages, files, and code, but cannot bypass paywalls, operate GUI apps, or replace human verification.
5. **Advanced configuration**: custom instructions via `CLAUDE.md`, Python toolchain setup, and model switching by scenario.

**Next**:

In the next post we connect the agent to a literature library and learn how to use **Zotero + MCP** to:

- Search local Zotero collections automatically
- Batch-inspect PDFs and extract key sections
- Generate a preliminary literature-review outline

## Related Skills

If you want to turn this workflow into reusable research infrastructure, see these two Skills in our Claude Code project:

- [/skills/lingzhi227/agent-research-skills/research-planning](/skills/lingzhi227/agent-research-skills/research-planning): research planning and task-decomposition templates, useful for expanding "download → read → summarize" into a systematic literature-review workflow.
- [/skills/lingzhi227/agent-research-skills/idea-generation](/skills/lingzhi227/agent-research-skills/idea-generation): distill research questions and hypotheses from existing summaries and notes, useful after literature summaries are complete.

---

**Further reading**:

- CC Switch GitHub repository: <https://github.com/farion1231/cc-switch>
- Claude Code official documentation: <https://docs.anthropic.com/en/docs/claude-code/overview>
- Model Context Protocol: <https://modelcontextprotocol.io/>
- Anthropic API documentation: <https://docs.anthropic.com/>

---

*This is the first post in the EconAgora *AI Research Best Practices* series. Questions and feedback are welcome on Twitter @EconAgora.*
