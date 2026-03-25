export type HomeLocale = "zh" | "en";

type NavItem = {
  label: string;
  href: string;
  external?: boolean;
};

type LinkCard = {
  title: string;
  description: string;
  href: string;
  tag: string;
  external?: boolean;
};

type ShowcaseItem = {
  title: string;
  description: string;
  tags: string[];
  href: string;
  slug: string;
  external?: boolean;
};

type ShowcaseTab = {
  key: string;
  label: string;
  items: ShowcaseItem[];
};

type FooterGroup = {
  title: string;
  items: NavItem[];
};

export function normalizeHomeLocale(locale: string): HomeLocale {
  return locale === "en" ? "en" : "zh";
}

export function localizeHref(locale: string, href: string) {
  if (href.startsWith("http")) {
    return href;
  }

  const base = `/${normalizeHomeLocale(locale)}`;

  if (href === "/") {
    return base;
  }

  if (href.startsWith("#")) {
    return `${base}${href}`;
  }

  return `${base}${href}`;
}

export function getHomeContent(locale: string) {
  const currentLocale = normalizeHomeLocale(locale);

  const content = {
    zh: {
      nav: {
        items: [
          { label: "Prompt Library", href: "/prompts" },
          { label: "Skill Hub", href: "#modules" },
          { label: "Tool Center", href: "#tools" },
          { label: "Boardcast", href: "#boardcast" },
          { label: "Community", href: "/community" },
          { label: "About", href: "#about" },
        ] satisfies NavItem[],
        login: "登录",
        register: "免费加入",
        profile: "个人主页",
      },
      hero: {
        badge:
          "面向研究者的 AI 基础设施 | Prompt · Skills · Community",
        title: ["为研究工作打造的", "AI基础设施"],
        description:
          "提示词模板、研究性技能、复杂插件与科研社区集成在一个平台，用于文献检索、代码复现、科研加速。",
        primaryCta: "浏览 EconAgora",
        secondaryCta: "加入社区",
      },
      stats: [
        { value: "128+", label: "Prompt & 模板" },
        { value: "45+", label: "工作流 & 范式" },
        { value: "30+", label: "MCP 工具集成" },
        { value: "500+", label: "研究者与构建者" },
      ],
      marquee: {
        note: "研究者、学生、实验室与 agent 正在这里协作。",
        labels: [
          "Prompt Library",
          "Community",
          "Skill Hub",
          "Tool Center",
          "Latest Broadcast",
        ],
      },
      manifesto: {
        title: ["好的生产工具，不该有门槛。", "加入正在改变学术方式的研究者社区。"],
        description:
          "EconAgora 把提示词工程、工作流范式、工具集成和社区讨论整合成一个连续工作台，让研究从想法、分析到写作不再散落在多个工具里。",
        metrics: [
          { value: "128+", label: "Prompt templates" },
          { value: "45+", label: "Reusable workflows" },
        ],
      },
      modules: {
        eyebrow: "Platform modules",
        title: ["EconAgora 核心模块", "围绕真实研究任务组织"],
        description:
          "提示词、技能、工具与社区——研究工作流的每一环都在这里。",
        cta: "查看全部内容",
        tabs: [
          {
            key: "prompts",
            label: "Prompts",
            items: [
              {
                title: "学术写作助手",
                description: "从文献综述到论文润色的完整提示词工作流",
                tags: ["Prompt Template", "Writing", "GPT-4"],
                href: "/prompts/academic-writing-assistant",
                slug: "academic-writing-assistant",
              },
              {
                title: "识别策略生成器",
                description: "基于研究问题自动推荐因果推断方法与数据需求",
                tags: ["Causal Inference", "Research Design"],
                href: "/prompts/identification-strategy-generator",
                slug: "identification-strategy-generator",
              },
              {
                title: "审稿意见回复模板",
                description: "结构化生成逐条回复，自动对照修改说明与原文差异",
                tags: ["Peer Review", "Template"],
                href: "/prompts/referee-report-reply",
                slug: "referee-report-reply",
              },
              {
                title: "实证结果解读器",
                description: "将回归表格转化为可读的经济学直觉叙述",
                tags: ["Interpretation", "Econometrics"],
                href: "/prompts/empirical-results-interpreter",
                slug: "empirical-results-interpreter",
              },
            ],
          },
          {
            key: "skills",
            label: "Skills",
            items: [
              {
                title: "文献检索工作流",
                description: "自动化文献筛选、摘要提取与引用网络分析",
                tags: ["Workflow", "Literature Review"],
                href: "/prompts/literature-search-workflow",
                slug: "literature-search-workflow",
              },
              {
                title: "数据清洗流水线",
                description: "从原始数据到分析就绪数据集的标准化处理流程",
                tags: ["Data Pipeline", "Automation"],
                href: "/prompts/data-cleaning-pipeline",
                slug: "data-cleaning-pipeline",
              },
              {
                title: "变量构造引擎",
                description: "根据研究设计自动生成交互项、滞后项与工具变量",
                tags: ["Feature Engineering", "Stata"],
                href: "/prompts/variable-construction-engine",
                slug: "variable-construction-engine",
              },
              {
                title: "稳健性检验套件",
                description: "一键运行安慰剂检验、子样本分析与替代指标验证",
                tags: ["Robustness", "Automation"],
                href: "/prompts/robustness-check-suite",
                slug: "robustness-check-suite",
              },
            ],
          },
          {
            key: "tools",
            label: "Tools",
            items: [
              {
                title: "MCP 工具集成",
                description: "连接本地文件系统、数据库与外部 API 的统一接口",
                tags: ["MCP", "Integration", "API"],
                href: "/prompts/mcp-tool-integration",
                slug: "mcp-tool-integration",
              },
              {
                title: "代码复现环境",
                description: "一键配置 Python/R 环境，复现论文中的实证结果",
                tags: ["Replication", "Python", "R"],
                href: "/prompts/code-replication-environment",
                slug: "code-replication-environment",
              },
              {
                title: "数据可视化工坊",
                description: "交互式图表生成，支持 Matplotlib、ggplot2 与 ECharts",
                tags: ["Visualization", "Charts"],
                href: "/prompts/data-visualization-workshop",
                slug: "data-visualization-workshop",
              },
              {
                title: "LaTeX 排版助手",
                description: "论文模板管理、公式渲染与参考文献自动格式化",
                tags: ["LaTeX", "Formatting"],
                href: "/prompts/latex-typesetting-assistant",
                slug: "latex-typesetting-assistant",
              },
            ],
          },
          {
            key: "community",
            label: "Community",
            items: [
              {
                title: "方法论讨论",
                description: "围绕 DID、RDD、IV 等方法展开的社区讨论与经验分享",
                tags: ["Discussion", "Methodology"],
                href: "/community/methodology-discussions",
                slug: "methodology-discussions",
              },
              {
                title: "论文复现挑战",
                description: "社区驱动的论文复现项目，协作验证研究结果",
                tags: ["Replication", "Collaboration"],
                href: "/community/paper-replication-challenges",
                slug: "paper-replication-challenges",
              },
              {
                title: "数据集共享",
                description: "社区成员整理的高质量公开数据集与使用指南",
                tags: ["Open Data", "Sharing"],
                href: "/community/dataset-sharing",
                slug: "dataset-sharing",
              },
              {
                title: "求职与学术市场",
                description: "经济学 Job Market 信息汇总、面试经验与申请材料互评",
                tags: ["Job Market", "Career"],
                href: "/community/job-market-careers",
                slug: "job-market-careers",
              },
            ],
          },
          {
            key: "broadcast",
            label: "Broadcast",
            items: [
              {
                title: "每周研究速递",
                description: "AI 辅助筛选的本周重要论文、数据集与工具更新",
                tags: ["Weekly", "Curated"],
                href: "/community/weekly-research-digest",
                slug: "weekly-research-digest",
              },
              {
                title: "平台更新日志",
                description: "新功能发布、社区里程碑与即将上线的能力预告",
                tags: ["Changelog", "Updates"],
                href: "/community/platform-changelog",
                slug: "platform-changelog",
              },
              {
                title: "领域前沿追踪",
                description: "按研究方向订阅的最新 Working Paper 与预印本推送",
                tags: ["Frontier", "Subscribe"],
                href: "/community/frontier-tracker",
                slug: "frontier-tracker",
              },
              {
                title: "方法论速成课",
                description: "社区专家录制的 10 分钟方法论讲解与代码演示",
                tags: ["Tutorial", "Video"],
                href: "/community/methods-quick-course",
                slug: "methods-quick-course",
              },
            ],
          },
        ] satisfies ShowcaseTab[],
      },
      features: {
        eyebrow: "Why EconAgora",
        title: ["为什么研究工作从EconAgora开始"],
        description:
          "我们不是再造一个聊天框，而是把研究者真正反复使用的资产、流程和协作空间组织成平台。",
        cards: [
          {
            title: "学术场景深度优化",
            description:
              "围绕文献综述、因果推断、论文写作与复现验证等真实研究任务构建，已被 500+ 研究者验证。开箱即用，无需重复造轮子。",
          },
          {
            title: "可复用的技能资产",
            description:
              "提示词模板、分析工作流与方法论范式被设计成可迭代的团队资产，而不是一次性聊天记录。用过一次的方法，下次直接复用。",
          },
          {
            title: "AI赋能的科研速度",
            description:
              "研究者的判断始终在决策环路内，agent 负责检索、整理与重复执行。你掌控方向，AI 负责加速。",
          },
        ],
      },
      testimonials: {
        title: ["深受研究人员", "信赖"],
        subtitle: "为追求效率的研究者提供 AI 驱动的提示词、工作流与协作基础设施。",
        items: [
          {
            quote:
              "用 EconAgora 的文献检索 prompt，一键搜出几十篇相关论文并自动生成摘要对比表。原来要跑三天的文献调研，现在一个下午就完成了。",
            author: "Siyuan Chen",
            role: "PhD Candidate, University of Chicago",
            initials: "SC",
            statValue: "3天→0.5天",
            statLabel: "文献调研效率",
          },
          {
            quote:
              "实证结果解读器把 Stata 输出的回归表格直接转成规范的论文叙述段落，再也不用手动复制粘贴结果了。稳健性检验套件一键跑完所有检验。",
            author: "Xiaowei Zhang",
            role: "PhD Candidate, Fudan University",
            initials: "XZ",
            statValue: "12",
            statLabel: "稳健性检验项数",
          },
          {
            quote:
              "从识别策略生成到变量构造引擎，EconAgora 帮我把研究设计阶段的工作流标准化了。团队里新来的 RA 也能快速上手。",
            author: "Dr. Ming Li",
            role: "Associate Professor, Peking University",
            initials: "DML",
            statValue: "2×",
            statLabel: "研究设计效率",
          },
          {
            quote:
              "论文复现挑战模块让我跟着社区一起复现了 Angrist & Pischke 的经典文章，在这个过程中学到的比读十篇教材还多。",
            author: "Jianguo Wang",
            role: "PhD Candidate, Renmin University",
            initials: "JW",
            statValue: "5+",
            statLabel: "已完成复现挑战",
          },
          {
            quote:
              "审稿意见回复模板太实用了，收到 R&R 后用它生成了结构化回复草稿，审稿人对我的回应质量评价很高。",
            author: "Mingyuan Li",
            role: "PhD Candidate, Columbia University",
            initials: "MYL",
            statValue: "4×",
            statLabel: "审稿回复效率",
          },
        ],
      },
      faq: {
        eyebrow: "Support",
        title: ["常见问题", "平台定位"],
        description:
          "如果你希望基于 EconAgora 组织课程，研究组或个人工作流，可以先从 Prompt Library 和社区开始。",
        action: "查看 GitHub",
        items: [
          {
            question: "EconAgora 是什么？",
            answer:
              "EconAgora 是面向经济学研究者的 AI 工作流平台，聚合 Prompt Library、社区讨论、复用模板与 agent-native 的研究基础设施思路。",
          },
          {
            question: "它适合谁使用？",
            answer:
              "适合教师、学生、研究助理、独立研究者，以及正在把 AI 引入课程、实验室或分析团队的人。",
          },
          {
            question: "我可以贡献 prompt 或工作流吗？",
            answer:
              "可以。你可以发布新的 prompt、开启社区主题、记录自己的实验结果，并把可复用方法沉淀为公共资源。",
          },
          {
            question: "EconAgora 只做提示词库吗？",
            answer:
              "不是。Prompt 只是入口，EconAgora更关注研究流程的复用、学术知识沉淀，以及人与 agent 的协同方式。",
          },
          {
            question: "平台支持哪些研究场景？",
            answer:
              "覆盖文献综述、稳健性检验、识别策略设计、复现挑战分析、审稿回复等经济学研究核心环节。",
          },
          {
            question: "如何开始使用？",
            answer:
              "注册后即可浏览和收藏 prompt 模板，加入社区讨论，或创建自己的研究工作流。",
          },
          {
            question: "如何收费？",
            answer:
              "所有用户无需付费即可使用EconAgora的绝大部分功能，部分高级功能仅对付费会员进行开放。",
          },
        ],
      },
      cta: {
        badge: "Research-ready AI platform",
        title: ["现在开始构建你的", "研究工作台"],
        accent: "免费",
        description:
          "从 prompt 模板到社区协作，再到 agent-native workflow，EconAgora 提供一套更适合经济学研究的起点。",
        primary: "免费注册",
        secondary: "浏览 Prompts",
        hint: "有想法？从 Prompt Library 开始",
      },
      footer: {
        description:
          "EconAgora 为经济学研究者提供 prompt、工作流、开放协作与 agent-native 基础设施。",
        groups: [
          {
            title: "Navigation",
            items: [
              { label: "首页", href: "/" },
              { label: "Prompt Library", href: "/prompts" },
              { label: "Community", href: "/community" },
              { label: "FAQ", href: "#faq" },
            ],
          },
          {
            title: "Platform",
            items: [
              { label: "发布 Prompt", href: "/prompts/new" },
              { label: "发起讨论", href: "/community/new" },
              { label: "免费加入", href: "/auth/register" },
            ],
          },
          {
            title: "Open Source",
            items: [
              {
                label: "GitHub Repository",
                href: "https://github.com/dwdecon/EconAgora",
                external: true,
              },
            ],
          },
        ] satisfies FooterGroup[],
        updatesTitle: "Get updates",
        updatesDescription:
          "跟踪平台迭代、功能修复和研究场景讨论，优先从 GitHub 与社区入口开始。",
        updatesPrimary: {
          label: "Open GitHub",
          href: "https://github.com/dwdecon/EconAgora",
          external: true,
        },
        updatesSecondary: {
          label: "Join Community",
          href: "/community",
        },
        legal: "© 2026 EconAgora. All rights reserved.",
      },
    },
    en: {
      nav: {
        items: [
          { label: "Prompt Library", href: "/prompts" },
          { label: "Skill Hub", href: "#modules" },
          { label: "Tool Center", href: "#tools" },
          { label: "Boardcast", href: "#boardcast" },
          { label: "Community", href: "/community" },
          { label: "About", href: "#about" },
        ] satisfies NavItem[],
        login: "Login",
        register: "Start Free",
        profile: "Profile",
      },
      hero: {
        badge:
          "AI infrastructure for researchers | Prompts · Workflows · Community",
        title: ["AI-Powered Research", "Infrastructure"],
        description:
          "Bring prompt templates, research skills, complex tool integration, and peer collaboration into one platform for literature reviews, replication, teaching prep, policy notes, and daily writing.",
        primaryCta: "Explore EconAgora",
        secondaryCta: "Join Community",
      },
      stats: [
        { value: "128+", label: "Prompt templates and research playbooks" },
        { value: "45+", label: "Reusable workflows and operating patterns" },
        { value: "30+", label: "MCP-ready tool integration ideas" },
        { value: "500+", label: "Researchers, students, and builders" },
      ],
      marquee: {
        note: "Researchers, students, labs, and agent builders collaborate here.",
        labels: [
          "Prompt Library",
          "Community",
          "Skill Hub",
          "Tool Center",
          "Latest Broadcast",
        ],
      },
      manifesto: {
        title: [
          "We design workflows for research.",
          "We build infrastructure for agents.",
        ],
        description:
          "EconAgora combines prompts, replication routines, MCP integration, and community discussion into a continuous workspace so ideas, validation, and outputs do not stay fragmented across separate tools.",
        metrics: [
          { value: "128+", label: "Prompt templates" },
          { value: "45+", label: "Reusable workflows" },
        ],
      },
      modules: {
        eyebrow: "Platform modules",
        title: ["Core platform modules", "organized around real research tasks"],
        description:
          "Prompts, skills, tools, and community — every part of the research workflow lives here.",
        cta: "View all modules",
        tabs: [
          {
            key: "prompts",
            label: "Prompts",
            items: [
              {
                title: "Academic Writing Assistant",
                description: "End-to-end prompt workflow from literature review to paper polishing",
                tags: ["Prompt Template", "Writing", "GPT-4"],
                href: "/prompts/academic-writing-assistant",
                slug: "academic-writing-assistant",
              },
              {
                title: "Identification Strategy Generator",
                description: "Auto-recommend causal inference methods and data requirements based on your research question",
                tags: ["Causal Inference", "Research Design"],
                href: "/prompts/identification-strategy-generator",
                slug: "identification-strategy-generator",
              },
              {
                title: "Referee Report Reply Template",
                description: "Generate structured point-by-point responses with tracked changes against the original",
                tags: ["Peer Review", "Template"],
                href: "/prompts/referee-report-reply",
                slug: "referee-report-reply",
              },
              {
                title: "Empirical Results Interpreter",
                description: "Turn regression tables into readable economic intuition narratives",
                tags: ["Interpretation", "Econometrics"],
                href: "/prompts/empirical-results-interpreter",
                slug: "empirical-results-interpreter",
              },
            ],
          },
          {
            key: "skills",
            label: "Skills",
            items: [
              {
                title: "Literature Search Workflow",
                description: "Automated paper screening, abstract extraction, and citation network analysis",
                tags: ["Workflow", "Literature Review"],
                href: "/prompts/literature-search-workflow",
                slug: "literature-search-workflow",
              },
              {
                title: "Data Cleaning Pipeline",
                description: "Standardized processing from raw data to analysis-ready datasets",
                tags: ["Data Pipeline", "Automation"],
                href: "/prompts/data-cleaning-pipeline",
                slug: "data-cleaning-pipeline",
              },
              {
                title: "Variable Construction Engine",
                description: "Auto-generate interaction terms, lags, and instrumental variables from your research design",
                tags: ["Feature Engineering", "Stata"],
                href: "/prompts/variable-construction-engine",
                slug: "variable-construction-engine",
              },
              {
                title: "Robustness Check Suite",
                description: "One-click placebo tests, subsample analysis, and alternative measure validation",
                tags: ["Robustness", "Automation"],
                href: "/prompts/robustness-check-suite",
                slug: "robustness-check-suite",
              },
            ],
          },
          {
            key: "tools",
            label: "Tools",
            items: [
              {
                title: "MCP Tool Integration",
                description: "Unified interface connecting local file systems, databases, and external APIs",
                tags: ["MCP", "Integration", "API"],
                href: "/prompts/mcp-tool-integration",
                slug: "mcp-tool-integration",
              },
              {
                title: "Code Replication Environment",
                description: "One-click Python/R environment setup to replicate empirical results from papers",
                tags: ["Replication", "Python", "R"],
                href: "/prompts/code-replication-environment",
                slug: "code-replication-environment",
              },
              {
                title: "Data Visualization Workshop",
                description: "Interactive chart generation with Matplotlib, ggplot2, and ECharts support",
                tags: ["Visualization", "Charts"],
                href: "/prompts/data-visualization-workshop",
                slug: "data-visualization-workshop",
              },
              {
                title: "LaTeX Typesetting Assistant",
                description: "Paper template management, formula rendering, and automated bibliography formatting",
                tags: ["LaTeX", "Formatting"],
                href: "/prompts/latex-typesetting-assistant",
                slug: "latex-typesetting-assistant",
              },
            ],
          },
          {
            key: "community",
            label: "Community",
            items: [
              {
                title: "Methodology Discussions",
                description: "Community discussions and experience sharing around DID, RDD, IV, and more",
                tags: ["Discussion", "Methodology"],
                href: "/community/methodology-discussions",
                slug: "methodology-discussions",
              },
              {
                title: "Paper Replication Challenges",
                description: "Community-driven replication projects to collaboratively verify research results",
                tags: ["Replication", "Collaboration"],
                href: "/community/paper-replication-challenges",
                slug: "paper-replication-challenges",
              },
              {
                title: "Dataset Sharing",
                description: "Curated open datasets and usage guides contributed by community members",
                tags: ["Open Data", "Sharing"],
                href: "/community/dataset-sharing",
                slug: "dataset-sharing",
              },
              {
                title: "Job Market & Careers",
                description: "Econ job market info, interview tips, and peer review of application materials",
                tags: ["Job Market", "Career"],
                href: "/community/job-market-careers",
                slug: "job-market-careers",
              },
            ],
          },
          {
            key: "broadcast",
            label: "Broadcast",
            items: [
              {
                title: "Weekly Research Digest",
                description: "AI-curated highlights of important papers, datasets, and tool updates this week",
                tags: ["Weekly", "Curated"],
                href: "/community/weekly-research-digest",
                slug: "weekly-research-digest",
              },
              {
                title: "Platform Changelog",
                description: "New feature releases, community milestones, and upcoming capability previews",
                tags: ["Changelog", "Updates"],
                href: "/community/platform-changelog",
                slug: "platform-changelog",
              },
              {
                title: "Frontier Tracker",
                description: "Subscribe to latest working papers and preprints by research field",
                tags: ["Frontier", "Subscribe"],
                href: "/community/frontier-tracker",
                slug: "frontier-tracker",
              },
              {
                title: "Methods Quick Course",
                description: "10-minute methodology explainers and code demos by community experts",
                tags: ["Tutorial", "Video"],
                href: "/community/methods-quick-course",
                slug: "methods-quick-course",
              },
            ],
          },
        ] satisfies ShowcaseTab[],
      },
      features: {
        eyebrow: "Why EconAgora",
        title: ["Why research work starts with EconAgora"],
        description:
          "This is not another generic AI chat surface. The platform is structured around reusable research assets, workflows, and collaboration layers.",
        cards: [
          {
            title: "Built for Research, Validated by 500+ Researchers",
            description:
              "Architecture centered on literature review, causal inference, paper writing, and replication workflows — not a repackaged generic office tool.",
          },
          {
            title: "Reusable Research Skill Assets",
            description:
              "Prompt templates, analytical workflows, and methodology patterns are designed as iterable team assets. Methods you use once, you reuse again.",
          },
          {
            title: "Human oversight, agent speed",
            description:
              "You stay in the decision loop while agents handle retrieval, organization, and repetitive execution. You steer, AI accelerates.",
          },
        ],
      },
      testimonials: {
        title: ["Trusted by forward-thinking", "research teams"],
        subtitle: "Empowering researchers with AI-driven prompts, workflows, and collaboration infrastructure built for scale.",
        items: [
          {
            quote:
              "With EconAgora's literature search prompts, I pull dozens of relevant papers and auto-generate a summary comparison table. A 3-day lit review now takes half a day.",
            author: "Siyuan Chen",
            role: "PhD Candidate, University of Chicago",
            initials: "SC",
            statValue: "3d→0.5d",
            statLabel: "Lit Review Speed",
          },
          {
            quote:
              "The empirical results interpreter turns Stata regression output straight into publication-ready narrative paragraphs. The robustness check suite runs every test in one click.",
            author: "Xiaowei Zhang",
            role: "PhD Candidate, Fudan University",
            initials: "XZ",
            statValue: "12",
            statLabel: "Robustness Checks",
          },
          {
            quote:
              "From identification strategy to variable construction, EconAgora standardized my entire research design workflow. Even new RAs get up to speed quickly.",
            author: "Dr. Ming Li",
            role: "Associate Professor, Peking University",
            initials: "DML",
            statValue: "2×",
            statLabel: "Research Design Speed",
          },
          {
            quote:
              "The paper replication challenge module let me replicate Angrist & Pischke's classic paper with the community. I learned more than reading ten textbooks.",
            author: "Jianguo Wang",
            role: "PhD Candidate, Renmin University",
            initials: "JW",
            statValue: "5+",
            statLabel: "Replications Completed",
          },
          {
            quote:
              "The referee report reply template is a game-changer. After getting an R&R, I generated a structured response draft that reviewers praised for its quality.",
            author: "Mingyuan Li",
            role: "PhD Candidate, Columbia University",
            initials: "MYL",
            statValue: "4×",
            statLabel: "Faster R&R Replies",
          },
        ],
      },
      faq: {
        eyebrow: "Support",
        title: ["Frequently asked questions", "and platform positioning"],
        description:
          "If you want to organize a course, research group, or individual workflow around EconAgora, start with the Prompt Library and community.",
        action: "Open GitHub",
        items: [
          {
            question: "What is EconAgora?",
            answer:
              "EconAgora is an AI workflow platform for economists that combines a prompt library, community discussion, reusable templates, and agent-native infrastructure patterns.",
          },
          {
            question: "Who is it for?",
            answer:
              "It is designed for instructors, students, research assistants, independent scholars, and teams bringing AI into courses, labs, or analytical work.",
          },
          {
            question: "Can I contribute prompts or workflows?",
            answer:
              "Yes. You can publish prompts, open community threads, document experiments, and turn validated methods into shared public resources.",
          },
          {
            question: "Is it only a prompt library?",
            answer:
              "No. Prompts are the entry point, but the platform is really about reusable research workflows, community memory, and human-agent collaboration.",
          },
          {
            question: "What research scenarios are supported?",
            answer:
              "Covers literature review, robustness checks, identification strategy design, replication challenges, and R&R response drafting for economics research.",
          },
          {
            question: "How do I get started?",
            answer:
              "After registering, you can browse and bookmark prompt templates, join community discussions, or create your own research workflows.",
          },
          {
            question: "Is it free to use?",
            answer:
              "Basic features are free. Advanced team collaboration and enterprise features will be available soon.",
          },
        ],
      },
      cta: {
        badge: "Research-ready AI platform",
        title: ["Start building your", "research workspace"],
        accent: "free",
        description:
          "From prompt templates to community collaboration and agent-native workflows, EconAgora offers a stronger starting point for economics research.",
        primary: "Create account",
        secondary: "Browse Prompts",
        hint: "Got a concept? Start with the Prompt Library.",
      },
      footer: {
        description:
          "EconAgora provides prompts, workflows, open collaboration, and agent-native infrastructure for economics research.",
        groups: [
          {
            title: "Navigation",
            items: [
              { label: "Home", href: "/" },
              { label: "Prompt Library", href: "/prompts" },
              { label: "Community", href: "/community" },
              { label: "FAQ", href: "#faq" },
            ],
          },
          {
            title: "Platform",
            items: [
              { label: "Publish Prompt", href: "/prompts/new" },
              { label: "Start Thread", href: "/community/new" },
              { label: "Create Account", href: "/auth/register" },
            ],
          },
          {
            title: "Open Source",
            items: [
              {
                label: "GitHub Repository",
                href: "https://github.com/dwdecon/EconAgora",
                external: true,
              },
            ],
          },
        ] satisfies FooterGroup[],
        updatesTitle: "Get updates",
        updatesDescription:
          "Track platform changes, bug fixes, and research-facing discussions through GitHub and the community entry points.",
        updatesPrimary: {
          label: "Open GitHub",
          href: "https://github.com/dwdecon/EconAgora",
          external: true,
        },
        updatesSecondary: {
          label: "Join Community",
          href: "/community",
        },
        legal: "© 2026 EconAgora. All rights reserved.",
      },
    },
  };

  return content[currentLocale];
}

/* ── Static article lookup ─────────────────────────────── */

import { articles } from "./articles";

export interface ShowcaseArticle {
  title: string;
  description: string;
  tags: string[];
  slug: string;
  articleContent: string;
}

/**
 * Look up a static showcase article by slug and locale.
 * Returns undefined when the slug doesn't match any showcase card
 * (i.e. it's a user-generated DB id).
 */
export function getShowcaseArticle(
  slug: string,
  locale: string,
): ShowcaseArticle | undefined {
  const loc = normalizeHomeLocale(locale);
  const html = articles[slug]?.[loc];
  if (!html) return undefined;

  // Search both locales' tabs for the matching item metadata
  const content = getHomeContent(locale);
  for (const tab of content.modules.tabs) {
    for (const item of tab.items) {
      if (item.slug === slug) {
        return {
          title: item.title,
          description: item.description,
          tags: item.tags,
          slug: item.slug,
          articleContent: html,
        };
      }
    }
  }

  return undefined;
}
