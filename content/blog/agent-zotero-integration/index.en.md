---
slug: agent-zotero-integration
title: Connect Your Research Agent to Zotero with MCP
excerpt: A practical guide to linking Claude Code with your Zotero library through the 54yyyu/zotero-mcp server. Search items, retrieve PDFs, extract text, and generate literature matrices and review outlines without leaving the terminal.
description: Learn how to connect Claude Code to Zotero via the 54yyyu/zotero-mcp server to search your library, retrieve PDFs, extract text, and build literature matrices and review outlines.
category: AI Tools
date: '2026-05-28'
readTime: 25 min
tags:
  - AI Agent
  - Claude Code
  - Zotero
  - MCP
  - Literature Search
  - Literature Review
  - PDF Parsing
author: David
authorRole: Economics Researcher
issue: EA-2026-05-003
cover: /blog-covers/2026/05/agent-zotero-integration.png
series: ai-research-best-practices
seriesOrder: 2
status: published
---

![AI Research Best Practices series banner](/blog-covers/series-ai-research-best-practices.png)

> This is the second post in the EconAgora *AI Research Best Practices* series. The previous post is [What Is an AI Agent? Setting Up Your First Research Agent in VSCode](/blog/ai-agent-research-setup).

## What problem this solves

Most economics researchers accumulate hundreds or thousands of PDFs in Zotero: working papers, journal articles, book chapters. When it is time to write a literature review, the usual friction is the same every time:

1. You remember a keyword but cannot locate the right item.
2. After finding the item, you open the PDF manually, copy the abstract, and note the method.
3. After reading dozens of papers, your notes are scattered, and building a matrix or outline means going through everything again.

This post connects **Zotero** directly to **Claude Code** through an MCP server, so the agent can do the following inside a single conversation:

- **Search your library** by keyword, author, year, or tag.
- **Retrieve the PDF** for an item and read the full text or annotations.
- **Extract structured notes** from abstracts, methods, and conclusions.
- **Build a literature matrix and review outline** grouped by method or theme.

The whole workflow stays inside the Claude Code terminal window.

## Prerequisites

Before starting, make sure you have:

- **Zotero 7** (or 6) installed, with some items and PDF attachments already in the library.
- **Claude Code** installed and signed in (covered in the first post of this series).
- **uv**, **pipx**, or **pip** available to install the Python package.
- The path to your Zotero data directory (optional, only if you need a custom path).

Default data directories:

- Windows: `C:\Users\<username>\Zotero`
- macOS: `~/Library/Application Support/Zotero`
- Linux: `~/.zotero`

## Core steps

### 1. Install zotero-mcp-server

We will use the community-maintained [`54yyyu/zotero-mcp`](https://github.com/54yyyu/zotero-mcp) package (PyPI name: `zotero-mcp-server`). It reads from the local Zotero database and, in the default setup, does not require a Zotero API key.

Install it with `uv` (fast and isolated):

```bash
# Basic version: search, metadata, full text, annotations
uv tool install zotero-mcp-server

# Add PDF outline/table-of-contents extraction
uv tool install "zotero-mcp-server[pdf]"

# Add local semantic search
uv tool install "zotero-mcp-server[semantic]"
```

With `pipx`:

```bash
pipx install "zotero-mcp-server[pdf]"
```

After installation, check that the command is on PATH:

```bash
zotero-mcp version
```

### 2. Enable the Zotero local API

`54yyyu/zotero-mcp` reads Zotero data through the local API, so the Zotero desktop app must be running.

1. Open Zotero.
2. Go to **Edit → Preferences → Advanced → General**.
3. Check **"Enable local API server"**.
4. Restart Zotero.

> Note: because the local API reads Zotero's live data, Zotero must stay open while Claude Code queries it.

### 3. Configure the MCP server in Claude Code

Claude Code supports two ways to register an MCP server: global config (applies everywhere) or project-level `.mcp.json` (applies only to the current project).

#### Option A: command-line quick add (recommended)

Run in your terminal:

```bash
claude mcp add --env ZOTERO_LOCAL=true --transport stdio zotero -- zotero-mcp
```

If your Zotero data directory is not in the default location, add `ZOTERO_DB_PATH`:

```bash
claude mcp add \
  --env ZOTERO_LOCAL=true \
  --env ZOTERO_DB_PATH="/path/to/zotero.sqlite" \
  --transport stdio zotero -- zotero-mcp
```

#### Option B: project-level `.mcp.json`

Create `.mcp.json` in the project root:

```json
{
  "mcpServers": {
    "zotero": {
      "command": "zotero-mcp",
      "env": {
        "ZOTERO_LOCAL": "true",
        "ZOTERO_DB_PATH": "/path/to/zotero.sqlite"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Replace `ZOTERO_DB_PATH` with your actual path, or remove it if you use the default. The first time Claude Code starts in the project, it will ask you to approve the project-level MCP server; choose **Allow**.

### 4. Verify the connection

Start Claude Code and run:

```
/mcp
```

Confirm that `zotero` appears in the list and reports more than zero tools.

Then test a query:

```
How many items are in my Zotero library? Break the count down by item type: journal articles, working papers, books, and so on.
```

If the agent returns accurate counts, the MCP connection is ready.

## Reusable workflow template

Below is a four-step workflow you can copy directly into Claude Code.

### Step 1: Search the library

```
Search my Zotero library for papers related to causal inference.

Requirements:
- Match any of these keywords or phrases: "causal inference", "difference-in-differences", "instrumental variable", or "synthetic control".
- Prefer journal articles and working papers published in 2020 or later.
- For each paper, list: title, authors, year, journal or source, and whether a local PDF attachment exists.
- If there are too many results, return the top 15 most relevant items and report the total number of matches.
```

> To make the search strategy more systematic, see the EconAgora [literature-search](/skills/lingzhi227/agent-research-skills/literature-search) skill for keyword expansion, source-specific tactics, and query refinement.

### Step 2: Retrieve PDFs and extract text

After the agent returns the list, follow up with:

```
For the first 5 items from the list that have PDF attachments, do the following for each paper:

1. Retrieve the PDF full text or attachment path.
2. Extract the following sections, when available:
   - Abstract
   - First 3 pages of the introduction
   - Main method or identification-strategy paragraphs
   - Conclusion or main-findings section
3. Output a reading note for each paper in English, including:
   - Research question
   - Data source and sample
   - Identification strategy or core method
   - Main findings
   - Possible relevance to my own research
```

If some PDFs are scanned images, `zotero-mcp` may not extract text directly. Run them through an OCR tool first, such as the Zotero OCR plugin or `ocrmypdf`, then re-import them into Zotero.

### Step 3: Build a literature matrix

```
Based on the search and reading results above, create a Markdown literature matrix and save it to literature_matrix_causal_inference.md.

Columns:
| Author (Year) | Research Question | Identification Strategy / Method | Data Source / Sample | Core Finding | Relevance to My Work |

Requirements:
- Group rows by method: DID, IV, synthetic control, and other.
- Keep each cell to 2–3 sentences.
- Use "to be filled" for empty cells so I can add handwritten notes later.
```

> When organizing the matrix, combine it with the multi-angle conversation method in the [literature-review](/skills/lingzhi227/agent-research-skills/literature-review) skill, which asks the agent to review the same set of papers from the perspectives of supporting evidence, potential criticisms, and possible extensions.

### Step 4: Generate a review outline

```
Using the same set of papers, write a literature review outline and save it to literature_outline_causal_inference.md.

Outline:
1. Background and motivation
2. Methodological developments
   2.1 Recent advances in difference-in-differences
   2.2 Robustness improvements in instrumental variables
   2.3 Other identification strategies (synthetic control, RDD, etc.)
3. Empirical application areas
4. Key debates and unresolved questions
5. Implications for my next research step

Requirements:
- Under each second-level heading, list 2–4 key papers and their one-sentence contribution.
- Point out connections, agreements, or tensions between papers.
- Do not invent paper details that I did not provide.
```

> For systematic reviews or cross-database projects, follow the six-stage process in the [deep-research](/skills/lingzhi227/agent-research-skills/deep-research) skill, which splits retrieval, screening, extraction, synthesis, writing, and review into repeatable steps.

## Common errors and fixes

| Problem | Likely cause | Fix |
|---|---|---|
| `/mcp` in Claude Code does not show `zotero` | `zotero-mcp` is not on PATH | Run `which zotero-mcp` or `zotero-mcp setup-info` to get the absolute path, then replace the `command` in `.mcp.json` |
| "Zotero local API not enabled" | Local API is turned off in Zotero | Check "Enable local API server" in Zotero preferences and restart Zotero |
| Search returns no results | Zotero is closed or the library is empty | Confirm Zotero is running and contains matching items |
| PDF extraction returns nothing | PDF is a scanned image | OCR the file first, or reinstall with the `[pdf]` extra |
| Agent summary contradicts the paper | Model misread a long text | Ask the agent to quote exact passages, and manually verify key conclusions |
| Database lock or permission error | `ZOTERO_DB_PATH` is set while Zotero has the sqlite file open | Close Zotero before using path mode, or use local-API mode without `ZOTERO_DB_PATH` |

## Next steps

Once Zotero and MCP are connected, you have an agent that can read your literature. A few natural follow-ups:

1. Save this workflow to a project `CLAUDE.md` so the agent follows the same literature routine every time it enters the project.
2. Apply the same MCP pattern to connect **Stata** to Claude Code for regression workflows driven in natural language.
3. Export the literature matrix to Obsidian, Notion, or LaTeX and continue drafting the formal review.

The next post in this series covers the **Claude Code + stata-mcp** workflow for empirical analysis.

## Related Skills

- [literature-search](/skills/lingzhi227/agent-research-skills/literature-search): Systematic academic search strategies, keyword expansion, and source-specific query design.
- [literature-review](/skills/lingzhi227/agent-research-skills/literature-review): Multi-angle dialogic review for building matrices, annotating papers, and grouping themes.
- [deep-research](/skills/lingzhi227/agent-research-skills/deep-research): A six-stage systematic review process for cross-database retrieval, screening, extraction, synthesis, writing, and review.

---

**References**

- [Model Context Protocol documentation](https://modelcontextprotocol.io/)
- [54yyyu/zotero-mcp GitHub repository](https://github.com/54yyyu/zotero-mcp)
- [Zotero documentation](https://www.zotero.org/support/)
- [Claude Code MCP documentation](https://docs.anthropic.com/en/docs/claude-code/mcp)
