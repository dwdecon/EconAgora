type LocalizedText = {
  zh: string;
  en: string;
};

type RawBlogSection = {
  heading: LocalizedText;
  paragraphs: LocalizedText[];
  bullets?: LocalizedText[];
};

type RawBlogStat = {
  value: string;
  label: LocalizedText;
};

type RawBlogEntry = {
  slug: string;
  issue: string;
  illustration:
    | "reviewFlow"
    | "replicationStack"
    | "auditCompass"
    | "copilotLayers"
    | "memoryArchive";
  publishedAt: string;
  category: LocalizedText;
  title: LocalizedText;
  excerpt: LocalizedText;
  coverNote: LocalizedText;
  readTime: LocalizedText;
  tags: LocalizedText[];
  author: {
    name: string;
    role: LocalizedText;
  };
  stats: RawBlogStat[];
  shelfIndex: LocalizedText[];
  lead: LocalizedText;
  sections: RawBlogSection[];
  theme: {
    coverStart: string;
    coverEnd: string;
    spine: string;
    accent: string;
    shadow: string;
  };
  coverImage?: string;
};

export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LocalizedBlogEntry = {
  slug: string;
  issue: string;
  illustration: RawBlogEntry["illustration"];
  publishedAt: string;
  category: string;
  title: string;
  excerpt: string;
  coverNote: string;
  readTime: string;
  tags: string[];
  author: {
    name: string;
    role: string;
  };
  stats: {
    value: string;
    label: string;
  }[];
  shelfIndex: string[];
  lead: string;
  sections: BlogSection[];
  theme: RawBlogEntry["theme"];
  coverImage?: string;
};

const BLOG_ENTRIES: RawBlogEntry[] = [
  {
    slug: "from-pdf-to-panel",
    issue: "Volume 01",
    illustration: "reviewFlow",
    publishedAt: "2026-03-28",
    category: {
      zh: "研究工作流",
      en: "Research Workflow",
    },
    title: {
      zh: "从 PDF 到 Panel：经济学文献综述的四代理工作流",
      en: "From PDF to Panel: A Four-Agent Workflow for Economics Literature Reviews",
    },
    excerpt: {
      zh: "当文献综述不再只是找论文，而是把论文、识别策略、数据口径和可复现代码同时放进同一条流水线，研究效率才真正开始提升。",
      en: "A literature review becomes genuinely useful when papers, identification logic, data definitions, and reproducible code move through the same operating system.",
    },
    coverNote: {
      zh: "Editorial Shelf / Multi-Agent Review Systems",
      en: "Editorial Shelf / Multi-Agent Review Systems",
    },
    readTime: {
      zh: "12 分钟",
      en: "12 min",
    },
    tags: [
      { zh: "文献综述", en: "Literature Review" },
      { zh: "多代理", en: "Multi-Agent" },
      { zh: "工作流设计", en: "Workflow Design" },
    ],
    author: {
      name: "EconAgora Editorial Desk",
      role: {
        zh: "研究流程编辑",
        en: "Research Workflow Editor",
      },
    },
    stats: [
      { value: "4", label: { zh: "代理层", en: "Agent layers" } },
      { value: "1", label: { zh: "统一语境", en: "Shared context" } },
      { value: "0", label: { zh: "重复整理", en: "Repeated sorting" } },
    ],
    shelfIndex: [
      {
        zh: "把阅读、归档、质疑、写作拆成四个连续角色，而不是一段长提示词。",
        en: "Split reading, indexing, skepticism, and writing into four consecutive roles instead of one long prompt.",
      },
      {
        zh: "每一层都输出结构化资产，下一层只消费可验证的中间结果。",
        en: "Each layer should output structured assets so the next layer only consumes verifiable intermediate results.",
      },
      {
        zh: "评价文献综述的标准不是摘要像不像人写，而是后续回归设计能不能直接用。",
        en: "Judge a literature review by whether it feeds directly into empirical design, not by whether the summary sounds human.",
      },
    ],
    lead: {
      zh: "很多研究者把 LLM 用在文献综述上时，第一步就错了：他们要求模型直接给出“综述成稿”，却没有先把论文拆成可检索、可比较、可质疑的工作单元。",
      en: "Most literature-review workflows fail because they ask an LLM for a polished survey too early, before papers are decomposed into searchable, comparable, and challengeable units of work.",
    },
    sections: [
      {
        heading: {
          zh: "为什么大多数综述在第一轮就失真",
          en: "Why most reviews distort in the first pass",
        },
        paragraphs: [
          {
            zh: "一段对话式总结往往会把论文的识别假设、样本口径和数据限制揉在一起。你读起来像是获得了全局理解，实际上只是得到了一层模糊叙事。",
            en: "A conversational summary tends to blur together identification assumptions, sample definitions, and data limitations. It feels like a global understanding, but what you really get is a soft narrative surface.",
          },
          {
            zh: "经济学研究真正需要的是结构：谁在研究什么问题，使用什么识别方法，依赖什么数据条件，结论在哪些边界下成立。这些字段不拆开，后面就无法进入设计与复现阶段。",
            en: "Economics research needs structure: who studies which question, with what identification strategy, under which data conditions, and where the claim actually breaks. Without those fields, you cannot move into design or replication.",
          },
        ],
      },
      {
        heading: {
          zh: "四层代理如何接力",
          en: "How the four agents hand work to each other",
        },
        paragraphs: [
          {
            zh: "第一层是 Reader，只负责把论文拆成标准卡片；第二层是 Mapper，把这些卡片按主题、识别方法和数据来源挂到同一个索引里；第三层是 Skeptic，专门指出证据链断点；第四层是 Synthesizer，再基于前面三层的产出写综述。",
            en: "The Reader extracts standard cards from each paper. The Mapper hangs those cards onto a common index by topic, identification strategy, and data source. The Skeptic marks where the evidence chain is weak. Only then does the Synthesizer draft the review.",
          },
        ],
        bullets: [
          {
            zh: "Reader 输出 claim、data、method、sample 和 limitation 五个必填字段。",
            en: "The Reader outputs five required fields: claim, data, method, sample, and limitation.",
          },
          {
            zh: "Mapper 建立跨论文的对照表，而不是单篇摘要。",
            en: "The Mapper builds cross-paper comparison tables instead of isolated summaries.",
          },
          {
            zh: "Skeptic 只回答一个问题：这条结论在哪一步最脆弱。",
            en: "The Skeptic answers one question only: where is this claim most fragile.",
          },
          {
            zh: "Synthesizer 最后写成稿，因此成稿天然带证据索引。",
            en: "The Synthesizer writes last, so the final prose inherits an evidence index by design.",
          },
        ],
      },
      {
        heading: {
          zh: "应该追踪的三个运营指标",
          en: "Three operating metrics worth tracking",
        },
        paragraphs: [
          {
            zh: "不要只看节省了多少小时。更关键的是：文献卡片的复用率、识别策略冲突的发现率，以及从综述到回归脚本的转化率。",
            en: "Do not only track time saved. The real indicators are card reusability, detection of identification conflicts, and conversion from review assets into regression-ready scripts.",
          },
          {
            zh: "一旦这些指标稳定，综述就不再是一次性写作任务，而是研究组的长期资产。",
            en: "Once those metrics stabilize, the literature review stops being a one-off writing task and becomes a durable research asset for the lab.",
          },
        ],
      },
    ],
    theme: {
      coverStart: "#efe1cf",
      coverEnd: "#d6b08f",
      spine: "#9b5d34",
      accent: "#6b3d20",
      shadow: "rgba(155, 93, 52, 0.22)",
    },
  },
  {
    slug: "replication-breaks-before-regression",
    issue: "Volume 02",
    illustration: "replicationStack",
    publishedAt: "2026-03-19",
    category: {
      zh: "复现工程",
      en: "Replication Engineering",
    },
    title: {
      zh: "为什么复现往往死在回归之前",
      en: "Why Replication Usually Fails Before the First Regression",
    },
    excerpt: {
      zh: "真正拖垮复现项目的，往往不是估计量本身，而是文件命名、变量字典、版本漂移和路径管理这些被低估的工程细节。",
      en: "Replication projects are rarely destroyed by the estimator itself. They break on filenames, variable dictionaries, version drift, and path management long before estimation starts.",
    },
    coverNote: {
      zh: "Field Manual / Replication Infrastructure",
      en: "Field Manual / Replication Infrastructure",
    },
    readTime: {
      zh: "10 分钟",
      en: "10 min",
    },
    tags: [
      { zh: "论文复现", en: "Replication" },
      { zh: "数据治理", en: "Data Governance" },
      { zh: "工程规范", en: "Engineering Hygiene" },
    ],
    author: {
      name: "EconAgora Methods Desk",
      role: {
        zh: "复现方法编辑",
        en: "Replication Methods Editor",
      },
    },
    stats: [
      { value: "3", label: { zh: "高风险断点", en: "Failure points" } },
      { value: "1", label: { zh: "主仓规范", en: "Repository standard" } },
      { value: "100%", label: { zh: "路径显式化", en: "Explicit paths" } },
    ],
    shelfIndex: [
      {
        zh: "回归脚本只是最后一公里，前面的目录治理才是主战场。",
        en: "The regression script is the last mile; directory governance is the real battlefield.",
      },
      {
        zh: "任何没有变量字典和版本说明的复现项目，本质上都不可审计。",
        en: "Any replication project without a variable dictionary and version notes is effectively unauditable.",
      },
      {
        zh: "先把路径、命名、原始数据保护写进规则，再谈自动化。",
        en: "Write rules for paths, naming, and raw-data protection before you automate anything.",
      },
    ],
    lead: {
      zh: "研究者通常会把注意力集中在回归表能不能跑出来，但复现项目最常见的失败点，发生在估计量出现之前的文件组织阶段。",
      en: "Researchers focus on whether the regression table reproduces, yet the most common failure points appear much earlier in the file system and dataset preparation layers.",
    },
    sections: [
      {
        heading: {
          zh: "路径与版本漂移是最隐蔽的风险",
          en: "Path drift and version drift are the quiet killers",
        },
        paragraphs: [
          {
            zh: "一份脚本今天能跑，不代表三个月后还能跑。只要数据目录、软件版本或中间文件命名发生一次无记录的变化，后续复现者就会开始猜测。",
            en: "A script that runs today may fail three months later. One undocumented change in data location, software version, or intermediate filenames is enough to push the next replicator into guesswork.",
          },
        ],
      },
      {
        heading: {
          zh: "把复现仓库视为产品，而不是附件",
          en: "Treat the replication repository as a product, not an attachment",
        },
        paragraphs: [
          {
            zh: "一个合格的复现仓库必须解释输入、处理过程和输出之间的关系。README 要告诉别人从哪里开始，数据字典要说明变量如何生成，中间产物要明确能否删除和重建。",
            en: "A good replication repository must explain the relationship between inputs, transformations, and outputs. The README tells others where to start, the data dictionary explains variable construction, and every intermediate artifact should state whether it can be deleted and rebuilt.",
          },
        ],
        bullets: [
          {
            zh: "原始数据永远只读，清洗后的数据另存目录。",
            en: "Raw data stays read-only; cleaned data lives in a separate directory.",
          },
          {
            zh: "每个脚本只承担单一阶段责任。",
            en: "Each script owns one stage of the pipeline.",
          },
          {
            zh: "任何手动操作都要写回文档。",
            en: "Every manual step must be written back into documentation.",
          },
        ],
      },
      {
        heading: {
          zh: "让 AI 协助复现，但不要让它接管判断",
          en: "Use AI to assist replication, not to replace judgment",
        },
        paragraphs: [
          {
            zh: "LLM 很擅长整理日志、生成目录树、补齐变量说明，但它不应该替你决定两个看似相近的数据版本是否可互换。AI 适合做压缩与记录，关键边界仍需要研究者确认。",
            en: "LLMs are excellent at organizing logs, generating directory maps, and drafting variable notes, but they should not decide whether two similar-looking dataset versions are interchangeable. AI should compress and document; researchers still confirm the critical boundaries.",
          },
        ],
      },
    ],
    theme: {
      coverStart: "#e8d7c6",
      coverEnd: "#c8a88f",
      spine: "#6d5a4d",
      accent: "#4d3b30",
      shadow: "rgba(109, 90, 77, 0.2)",
    },
  },
  {
    slug: "auditing-ai-identification",
    issue: "Volume 03",
    illustration: "auditCompass",
    publishedAt: "2026-03-09",
    category: {
      zh: "因果推断",
      en: "Causal Inference",
    },
    title: {
      zh: "如何审计 AI 生成的识别策略",
      en: "How to Audit AI-Generated Identification Strategies",
    },
    excerpt: {
      zh: "LLM 可以快速提出看上去合理的识别方案，但真正的问题不在“方案能否说得通”，而在“方案是否经得起可证伪的审计”。",
      en: "LLMs can propose plausible identification strategies quickly, but the real question is not whether the plan sounds coherent. It is whether the plan survives falsifiable audit.",
    },
    coverNote: {
      zh: "Methods Ledger / Strategy Audit",
      en: "Methods Ledger / Strategy Audit",
    },
    readTime: {
      zh: "11 分钟",
      en: "11 min",
    },
    tags: [
      { zh: "识别策略", en: "Identification" },
      { zh: "审计框架", en: "Audit Framework" },
      { zh: "LLM 方法论", en: "LLM Methods" },
    ],
    author: {
      name: "EconAgora Causal Lab",
      role: {
        zh: "因果推断编辑",
        en: "Causal Inference Editor",
      },
    },
    stats: [
      { value: "5", label: { zh: "审计问题", en: "Audit questions" } },
      { value: "2", label: { zh: "替代路径", en: "Fallback paths" } },
      { value: "1", label: { zh: "核心反事实", en: "Core counterfactual" } },
    ],
    shelfIndex: [
      {
        zh: "先审计反事实，再审计模型形式。",
        en: "Audit the counterfactual before you audit the model specification.",
      },
      {
        zh: "AI 的价值在于扩展方案空间，不在于替你完成识别论证。",
        en: "AI expands the solution space; it does not finish the identification argument for you.",
      },
      {
        zh: "任何策略都必须能回答：如果假设失效，结论会在哪一步坍塌。",
        en: "Every strategy must answer where the conclusion collapses if the key assumption fails.",
      },
    ],
    lead: {
      zh: "让模型帮你生成 DID、RDD 或 IV 方案并不难，难的是把这些方案转化成一套可逐项检查的审计表。",
      en: "Generating DID, RDD, or IV ideas is easy. Turning those ideas into an auditable checklist is the hard part.",
    },
    sections: [
      {
        heading: {
          zh: "先问反事实是否存在",
          en: "First ask whether the counterfactual exists",
        },
        paragraphs: [
          {
            zh: "很多 AI 建议的问题，不在公式，而在世界本身。它默认存在一组可比较对象，却没有证明这些对象在制度、时点或选择机制上真的可比较。",
            en: "The biggest weakness in AI-generated suggestions is often not the formula but the world. The model assumes a comparable control group exists without showing that institutions, timing, or selection mechanisms actually make it comparable.",
          },
        ],
      },
      {
        heading: {
          zh: "把识别方案拆成五个审计问题",
          en: "Decompose the strategy into five audit questions",
        },
        paragraphs: [
          {
            zh: "每个 AI 方案都应该被拆成五问：处理是否可界定、对照是否可比、假设是否可检验、数据是否可支撑、结果是否可替代。只要其中一项不能回答，这个方案就不应直接进入编码阶段。",
            en: "Every AI proposal should be reduced to five questions: Is treatment definable, is the control comparable, are assumptions testable, does the data support them, and is there a plausible fallback result? If one of these stays unanswered, the strategy should not enter coding yet.",
          },
        ],
        bullets: [
          {
            zh: "要求模型明确写出最脆弱的前提，而不是最优美的叙事。",
            en: "Make the model state the most fragile premise, not just the most elegant narrative.",
          },
          {
            zh: "要求模型给出至少一个失败情境。",
            en: "Require at least one explicit failure scenario.",
          },
          {
            zh: "要求模型说明哪些变量只是“想要”，哪些变量是“必须”。",
            en: "Force the model to separate nice-to-have variables from required variables.",
          },
        ],
      },
      {
        heading: {
          zh: "人类研究者的角色没有被削弱，反而更清晰",
          en: "The human role becomes clearer, not smaller",
        },
        paragraphs: [
          {
            zh: "AI 最适合快速铺开假设空间和替代设计，人类研究者则负责压缩空间、拒绝错误路径，并把最终设计绑定到真实制度背景之上。",
            en: "AI is best at expanding the hypothesis space and proposing alternatives. Human researchers compress that space, reject invalid paths, and bind the final design to actual institutional context.",
          },
        ],
      },
    ],
    theme: {
      coverStart: "#f0dfcc",
      coverEnd: "#dfb991",
      spine: "#8e6a4f",
      accent: "#5d4330",
      shadow: "rgba(142, 106, 79, 0.24)",
    },
  },
  {
    slug: "prompt-skill-tool-copilot",
    issue: "Volume 04",
    illustration: "copilotLayers",
    publishedAt: "2026-02-26",
    category: {
      zh: "系统设计",
      en: "System Design",
    },
    title: {
      zh: "用 Prompt、Skill、Tool 三层构建经济学研究 Copilot",
      en: "Building an Economics Research Copilot with Prompt, Skill, and Tool Layers",
    },
    excerpt: {
      zh: "把研究 Copilot 直接理解成一个聊天窗口会很快碰到天花板。更稳定的做法，是把提示策略、领域技能和工具接入拆成三层可替换架构。",
      en: "A research copilot hits a ceiling quickly if it is treated as a chat window. A more stable design separates prompting, domain skills, and tool access into three replaceable layers.",
    },
    coverNote: {
      zh: "Architecture Review / Human + Agent Stack",
      en: "Architecture Review / Human + Agent Stack",
    },
    readTime: {
      zh: "13 分钟",
      en: "13 min",
    },
    tags: [
      { zh: "Copilot", en: "Copilot" },
      { zh: "提示工程", en: "Prompting" },
      { zh: "工具集成", en: "Tooling" },
    ],
    author: {
      name: "EconAgora Product Studio",
      role: {
        zh: "Agent 产品编辑",
        en: "Agent Product Editor",
      },
    },
    stats: [
      { value: "3", label: { zh: "核心层", en: "Core layers" } },
      { value: "N", label: { zh: "可插拔技能", en: "Plug-in skills" } },
      { value: "1", label: { zh: "统一操作面", en: "Operating surface" } },
    ],
    shelfIndex: [
      {
        zh: "Prompt 负责意图压缩，Skill 负责领域规则，Tool 负责可执行连接。",
        en: "Prompts compress intent, skills encode domain rules, and tools provide executable connections.",
      },
      {
        zh: "三层分离后，系统迭代不需要整体推翻。",
        en: "Once the three layers are separated, iteration no longer requires full rewrites.",
      },
      {
        zh: "研究场景里最贵的不是推理成本，而是错误自动化。",
        en: "In research workflows, the most expensive cost is not inference but incorrect automation.",
      },
    ],
    lead: {
      zh: "一个能在经济学场景里真正落地的 Copilot，不应该把所有责任都压给大模型本身。它更像一台编辑部机器，有自己的章法、分工和接口。",
      en: "A copilot that actually works in economics research should not delegate every responsibility to the foundation model. It should behave more like an editorial machine with its own rules, divisions of labor, and interfaces.",
    },
    sections: [
      {
        heading: {
          zh: "Prompt 层解决的是表达压缩",
          en: "The prompt layer solves expression compression",
        },
        paragraphs: [
          {
            zh: "研究者的问题往往带着大量上下文噪声。Prompt 层的任务不是炫技，而是把任务重写成稳定、可复用、边界清楚的指令模板。",
            en: "Research questions carry a lot of contextual noise. The prompt layer is not there to be clever; it rewrites tasks into stable, reusable templates with clear boundaries.",
          },
        ],
      },
      {
        heading: {
          zh: "Skill 层保存学科规则",
          en: "The skill layer stores disciplinary rules",
        },
        paragraphs: [
          {
            zh: "经济学研究中的很多知识不是事实清单，而是做事方式：识别策略怎样被审稿人质疑，稳健性检验如何排列，文献综述如何从问题意识出发组织。Skill 层保存的正是这套工作法。",
            en: "Much of economics knowledge is not a fact list but a way of operating: how referees challenge identification, how robustness checks are sequenced, and how literature reviews are organized from a question-driven perspective. That operating logic belongs in the skill layer.",
          },
        ],
      },
      {
        heading: {
          zh: "Tool 层把建议变成动作",
          en: "The tool layer turns suggestions into action",
        },
        paragraphs: [
          {
            zh: "如果系统不能读取目录、调用数据库、生成代码文件、检查日志，那么它再聪明也只能停留在建议层。工具接入让 Copilot 可以在真实工作台里前进一步。",
            en: "If the system cannot inspect directories, call databases, generate files, or inspect logs, it remains trapped at the advice layer. Tool access lets the copilot take one step deeper into the real workspace.",
          },
        ],
      },
    ],
    theme: {
      coverStart: "#ead8c1",
      coverEnd: "#d7a87b",
      spine: "#b05b33",
      accent: "#7a3519",
      shadow: "rgba(176, 91, 51, 0.22)",
    },
  },
  {
    slug: "agent-memory-for-semesters",
    issue: "Volume 05",
    illustration: "memoryArchive",
    publishedAt: "2026-02-14",
    category: {
      zh: "知识管理",
      en: "Knowledge Management",
    },
    title: {
      zh: "让经济学 Agent 的记忆跨学期存活",
      en: "Designing an Economics Agent Memory That Survives the Semester",
    },
    excerpt: {
      zh: "一个学期结束后最容易丢失的，不是文件，而是研究决策的上下文。真正有价值的记忆系统，保存的是‘为什么这样做’，而不只是‘做了什么’。",
      en: "At the end of a semester, what disappears first is not the file but the reasoning around decisions. Valuable memory systems preserve why a choice was made, not only what was done.",
    },
    coverNote: {
      zh: "Knowledge Shelf / Durable Research Memory",
      en: "Knowledge Shelf / Durable Research Memory",
    },
    readTime: {
      zh: "9 分钟",
      en: "9 min",
    },
    tags: [
      { zh: "Agent 记忆", en: "Agent Memory" },
      { zh: "知识库", en: "Knowledge Base" },
      { zh: "研究协作", en: "Research Collaboration" },
    ],
    author: {
      name: "EconAgora Knowledge Desk",
      role: {
        zh: "知识系统编辑",
        en: "Knowledge Systems Editor",
      },
    },
    stats: [
      { value: "3", label: { zh: "记忆层级", en: "Memory layers" } },
      { value: "1", label: { zh: "决策日志", en: "Decision log" } },
      { value: "∞", label: { zh: "复用周期", en: "Reuse horizon" } },
    ],
    shelfIndex: [
      {
        zh: "长期记忆不是聊天记录归档，而是研究决策的压缩索引。",
        en: "Long-term memory is not archived chat history; it is a compressed index of research decisions.",
      },
      {
        zh: "记住边界条件，比记住漂亮答案更有价值。",
        en: "Remembering boundary conditions is more valuable than remembering polished answers.",
      },
      {
        zh: "让下一位研究助理能读懂，是知识系统最低标准。",
        en: "If the next RA cannot understand it, the knowledge system has not met the minimum bar.",
      },
    ],
    lead: {
      zh: "很多团队把 Agent 记忆等同于向量检索，但在研究场景里，更难也更重要的是保存选择过程、失败尝试和放弃原因。",
      en: "Many teams reduce agent memory to vector retrieval. In research settings, the harder and more valuable task is preserving decisions, failed attempts, and reasons for abandoning a path.",
    },
    sections: [
      {
        heading: {
          zh: "把记忆分成事实、判断和制度三层",
          en: "Separate memory into facts, judgments, and institutional context",
        },
        paragraphs: [
          {
            zh: "事实层保存变量定义、数据口径和引用来源；判断层保存为什么采用某个识别策略；制度层则记录导师偏好、课程目标或合作规范。这三层不能混写。",
            en: "The factual layer stores variable definitions, data conventions, and sources. The judgment layer stores why a strategy was chosen. The institutional layer records advisor preferences, course objectives, or team norms. These layers should not be mixed.",
          },
        ],
      },
      {
        heading: {
          zh: "记忆条目必须带时间戳和失效条件",
          en: "Memory entries need timestamps and expiry conditions",
        },
        paragraphs: [
          {
            zh: "研究环境会变化。数据更新、课程轮替、政策背景改变，都可能让旧结论失效。没有失效条件的记忆，最终会污染整个系统。",
            en: "Research environments change. Data updates, course rotation, or policy shifts can invalidate earlier decisions. Memory without expiry conditions eventually contaminates the whole system.",
          },
        ],
      },
      {
        heading: {
          zh: "最好的记忆系统，总能把人带回原始证据",
          en: "The best memory systems always route you back to source evidence",
        },
        paragraphs: [
          {
            zh: "不要让记忆层变成新的黑箱。每一条重要结论都应该能回链到笔记、脚本、论文或数据文件，让后来者可以重新判断，而不是只能被动接受。",
            en: "Do not turn the memory layer into a new black box. Every important conclusion should link back to notes, scripts, papers, or data files so future collaborators can re-judge the evidence instead of accepting it passively.",
          },
        ],
      },
    ],
    theme: {
      coverStart: "#ece2d3",
      coverEnd: "#d7b9a1",
      spine: "#7e604f",
      accent: "#594136",
      shadow: "rgba(126, 96, 79, 0.22)",
    },
  },
  {
    slug: "ai-agent-research-setup",
    issue: "Volume 05",
    illustration: "copilotLayers",
    publishedAt: "2026-05-21",
    category: {
      zh: "AI 工具",
      en: "AI Tools",
    },
    title: {
      zh: "什么是 AI Agent？使用 VSCode 配置自己的第一个科研 Agent",
      en: "What is an AI Agent? Configure Your First Research Agent with VSCode",
    },
    excerpt: {
      zh: "从零开始理解 AI Agent 的概念，使用 VSCode + Claude + CC Switch 配置一个能读文献、写代码、跑数据的科研助手。",
      en: "Understand AI Agent from scratch and configure a research assistant that can read papers, write code, and run data analysis using VSCode + Claude + CC Switch.",
    },
    coverNote: {
      zh: "Getting Started / AI Agent Research Setup",
      en: "Getting Started / AI Agent Research Setup",
    },
    readTime: {
      zh: "20 分钟",
      en: "20 min",
    },
    tags: [
      { zh: "AI Agent", en: "AI Agent" },
      { zh: "VSCode", en: "VSCode" },
      { zh: "Claude", en: "Claude" },
      { zh: "CC Switch", en: "CC Switch" },
      { zh: "科研工具", en: "Research Tools" },
      { zh: "入门教程", en: "Tutorial" },
    ],
    author: {
      name: "戴伟德",
      role: {
        zh: "经济学研究者",
        en: "Economics Researcher",
      },
    },
    stats: [
      { value: "3", label: { zh: "核心工具", en: "Core tools" } },
      { value: "50+", label: { zh: "模型供应商", en: "Model providers" } },
      { value: "1", label: { zh: "实战任务", en: "Hands-on task" } },
    ],
    shelfIndex: [
      {
        zh: "AI Agent 不是聊天机器人，而是能持续执行任务、调用工具、读写文件的助理。",
        en: "An AI Agent is not a chatbot but an assistant that can continuously execute tasks, call tools, and read/write files.",
      },
      {
        zh: "CC Switch 让你一键切换 Claude、Kimi、DeepSeek 等 50+ 模型供应商。",
        en: "CC Switch lets you switch between 50+ model providers including Claude, Kimi, and DeepSeek with one click.",
      },
      {
        zh: "Claude Code 是 Anthropic 官方 CLI 工具，在 VSCode 终端中直接对话。",
        en: "Claude Code is Anthropic's official CLI tool for direct conversation in the VSCode terminal.",
      },
    ],
    lead: {
      zh: "2024 年以来，AI Agent（智能体）从一个技术概念迅速演变为研究者手中的生产力工具。与单次对话的 ChatGPT 不同，Agent 能够持续执行任务、调用工具、读写文件，真正融入研究工作流。",
      en: "Since 2024, AI Agent has evolved from a technical concept into a productivity tool for researchers. Unlike single-conversation ChatGPT, Agents can continuously execute tasks, call tools, and read/write files, truly integrating into research workflows.",
    },
    sections: [
      {
        heading: {
          zh: "从 ChatGPT 到 Agent：关键区别",
          en: "From ChatGPT to Agent: Key Differences",
        },
        paragraphs: [
          {
            zh: "ChatGPT 是\"顾问\"，Agent 是\"助理\"。顾问给你建议，助理直接动手做。Agent 的核心架构包含三个组件：大脑（LLM）、工具（Tools）和记忆（Memory）。",
            en: "ChatGPT is an 'advisor', while an Agent is an 'assistant'. Advisors give suggestions; assistants get things done. The core Agent architecture has three components: Brain (LLM), Tools, and Memory.",
          },
        ],
        bullets: [
          {
            zh: "交互方式：从单次对话到持续任务执行",
            en: "Interaction: from single conversation to continuous task execution",
          },
          {
            zh: "文件操作：从手动上传/下载到自动读写文件",
            en: "File operations: from manual upload/download to automatic read/write",
          },
          {
            zh: "工具使用：从无到可调用计算器、搜索引擎、代码解释器等",
            en: "Tool usage: from none to calling calculators, search engines, code interpreters",
          },
          {
            zh: "记忆：从对话窗口内到可读写外部文件，跨会话持久",
            en: "Memory: from within conversation window to external file persistence across sessions",
          },
        ],
      },
      {
        heading: {
          zh: "安装 CC Switch 和 Claude Code",
          en: "Install CC Switch and Claude Code",
        },
        paragraphs: [
          {
            zh: "CC Switch 是一个跨平台的桌面 All-in-One 助手，用于管理 Claude Code、Codex、Gemini CLI 等 AI CLI 工具的 API 供应商切换。通过 CC Switch，你可以轻松在 Claude 中使用国产模型（如 Kimi、DeepSeek 等），无需手动编辑配置文件。",
            en: "CC Switch is a cross-platform desktop All-in-One assistant for managing API provider switching of AI CLI tools like Claude Code, Codex, and Gemini CLI. Through CC Switch, you can easily use domestic models (like Kimi, DeepSeek) in Claude without manually editing configuration files.",
          },
          {
            zh: "Claude Code 是 Anthropic 推出的官方 CLI 工具，让你在终端中直接与 Claude 对话，执行文件操作、代码编写等任务。安装命令：npm install -g @anthropic-ai/claude-code",
            en: "Claude Code is Anthropic's official CLI tool for direct conversation with Claude in the terminal, executing file operations, code writing, and more. Install with: npm install -g @anthropic-ai/claude-code",
          },
        ],
        bullets: [
          {
            zh: "CC Switch 支持 50+ 供应商预设，包括官方 API 和第三方中转服务",
            en: "CC Switch supports 50+ provider presets, including official APIs and third-party relay services",
          },
          {
            zh: "常用国产模型：Kimi (Moonshot)、DeepSeek、通义千问、文心一言",
            en: "Common domestic models: Kimi (Moonshot), DeepSeek, Tongyi Qianwen, Wenxin Yiyan",
          },
          {
            zh: "切换供应商后 Claude Code 无需重启，立即生效",
            en: "Switching providers takes effect immediately without restarting Claude Code",
          },
        ],
      },
      {
        heading: {
          zh: "第一个科研任务：自动下载并解析 NBER 论文",
          en: "First Research Task: Auto-download and Parse NBER Paper",
        },
        paragraphs: [
          {
            zh: "让 Agent 自动完成：下载一篇 NBER Working Paper（PDF），提取标题、作者、摘要、关键词，生成中文摘要总结，并保存到本地文件。",
            en: "Let the Agent automatically: download an NBER Working Paper (PDF), extract title, author, abstract, keywords, generate a Chinese summary, and save to a local file.",
          },
          {
            zh: "在 Claude Code 中输入任务提示词后，Agent 会自主规划、执行、反思并调整策略。你会看到它将任务拆解为子步骤，调用浏览器工具访问网站，遇到问题（如需要登录）时调整策略，最终生成结构化的 Markdown 文件。",
            en: "After entering the task prompt in Claude Code, the Agent will autonomously plan, execute, reflect, and adjust strategies. You'll see it break down tasks into sub-steps, call browser tools to access websites, adjust strategies when encountering issues (like login requirements), and finally generate a structured Markdown file.",
          },
        ],
        bullets: [
          {
            zh: "配置工具权限：文件读写、网络访问、命令执行（需确认）",
            en: "Configure tool permissions: file read/write, network access, command execution (requires confirmation)",
          },
          {
            zh: "编写具体、可验证的任务提示词，包含明确的输出格式要求",
            en: "Write specific, verifiable task prompts with clear output format requirements",
          },
          {
            zh: "人工核查关键信息，复杂任务分步骤执行",
            en: "Manually verify key information; execute complex tasks in steps",
          },
        ],
      },
      {
        heading: {
          zh: "进阶配置与模型切换",
          en: "Advanced Configuration and Model Switching",
        },
        paragraphs: [
          {
            zh: "Claude Code 支持自定义系统指令，让 Agent 始终以特定方式工作。在项目根目录创建 CLAUDE.md 文件，Claude Code 会自动读取并遵循指令。",
            en: "Claude Code supports custom system instructions to make the Agent work in a specific way. Create a CLAUDE.md file in the project root, and Claude Code will automatically read and follow the instructions.",
          },
          {
            zh: "CC Switch 的核心价值在于一键切换不同模型供应商。使用 Kimi 处理中文文献，使用 DeepSeek 进行代码生成，切换回 Claude 进行复杂推理——根据任务特点选择最适合的模型。",
            en: "CC Switch's core value is one-click switching between different model providers. Use Kimi for Chinese literature, DeepSeek for code generation, and switch back to Claude for complex reasoning—choose the most suitable model based on task characteristics.",
          },
        ],
        bullets: [
          {
            zh: "场景 1：使用 Kimi 处理中文文献，中文理解能力更优",
            en: "Scenario 1: Use Kimi for Chinese literature, better Chinese comprehension",
          },
          {
            zh: "场景 2：使用 DeepSeek 进行代码生成，中文场景下表现优异",
            en: "Scenario 2: Use DeepSeek for code generation, excellent in Chinese contexts",
          },
          {
            zh: "场景 3：切换回 Claude 进行复杂推理，学术分析中表现最佳",
            en: "Scenario 3: Switch back to Claude for complex reasoning, best in academic analysis",
          },
        ],
      },
    ],
    theme: {
      coverStart: "#e8ddd0",
      coverEnd: "#c9a87c",
      spine: "#7a5c3a",
      accent: "#5a4028",
      shadow: "rgba(122, 92, 58, 0.24)",
    },
    coverImage: "/blog-covers/2026/05/ai-agent-research-setup-final.png",
  },
];

function pick(locale: string, value: LocalizedText) {
  return locale === "en" ? value.en : value.zh;
}

function localizeEntry(entry: RawBlogEntry, locale: string): LocalizedBlogEntry {
  return {
    slug: entry.slug,
    issue: entry.issue,
    illustration: entry.illustration,
    publishedAt: entry.publishedAt,
    category: pick(locale, entry.category),
    title: pick(locale, entry.title),
    excerpt: pick(locale, entry.excerpt),
    coverNote: pick(locale, entry.coverNote),
    readTime: pick(locale, entry.readTime),
    tags: entry.tags.map((tag) => pick(locale, tag)),
    author: {
      name: entry.author.name,
      role: pick(locale, entry.author.role),
    },
    stats: entry.stats.map((stat) => ({
      value: stat.value,
      label: pick(locale, stat.label),
    })),
    shelfIndex: entry.shelfIndex.map((item) => pick(locale, item)),
    lead: pick(locale, entry.lead),
    sections: entry.sections.map((section) => ({
      heading: pick(locale, section.heading),
      paragraphs: section.paragraphs.map((paragraph) => pick(locale, paragraph)),
      bullets: section.bullets?.map((bullet) => pick(locale, bullet)),
    })),
    theme: entry.theme,
    coverImage: entry.coverImage,
  };
}

export function getBlogEntries(locale: string): LocalizedBlogEntry[] {
  return BLOG_ENTRIES.map((entry) => localizeEntry(entry, locale));
}

export function getBlogEntryBySlug(
  slug: string,
  locale: string,
): LocalizedBlogEntry | undefined {
  const entry = BLOG_ENTRIES.find((item) => item.slug === slug);
  return entry ? localizeEntry(entry, locale) : undefined;
}

export function getRelatedBlogEntries(
  slug: string,
  locale: string,
  limit = 3,
): LocalizedBlogEntry[] {
  return getBlogEntries(locale)
    .filter((entry) => entry.slug !== slug)
    .slice(0, limit);
}

export function formatBlogDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}
