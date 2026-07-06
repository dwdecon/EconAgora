---
slug: skill-based-literature-review
series: ai-research-best-practices
seriesOrder: 6
title: "Literature Review with Claude Code Skills: From PDFs to Structured Research Assets"
excerpt: "Treat Claude Code Skills as reusable engineering components for literature review. Connect Zotero via MCP, decompose economics papers into a standardized schema, and build a traceable, horizontally comparable literature matrix."
category: AI Tools
date: '2026-07-05'
readTime: 20 min
tags:
  - Claude Code
  - Skill
  - Literature Review
  - Zotero
  - MCP
  - Research Design
  - Obsidian
author: David Dai
authorRole: Economics Researcher
issue: EA-2026-07-004
cover: /blog-covers/2026/07/skill-based-literature-review.png
status: published
---

![AI Research Best Practices series banner](/blog-covers/series-ai-research-best-practices.png)

> This is the sixth post in the EconAgora *AI Research Best Practices* series. Earlier posts covered [setting up a research agent](/blog/ai-agent-research-setup), [connecting Zotero via MCP](/blog/agent-zotero-integration), [Stata MCP for empirical analysis](/blog/claude-code-stata-mcp), [agent memory that survives semesters](/blog/agent-memory-for-semesters), and [a three-layer Prompt/Skill/Tool architecture](/blog/prompt-skill-tool-copilot).

When researchers first use large language models for literature review, they usually start with the wrong prompt: they ask the model to "write a literature review" without first decomposing each paper into searchable, comparable, and challengeable units. The result is often a smooth paragraph that mixes identification strategies, data scope, and conclusion boundaries into a single narrative fog. It feels like a synthesis; it is actually a summary without structure.

Economics research needs structure. You need to know who studies what, with which identification method, under what data conditions, and where the conclusions stop holding. Without separating these fields, downstream design, replication, and extension become impossible. This post proposes an alternative: use a **Claude Code Skill as a reusable engineering component** for literature review. On top of Zotero and MCP, decompose PDFs into a standardized schema and output a literature matrix that feeds directly into research design.

This is not asking AI to write the review for you. It asks AI to do the most mechanical and error-prone first step: extract information according to a fixed schema. The synthesis stays with the researcher.

![Literature review workflow: from Zotero PDFs to structured notes and a matrix, then to human synthesis](/blog-covers/2026/07/illustrations/workflow.svg)

*Figure 1: Workflow overview. PDFs are decomposed by a Claude Code Skill into standardized fields, producing per-paper notes and a comparison matrix; the researcher then performs synthesis and writing.*

## 1. The methodological basis of literature review

Before introducing tools, clarify what we are trying to do. Scribbr organizes literature review into five steps: search, evaluate sources, identify themes/gaps/controversies, outline structure, and write[^1]. PRISMA adds reproducible screening and reporting standards for systematic reviews[^2].

Empirical economics reviews usually sit between these two extremes: not a medical-style systematic review, and not a loose stack of abstracts. We can call it a **structured narrative review**: purposive sampling driven by the research question, but with each paper's key information presented in uniform fields and backed by a traceable evidence chain.

The method in this post serves exactly that goal. The Skill automates the repetitive, highly structured parts of source evaluation and theme identification, freeing the researcher for real synthesis and judgment.

## 2. Tool chain and prerequisites

This workflow depends on:

- **Claude Code**: a command-line agent that parses PDFs and executes Skills.
- **Zotero**: the PDF and annotation hub, organized by collections and tags, with built-in PDF reader, note templates, and back-links[^3][^4][^5].
- **Zotero MCP / JavaScript API / Web API**: gives the agent access to Zotero item metadata and local PDF paths[^6][^7].
- **Better BibTeX** (optional but recommended): generates stable citation keys so Skill output can plug into LaTeX / Markdown writing pipelines[^8].
- **Connected Papers** (optional): helps discover related papers and key nodes[^15].
- **Obsidian** (optional): serves as the project knowledge base for Skill outputs[^12].

You should already have Claude Code installed and running, the Zotero desktop client open, and Zotero MCP or the local API accessible. The first two posts in this series cover that setup.

## 3. How Claude Code Skills work

A Claude Code Skill is an Anthropic mechanism for extending agent capabilities. A Skill usually contains a `SKILL.md` file plus optional `references/`, `templates/`, and `scripts/` subdirectories[^9][^10]. When loaded, its frontmatter and instructions are injected into the current session context, and the model executes the task accordingly.

Compared with a one-shot long prompt, a Skill is:

- **Reusable**: the same Skill can be invoked across projects.
- **Version-controllable**: Skill files can be tracked in Git.
- **Parameterizable**: inputs are declared through frontmatter `arguments`.
- **Shareable**: distributable within a team or community.

For literature review, design the Skill with these principles:

- **Extraction before synthesis**: the Skill only extracts fields according to the schema; it does not write review paragraphs.
- **Structured fields before prose**: output tables and YAML frontmatter, not flowing text.
- **Traceability before fluency**: every key field must cite a page number or location.

## 4. The Paper Note Schema

This is the core of the method. For each paper we define the following fields:

| Field | Meaning | Why it matters in economics |
|---|---|---|
| `citekey` | Stable citation identifier | Aligns with Zotero / Better BibTeX |
| `title` | Paper title | Metadata |
| `authors` | Authors | Metadata |
| `year` | Publication year | Tracks evolution over time |
| `venue` | Journal or working-paper source | Initial quality screening |
| `research_question` | Research question | Anchor for organizing the review |
| `identification_strategy` | Identification strategy (DID, IV, RD, etc.) | Core for method comparison |
| `data_source` | Data source and period | External validity assessment |
| `sample` | Sample scope and selection conditions | Boundary of conclusions |
| `key_findings` | Main estimates | Needs point estimates and significance |
| `limitations` | Identification assumptions, data limits, potential bias | Evidence-strength judgment |
| `evidence_strength` | Evidence rating (e.g., A/B/C) | Weighting during synthesis |
| `page_references` | Source page numbers for key fields | Traceability |
| `zotero_link` | Local Zotero link | Quick return to original PDF |
| `tags` | Topic / method / data-type tags | Clustering and filtering later |

These fields are not arbitrary. They map to the key decision points in empirical economics research design: the research question determines which literature cluster matters; the identification strategy determines credibility; data and sample determine external validity; limitations determine whether a result can travel to your own setting.

![Paper Note Schema: decomposing a paper into standardized fields](/blog-covers/2026/07/illustrations/schema.svg)

*Figure 2: Paper Note Schema. Each paper is split into metadata, research design, evidence, and traceability fields for horizontal comparison and reuse.*

## 5. Writing the `literature-review` Skill

Create `.claude/skills/literature-review/SKILL.md` in your Claude Code project:

```yaml
---
name: literature-review
description: |
  Extract structured paper notes from a folder of PDFs according to the
  EconAgora literature-review schema. Outputs individual notes plus a
  comparison matrix. Does NOT write prose synthesis.
arguments:
  - name: topic
    description: Research topic used to scope extraction (e.g., "minimum wage employment").
  - name: pdf_folder
    description: Path to folder containing PDFs.
  - name: output_folder
    description: Path where structured notes and matrix will be written.
---

# Literature Review Skill

## Goal

Read every PDF in `pdf_folder` and produce:

1. One per-paper note in `output_folder/notes/{citekey}.md`.
2. One comparison matrix in `output_folder/matrix.md`.

## Extraction rules

- Use the schema defined in the frontmatter of each paper note (see template).
- Fill every field if possible. If a field cannot be determined from the paper,
  write `[to verify]` and, when possible, indicate the likely location (e.g.,
  "Table 1, page 12").
- For `key_findings`, include point estimates and significance levels when
  available. Do not paraphrase away numbers.
- For `limitations`, distinguish between identification assumptions and data
  limitations.
- Rate `evidence_strength` conservatively: A = credible causal evidence with
  clear identification; B = plausible but with caveats; C = descriptive or
  preliminary.
- Every claim in `key_findings` must carry a `page_references` entry.

## Output template

Each paper note must start with:

```yaml
---
citekey: ""
title: ""
authors: ""
year: ""
venue: ""
research_question: ""
identification_strategy: ""
data_source: ""
sample: ""
key_findings: ""
limitations: ""
evidence_strength: ""
page_references: ""
zotero_link: ""
tags: []
---
```

Then include a 3-5 bullet summary under `## Summary` and, if needed, a
`## Open questions` section.

## Matrix rules

The matrix must be a Markdown table with columns:
`citekey | year | identification_strategy | data_source | sample | key_findings | evidence_strength | limitations`.
Sort rows by year, then by evidence_strength descending.

## When stuck

- If a PDF is a scanned image, stop and report: ask the user to run OCR first.
- If the paper is math-heavy and extraction is unreliable, flag the note with
  `math_extraction: unreliable`.
```

The key constraint is **the Skill must not write the review on its own**. It only outputs structured data; judgment stays with the researcher.

![Skill call and output: input arguments, PDF folder, output notes and matrix](/blog-covers/2026/07/illustrations/skill-call.svg)

*Figure 3: Skill call chain. Inputs are a research topic and a PDF folder; outputs are per-paper notes and a sortable comparison matrix.*

## 6. Running example: a minimum-wage literature matrix

Suppose you are studying the causal effect of minimum wages on employment and have collected PDFs of Card and Krueger (1994) and related papers in Zotero. Run:

```bash
/literature-review "minimum wage employment" ./papers ./output/lit-review
```

The Skill outputs `matrix.md`, which might look like this (illustrative):

| citekey | year | identification_strategy | data_source | sample | key_findings | evidence_strength | limitations |
|---|---|---|---|---|---|---|---|
| cardkrueger1994 | 1994 | DID: New Jersey minimum-wage increase vs. Pennsylvania control | Fast-food phone survey, Feb-Dec 1992 | 410 fast-food restaurants in NJ and eastern PA | No significant employment decline in NJ after the wage increase; some specifications show a small increase | A- | Sample limited to fast-food industry; control group relies on geographic proximity assumption |
| neumarkwascher2000 | 2000 | DID using state-level panel data | 50 U.S. states plus D.C., 1973-1996 | Teenage labor market | Significant negative employment effect of minimum wages on teenagers | B+ | Cross-state DID may be confounded by concurrent policies and macro shocks; sensitive to model specification |
| allegrettoetal2011 | 2011 | Border discontinuity design | QCEW and CPS data, 1990-2006 | Adjacent state/county border pairs | After controlling for state fixed effects and border pairs, negative employment effects largely disappear | A- | Assumption of economic homogeneity across border pairs may fail |

The value of this table is that it is not a narrative about "whether minimum wage is good or bad." It places identification strategies, data, and conclusion boundaries side by side, so you can see at a glance where disagreements come from: different methods, different time periods, or different samples.

## 7. From matrix to review: human synthesis

![From matrix to review: cluster, identify conflicts, probe boundaries, write paragraphs with page citations](/blog-covers/2026/07/illustrations/synthesis.svg)

*Figure 4: From matrix to review. The researcher clusters by identification strategy, compares result differences, probes boundary conditions, and writes paragraphs with specific page citations.*

With the matrix, writing the review becomes a structured comparison task rather than a memory search. We recommend four steps:

**Step 1: Cluster by theme.** Group all DID studies together, all border-discontinuity studies together, and so on.

**Step 2: Identify conflicts and boundaries.** Within each cluster, compare result differences and ask: Are the data periods different? Industries different? Control variables different?

**Step 3: Write review paragraphs.** Use a template like this:

> Card and Krueger (1994) exploit New Jersey's 1992 minimum-wage increase against Pennsylvania as a control, using a difference-in-differences design, and find no significant decline in fast-food employment [p. 784]. Neumark and Wascher (2000), using state-level panel data, report a significant negative effect on teenage employment [p. xx]. Allegretto et al. (2011) show that controlling for state heterogeneity through a border-discontinuity design substantially weakens the negative estimate [p. xx]. This divergence suggests that the employment effect of minimum wages is highly sensitive to identification strategy and sample boundaries.

The key feature: every claim carries method, data, and a page reference. Readers can retrace the path.

## 8. Integrating with Obsidian / a project knowledge base

A single Skill run is only the starting point. For long-term research, adopt the `Sources/Papers → Knowledge → Writing` three-layer structure from claude-scholar[^12]:

- `Sources/Papers/`: stores per-paper notes generated by the Skill.
- `Knowledge/`: stores synthesis products such as theme clusters, method comparisons, and research-gap maps.
- `Writing/`: stores review paragraphs and outlines that actually enter the paper.

In Obsidian, you can link individual notes to synthesis notes through `[[citekey]]` references, creating a bidirectional knowledge network. Over time, the literature matrix becomes a reusable project asset.

## 9. Boundaries, limitations, and quality control

Be explicit about the limits of this method:

- **The Skill does not replace judgment.** It lowers information-organizing costs; synthesis, evaluation, and writing remain the researcher's job.
- **PDF quality caps extraction.** Scanned PDFs need OCR first; math-heavy papers may not extract reliably; complex tables require manual checking.
- **Every key field must be traceable.** If the Skill outputs `key_findings` without page numbers, ask it to add them or verify them yourself.
- **Avoid the wrong success metric.** The value of this workflow should not be measured by "hours saved." It should be measured by **cross-project reuse of paper cards**, **the rate at which identification-strategy conflicts are discovered**, and **the conversion rate from review conclusions to executable regression scripts**. These are research-process metrics, not operational metrics.

## 10. Full directory structure and Skill template

A suggested project structure:

```text
my-project/
├── .claude/
│   └── skills/
│       └── literature-review/
│           ├── SKILL.md
│           └── references/
│               └── schema.yaml
├── papers/
│   ├── cardkrueger1994.pdf
│   ├── neumarkwascher2000.pdf
│   └── allegrettoetal2011.pdf
├── notes/
│   ├── cardkrueger1994.md
│   ├── neumarkwascher2000.md
│   └── allegrettoetal2011.md
└── matrix.md
```

`references/schema.yaml` can hold the full field definitions and examples, making the schema reusable across Skills or projects.

## 11. Conclusion

The bottleneck in literature review is usually not information access but **insufficient standardization in extraction and integration**. With a Claude Code Skill, researchers can decompose economics papers into uniform fields and build a traceable, horizontally comparable literature matrix. This method does not pursue fully automated writing; it separates AI's mechanical extraction ability from the researcher's synthetic judgment, letting each do what it does best.

The next post will discuss how to extend this matrix into a paper outline and continue using Skills to manage the path from outline to draft.

## Related Skills

- [literature-search](/skills/lingzhi227/agent-research-skills/literature-search): systematic academic search strategies and keyword expansion.
- [literature-review](/skills/lingzhi227/agent-research-skills/literature-review): multi-perspective conversational literature review for matrices, annotations, and theme clustering.
- [deep-research](/skills/lingzhi227/agent-research-skills/deep-research): a six-stage systematic literature review workflow for cross-database search and strict screening.

---

## References and further reading

[^1]: McCombes, S. (2025, January 22). *How to Write a Literature Review | Guide, Examples, & Templates*. Scribbr. https://www.scribbr.com/methodology/literature-review/
[^2]: *PRISMA Statement*. https://www.prisma-statement.org/
[^3]: *Zotero Documentation*. https://www.zotero.org/support/
[^4]: *Collections and Tags | Zotero Documentation*. https://www.zotero.org/support/collections_and_tags
[^5]: *PDF Reader and Note Editor | Zotero Documentation*. https://www.zotero.org/support/pdf_reader
[^6]: *Zotero JavaScript API*. https://www.zotero.org/support/dev/client_coding/javascript_api
[^7]: *Zotero Web API v3*. https://www.zotero.org/support/dev/web_api/v3/start
[^8]: *Better BibTeX for Zotero*. https://retorque.re/zotero-better-bibtex/
[^9]: *Claude Code Skills Documentation*. https://docs.anthropic.com/en/docs/claude-code/skills
[^10]: *Claude Code Repository*. https://github.com/anthropics/claude-code
[^12]: Galaxy-Dawn. *claude-scholar*. https://github.com/Galaxy-Dawn/claude-scholar
[^15]: *Connected Papers*. https://www.connectedpapers.com/

Card, David, and Alan B. Krueger. 1994. "Minimum Wages and Employment: A Case Study of the Fast-Food Industry in New Jersey and Pennsylvania." *American Economic Review* 84 (4): 772-793. https://www.jstor.org/stable/2118030
