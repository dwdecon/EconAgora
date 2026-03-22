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
          { label: "Community", href: "/community" },
          { label: "Modules", href: "#modules" },
          { label: "FAQ", href: "#faq" },
          {
            label: "GitHub",
            href: "https://github.com/dwdecon/EconAgora",
            external: true,
          },
        ] satisfies NavItem[],
        login: "登录",
        register: "免费加入",
        profile: "个人主页",
      },
      hero: {
        badge:
          "面向研究者的 AI 基础设施 | Prompt · Skills · Community",
        title: ["为研究者打造的", "AI+科研基础设施"],
        description:
          "把提示词模板、研究性技能、复杂插件使用与科研社区放进同一个平台，用于文献检索、代码复现、科研加速。",
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
        note: "研究者、学生、实验室与 agent builder 正在这里协作。",
        labels: [
          "Prompt Lab",
          "Replication",
          "MCP Stack",
          "Policy Notes",
          "Seminar Prep",
        ],
      },
      manifesto: {
        title: ["我们为研究设计工作流。", "我们为智能体构建基础设施。"],
        description:
          "EconAgora 把 prompt、复现流程、MCP 集成和社区讨论整合成一个连续工作台，让研究从想法、验证到产出不再散落在多个工具里。",
        metrics: [
          { value: "128+", label: "Prompt templates" },
          { value: "45+", label: "Reusable workflows" },
        ],
      },
      modules: {
        eyebrow: "Platform modules",
        title: ["EconAgora 核心模块", "围绕真实研究任务组织"],
        description:
          "直接沿用参考页的大段落节奏，但内容换成 EconAgora 当前最核心的使用场景与入口。",
        cards: [
          {
            tag: "01",
            title: "Prompt Library",
            description:
              "浏览面向文献综述、识别策略、数据分析与写作场景的提示词库。",
            href: "/prompts",
          },
          {
            tag: "02",
            title: "Community Threads",
            description:
              "在社区里分享用法、提问方法论、记录 AI 在研究流程中的真实表现。",
            href: "/community",
          },
          {
            tag: "03",
            title: "Publish A Prompt",
            description:
              "把你验证过的模板整理成可下载、可复用、可讨论的公开资源。",
            href: "/prompts/new",
          },
          {
            tag: "04",
            title: "Open A Research Thread",
            description:
              "围绕复现、课堂练习、政策备忘录或数据问题开启新的讨论串。",
            href: "/community/new",
          },
          {
            tag: "05",
            title: "Human + Agent Workflow",
            description:
              "把人工判断与 agent 执行组合起来，处理重复性研究任务与资料整理。",
            href: "/auth/register",
          },
          {
            tag: "06",
            title: "Open-source Stack",
            description:
              "查看公开仓库、跟踪迭代，或把这套平台能力改造成你的实验室基础设施。",
            href: "https://github.com/dwdecon/EconAgora",
            external: true,
          },
        ] satisfies LinkCard[],
      },
      features: {
        eyebrow: "Why EconAgora",
        title: ["为什么研究团队会从 EconAgora 开始", "而不是从零拼装工作流"],
        description:
          "我们不是再造一个聊天框，而是把研究者真正反复使用的资产、流程和协作空间组织成平台。",
        cards: [
          {
            title: "Economist-first context",
            description:
              "内容组织围绕文献阅读、研究设计、复现、课程准备和政策分析，而不是泛化的办公场景。",
          },
          {
            title: "Reusable, not disposable",
            description:
              "提示词、讨论串和工作流都被设计成可迭代资产，而不是一次性聊天记录。",
          },
          {
            title: "Human oversight, agent speed",
            description:
              "平台强调研究者判断始终在环路内，同时让 agent 负责检索、整理和重复执行。",
          },
        ],
      },
      faq: {
        eyebrow: "Support",
        title: ["常见问题", "与平台定位"],
        description:
          "如果你希望基于 EconAgora 组织课程、研究组或个人工作流，可以先从 Prompt Library 和社区开始。",
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
              "不是。Prompt 只是入口，平台更关注研究流程的重用、社区知识沉淀，以及人与 agent 的协同方式。",
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
          { label: "Community", href: "/community" },
          { label: "Modules", href: "#modules" },
          { label: "FAQ", href: "#faq" },
          {
            label: "GitHub",
            href: "https://github.com/dwdecon/EconAgora",
            external: true,
          },
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
          "Prompt Lab",
          "Replication",
          "MCP Stack",
          "Policy Notes",
          "Seminar Prep",
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
        title: ["Core EconAgora modules", "organized around actual research work"],
        description:
          "The exported landing-page architecture stays intact. The content changes to the current EconAgora entry points and research-facing use cases.",
        cards: [
          {
            tag: "01",
            title: "Prompt Library",
            description:
              "Browse prompts for literature reviews, identification strategy, data analysis, and research writing.",
            href: "/prompts",
          },
          {
            tag: "02",
            title: "Community Threads",
            description:
              "Share workflows, ask methodological questions, and document how AI performs inside real research practice.",
            href: "/community",
          },
          {
            tag: "03",
            title: "Publish A Prompt",
            description:
              "Turn validated templates into downloadable, reusable, and discussable public assets.",
            href: "/prompts/new",
          },
          {
            tag: "04",
            title: "Open A Research Thread",
            description:
              "Start a new discussion for replication, teaching, policy notes, or data-cleaning questions.",
            href: "/community/new",
          },
          {
            tag: "05",
            title: "Human + Agent Workflow",
            description:
              "Combine researcher judgment with agent execution for recurring synthesis, retrieval, and drafting tasks.",
            href: "/auth/register",
          },
          {
            tag: "06",
            title: "Open-source Stack",
            description:
              "Inspect the public repository, follow platform changes, or adapt the stack for your own lab infrastructure.",
            href: "https://github.com/dwdecon/EconAgora",
            external: true,
          },
        ] satisfies LinkCard[],
      },
      features: {
        eyebrow: "Why EconAgora",
        title: ["Why research teams start with EconAgora", "instead of assembling tools from scratch"],
        description:
          "This is not another generic AI chat surface. The platform is structured around reusable research assets, workflows, and collaboration layers.",
        cards: [
          {
            title: "Economist-first context",
            description:
              "The information architecture starts from literature review, research design, replication, teaching, and policy analysis rather than generic office tasks.",
          },
          {
            title: "Reusable, not disposable",
            description:
              "Prompts, threads, and workflow patterns are designed to become reusable assets instead of one-off chat logs.",
          },
          {
            title: "Human oversight, agent speed",
            description:
              "Researchers stay in the loop while agents handle retrieval, organization, and repetitive execution.",
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
