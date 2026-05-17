---
slug: "prompt-skill-tool-copilot"
title: "Building an Economics Research Copilot with Prompt, Skill, and Tool Layers"
excerpt: "A research copilot hits a ceiling quickly if it is treated as a chat window. A more stable design separates prompting, domain skills, and tool access into three replaceable layers."
category: "System Design"
date: "2026-02-26"
readTime: "13 min"
tags:
  - "Copilot"
  - "Prompting"
  - "Tooling"
author: "EconAgora Product Studio"
authorRole: "Agent Product Editor"
issue: "Volume 04"
illustration: "copilotLayers"
---

A copilot that actually works in economics research should not delegate every responsibility to the foundation model. It should behave more like an editorial machine with its own rules, divisions of labor, and interfaces.

## The prompt layer solves expression compression

Research questions carry a lot of contextual noise. The prompt layer is not there to be clever; it rewrites tasks into stable, reusable templates with clear boundaries.

## The skill layer stores disciplinary rules

Much of economics knowledge is not a fact list but a way of operating: how referees challenge identification, how robustness checks are sequenced, and how literature reviews are organized from a question-driven perspective. That operating logic belongs in the skill layer.

## The tool layer turns suggestions into action

If the system cannot inspect directories, call databases, generate files, or inspect logs, it remains trapped at the advice layer. Tool access lets the copilot take one step deeper into the real workspace.
