---
slug: "prompt-skill-tool-copilot"
title: "用 Prompt、Skill、Tool 三层构建经济学研究 Copilot"
excerpt: "把研究 Copilot 直接理解成一个聊天窗口会很快碰到天花板。更稳定的做法，是把提示策略、领域技能和工具接入拆成三层可替换架构。"
category: "系统设计"
date: "2026-02-26"
readTime: "13 分钟"
tags:
  - "Copilot"
  - "提示工程"
  - "工具集成"
author: "EconAgora Product Studio"
authorRole: "Agent 产品编辑"
issue: "Volume 04"
illustration: "copilotLayers"
cover: "/blog-covers/2026/05/prompt-skill-tool-copilot.png"
---

一个能在经济学场景里真正落地的 Copilot，不应该把所有责任都压给大模型本身。它更像一台编辑部机器，有自己的章法、分工和接口。

## Prompt 层解决的是表达压缩

研究者的问题往往带着大量上下文噪声。Prompt 层的任务不是炫技，而是把任务重写成稳定、可复用、边界清楚的指令模板。

## Skill 层保存学科规则

经济学研究中的很多知识不是事实清单，而是做事方式：识别策略怎样被审稿人质疑，稳健性检验如何排列，文献综述如何从问题意识出发组织。Skill 层保存的正是这套工作法。

## Tool 层把建议变成动作

如果系统不能读取目录、调用数据库、生成代码文件、检查日志，那么它再聪明也只能停留在建议层。工具接入让 Copilot 可以在真实工作台里前进一步。
