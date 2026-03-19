# AI4Econ Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core foundation of AI4Econ — project scaffolding, landing page, user auth, Prompt Library with CRUD/download/comments, and basic Community with posts/replies.

**Architecture:** Next.js 14 App Router with `[locale]` prefix for i18n readiness. Server Components for data fetching, Server Actions for mutations. Prisma ORM with PostgreSQL. NextAuth.js v5 for session-based auth. Tailwind CSS with CSS variables matching Soale template design tokens.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Prisma, PostgreSQL, NextAuth.js v5, next-intl, bcrypt

**Spec:** `docs/superpowers/specs/2026-03-20-ai4econ-platform-design.md`

**Reference template:** `website-export/index.html` (Soale Webflow template)

---

## File Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              # Root layout with nav, footer, locale provider
│   │   ├── page.tsx                # Landing page
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── prompts/
│   │   │   ├── page.tsx            # Prompt list with filters
│   │   │   ├── [id]/page.tsx       # Prompt detail + comments
│   │   │   └── new/page.tsx        # Create/edit prompt
│   │   ├── community/
│   │   │   ├── page.tsx            # Post list
│   │   │   ├── [id]/page.tsx       # Post detail + replies
│   │   │   └── new/page.tsx        # Create post
│   │   ├── u/
│   │   │   └── [id]/page.tsx       # User profile
│   │   └── settings/page.tsx       # User settings
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── prompts/[id]/download/route.ts  # Prompt .txt download
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── LocaleSwitcher.tsx
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── StatsBar.tsx
│   │   ├── AboutSection.tsx
│   │   ├── FeaturesGrid.tsx
│   │   ├── ModulesShowcase.tsx
│   │   ├── FAQAccordion.tsx
│   │   └── CTASection.tsx
│   ├── prompts/
│   │   ├── PromptCard.tsx
│   │   ├── PromptForm.tsx
│   │   └── PromptFilters.tsx
│   ├── community/
│   │   ├── PostCard.tsx
│   │   └── PostForm.tsx
│   ├── shared/
│   │   ├── CommentSection.tsx
│   │   ├── LikeButton.tsx
│   │   ├── TagBadge.tsx
│   │   └── Pagination.tsx
│   └── auth/
│       ├── LoginForm.tsx
│       └── RegisterForm.tsx
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── auth.ts                     # NextAuth config
│   └── utils.ts                    # Shared utilities
├── actions/
│   ├── prompts.ts                  # Server actions for prompts
│   ├── community.ts                # Server actions for posts
│   ├── comments.ts                 # Server actions for comments
│   └── likes.ts                    # Server actions for likes
├── i18n/
│   ├── request.ts                  # next-intl request config
│   ├── routing.ts                  # Locale routing config
│   ├── navigation.ts               # Locale-aware Link, redirect, useRouter, usePathname
│   └── messages/
│       ├── zh.json
│       └── en.json
└── middleware.ts                    # next-intl middleware for locale routing

prisma/
├── schema.prisma
└── seed.ts                         # Seed data for development

next.config.ts
.env.example
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `.env.example`, `src/app/globals.css`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, `postcss.config.mjs`
- Delete: `tailwind.config.ts` (Tailwind v4 uses CSS-based config)

- [ ] **Step 1: Initialize Next.js project**

```bash
cd AI4Econ
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Accept overwriting existing files if prompted. This creates the base Next.js 14 project with App Router, TypeScript, Tailwind, and ESLint.

- [ ] **Step 2: Install core dependencies**

```bash
npm install next-intl prisma @prisma/client next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 3: Configure Tailwind with Soale design tokens**

Since `create-next-app` ships Tailwind v4 which uses CSS-based config (`@theme`), delete the generated `tailwind.config.ts` if it exists — all design tokens will be defined in `globals.css`:

```bash
rm -f tailwind.config.ts
```

- [ ] **Step 4: Set up globals.css with Soale base styles**

Replace `src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-primary: rgb(241, 83, 37);
  --color-primary-hover: rgb(220, 70, 28);
  --color-dark: #0a0a0a;
  --color-dark-card: #141414;
  --color-dark-border: #1f1f1f;
  --color-gray-text: rgb(255 255 255 / 50%);
  --font-sans: "Inter Tight", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
}

body {
  background: var(--color-dark);
  color: white;
  font-family: var(--font-sans);
}
```

- [ ] **Step 5: Create .env.example**

```
DATABASE_URL="postgresql://user:password@localhost:5432/ai4econ"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

Copy to `.env`:
```bash
cp .env.example .env
```

- [ ] **Step 6: Verify project builds**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with Tailwind and Soale design tokens"
```

---

## Task 2: i18n Setup with next-intl

**Files:**
- Create: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/messages/zh.json`, `src/i18n/messages/en.json`, `src/middleware.ts`
- Modify: `src/app/[locale]/layout.tsx`, `next.config.ts`

- [ ] **Step 1: Create routing config**

Create `src/i18n/routing.ts`:

```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["zh", "en"],
  defaultLocale: "zh",
});
```

- [ ] **Step 2: Create request config**

Create `src/i18n/request.ts`:

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 3: Create minimal message files**

Create `src/i18n/messages/zh.json`:

```json
{
  "nav": {
    "prompts": "提示词库",
    "skills": "技能库",
    "tools": "工具中心",
    "tutorials": "教程案例",
    "radar": "前沿追踪",
    "community": "社区",
    "login": "登录",
    "register": "注册"
  },
  "landing": {
    "slogan": "AI Toolkit For Economist",
    "subtitle": "为新时代经管研究者打造的 AI 科研基础设施",
    "explore": "开始探索",
    "github": "GitHub"
  }
}
```

Create `src/i18n/messages/en.json`:

```json
{
  "nav": {
    "prompts": "Prompts",
    "skills": "Skills",
    "tools": "Tools",
    "tutorials": "Tutorials",
    "radar": "Radar",
    "community": "Community",
    "login": "Login",
    "register": "Register"
  },
  "landing": {
    "slogan": "AI Toolkit For Economist",
    "subtitle": "AI-powered research infrastructure for economists",
    "explore": "Get Started",
    "github": "GitHub"
  }
}
```

- [ ] **Step 4: Create middleware for locale routing**

Create `src/middleware.ts`:

```typescript
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 5: Update next.config.ts**

```typescript
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 6: Update root layout with NextIntlClientProvider**

Replace `src/app/[locale]/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

export const metadata: Metadata = {
  title: "AI4Econ - AI Toolkit For Economist",
  description: "AI-powered research infrastructure for economists",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-dark text-white antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Create navigation helper with locale-aware Link**

Create `src/i18n/navigation.ts`:

```typescript
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

All components should import `Link` from `@/i18n/navigation` instead of `next/link` to get automatic locale prefixing on hrefs.

- [ ] **Step 8: Update placeholder page**

Replace `src/app/[locale]/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("landing");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-5xl font-bold">{t("slogan")}</h1>
      <p className="mt-4 text-gray-text">{t("subtitle")}</p>
    </main>
  );
}
```

- [ ] **Step 8: Verify i18n routing works**

```bash
npm run dev
```

Visit `http://localhost:3000` — should redirect to `/zh`. Visit `/en` — should show English text. Stop dev server after verifying.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add next-intl i18n with zh/en locale routing"
```

---

## Task 3: Prisma Schema & Database

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/prisma.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init
```

This creates `prisma/schema.prisma` and updates `.env` with `DATABASE_URL`.

- [ ] **Step 2: Write Prisma schema**

Replace `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

enum ContentStatus {
  DRAFT
  PUBLISHED
  UNDER_REVIEW
}

enum TargetType {
  PROMPT
  SKILL
  TOOL
  TUTORIAL
  RADAR
  POST
  COMMENT
}

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  password    String
  avatar      String?
  role        Role     @default(USER)
  locale      String   @default("zh")
  bio         String?
  affiliation String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  prompts     Prompt[]
  posts       Post[]
  comments    Comment[]
  likes       UserLike[]
  agentTokens AgentToken[]
}

model AgentToken {
  id          String   @id @default(cuid())
  name        String
  description String?
  token       String   @unique
  scopes      String[]
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  lastUsedAt  DateTime?

  posts    Post[]
  comments Comment[]
}

model Prompt {
  id            String        @id @default(cuid())
  title         String
  content       String
  description   String?
  category      String
  tags          String[]
  locale        String        @default("zh")
  status        ContentStatus @default(DRAFT)
  downloadCount Int           @default(0)
  likeCount     Int           @default(0)
  version       Int           @default(1)
  authorId      String
  author        User          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

}

model Post {
  id            String   @id @default(cuid())
  title         String
  content       String
  locale        String   @default("zh")
  pinned        Boolean  @default(false)
  tags          String[]
  isAgentPost   Boolean  @default(false)
  likeCount     Int      @default(0)
  authorId      String
  author        User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  agentTokenId  String?
  agentToken    AgentToken? @relation(fields: [agentTokenId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// Polymorphic: targetType + targetId resolved in application code (no FK constraints)
model Comment {
  id             String      @id @default(cuid())
  content        String
  targetType     TargetType
  targetId       String
  parentId       String?
  parent         Comment?    @relation("CommentReplies", fields: [parentId], references: [id])
  replies        Comment[]   @relation("CommentReplies")
  isAgentComment Boolean     @default(false)
  likeCount      Int         @default(0)
  authorId       String
  author         User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  agentTokenId   String?
  agentToken     AgentToken? @relation(fields: [agentTokenId], references: [id])
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  @@index([targetType, targetId])
}

model UserLike {
  id         String     @id @default(cuid())
  userId     String
  targetType TargetType
  targetId   String
  createdAt  DateTime   @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, targetType, targetId])
}
```

**Note:** Comment and UserLike use a polymorphic pattern with `targetType` + `targetId`. There are no FK constraints to Prompt/Post — the target entity is resolved in application code. This avoids the problem of a single `targetId` column having FK constraints to multiple tables.

- [ ] **Step 3: Create Prisma client singleton**

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Generate Prisma client and push schema**

```bash
npx prisma generate
npx prisma db push
```

Expected: Schema pushed to database, client generated. Ensure your PostgreSQL is running and `DATABASE_URL` in `.env` is correct.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts
git commit -m "feat: add Prisma schema with User, Prompt, Post, Comment, UserLike models"
```

---

## Task 4: NextAuth.js Authentication

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/components/auth/LoginForm.tsx`, `src/components/auth/RegisterForm.tsx`, `src/app/[locale]/auth/login/page.tsx`, `src/app/[locale]/auth/register/page.tsx`, `src/app/api/auth/register/route.ts`

- [ ] **Step 1: Create NextAuth config**

Create `src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;
        const valid = await bcryptjs.compare(
          credentials.password as string,
          user.password
        );
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
});
```

- [ ] **Step 2: Create auth API route**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 3: Create register API route**

Create `src/app/api/auth/register/route.ts`:

```typescript
import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { email, name, password } = await request.json();

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashed = await bcryptjs.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name, password: hashed },
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
```

- [ ] **Step 4: Create LoginForm component**

Create `src/components/auth/LoginForm.tsx`:

```tsx
"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-primary-hover transition"
      >
        登录
      </button>
    </form>
  );
}
```

- [ ] **Step 5: Create RegisterForm component**

Create `src/components/auth/RegisterForm.tsx`:

```tsx
"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        name: formData.get("name"),
        password: formData.get("password"),
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
    } else {
      router.push("/auth/login");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <input
        name="name"
        type="text"
        placeholder="Name"
        required
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        minLength={8}
        required
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-primary-hover transition"
      >
        注册
      </button>
    </form>
  );
}
```

- [ ] **Step 6: Create login and register pages**

Create `src/app/[locale]/auth/login/page.tsx`:

```tsx
import LoginForm from "@/components/auth/LoginForm";
import { Link } from "@/i18n/navigation";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold">登录</h1>
        <LoginForm />
        <p className="text-gray-text text-sm">
          还没有账号？{" "}
          <Link href="/auth/register" className="text-primary hover:underline">
            注册
          </Link>
        </p>
      </div>
    </main>
  );
}
```

Create `src/app/[locale]/auth/register/page.tsx`:

```tsx
import RegisterForm from "@/components/auth/RegisterForm";
import { Link } from "@/i18n/navigation";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold">注册</h1>
        <RegisterForm />
        <p className="text-gray-text text-sm">
          已有账号？{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            登录
          </Link>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Verify auth flow works**

```bash
npm run dev
```

1. Visit `/zh/auth/register` — register a test user
2. Visit `/zh/auth/login` — login with that user
3. Verify redirect to home page

Stop dev server after verifying.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add NextAuth.js credentials auth with login/register"
```

---

## Task 5: Layout Components (Navbar + Footer)

**Files:**
- Create: `src/components/layout/Navbar.tsx`, `src/components/layout/Footer.tsx`, `src/components/layout/LocaleSwitcher.tsx`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Create LocaleSwitcher**

Create `src/components/layout/LocaleSwitcher.tsx`:

```tsx
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale() {
    const newLocale = locale === "zh" ? "en" : "zh";
    router.push(pathname, { locale: newLocale });
  }

  return (
    <button
      onClick={switchLocale}
      className="text-sm text-gray-text hover:text-white transition"
    >
      {locale === "zh" ? "EN" : "中文"}
    </button>
  );
}
```

- [ ] **Step 2: Create Navbar**

Create `src/components/layout/Navbar.tsx`:

```tsx
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import LocaleSwitcher from "./LocaleSwitcher";

export default async function Navbar() {
  const session = await auth();
  const t = await getTranslations("nav");

  const navItems = [
    { href: "/prompts", label: t("prompts") },
    { href: "/community", label: t("community") },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-dark-border bg-dark/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold">
          AI<span className="text-primary">4</span>Econ
        </Link>
        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-gray-text hover:text-white transition"
            >
              {item.label}
            </Link>
          ))}
          <LocaleSwitcher />
          {session?.user ? (
            <Link
              href={`/u/${session.user.id}`}
              className="text-sm text-white"
            >
              {session.user.name}
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Create Footer**

Create `src/components/layout/Footer.tsx`:

```tsx
import { Link } from "@/i18n/navigation";

export default function Footer() {
  return (
    <footer className="border-t border-dark-border bg-dark">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <Link href="/" className="text-xl font-bold">
              AI<span className="text-primary">4</span>Econ
            </Link>
            <p className="mt-2 text-sm text-gray-text max-w-xs">
              AI Toolkit For Economist — 为新时代经管研究者打造的 AI 科研基础设施
            </p>
          </div>
          <div className="flex gap-12">
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-semibold mb-1">Platform</span>
              <Link href="/prompts" className="text-gray-text hover:text-white transition">Prompts</Link>
              <Link href="/community" className="text-gray-text hover:text-white transition">Community</Link>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-semibold mb-1">Links</span>
              <a href="https://github.com/dwdecon/AI4Econ" target="_blank" rel="noopener" className="text-gray-text hover:text-white transition">GitHub</a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-dark-border text-sm text-gray-text">
          © 2026 AI4Econ. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Update layout to include Navbar and Footer**

Update `src/app/[locale]/layout.tsx` — add Navbar and Footer inside the body:

```tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "../globals.css";

export const metadata: Metadata = {
  title: "AI4Econ - AI Toolkit For Economist",
  description: "AI-powered research infrastructure for economists",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-dark text-white antialiased">
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify layout renders**

```bash
npm run dev
```

Visit `http://localhost:3000` — should see Navbar with logo, nav links, locale switcher, and Footer. Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Navbar, Footer, and LocaleSwitcher layout components"
```

---

## Task 6: Landing Page

**Files:**
- Create: `src/components/landing/Hero.tsx`, `src/components/landing/StatsBar.tsx`, `src/components/landing/ModulesShowcase.tsx`, `src/components/landing/FeaturesGrid.tsx`, `src/components/landing/FAQAccordion.tsx`, `src/components/landing/CTASection.tsx`
- Modify: `src/app/[locale]/page.tsx`, `src/i18n/messages/zh.json`, `src/i18n/messages/en.json`

- [ ] **Step 1: Create Hero component**

Create `src/components/landing/Hero.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function Hero() {
  const t = await getTranslations("landing");

  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      {/* Animated gradient background — mimics Soale hero */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark via-dark-card to-dark" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-primary)_0%,_transparent_70%)] animate-pulse" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-primary mb-6">
          {t("slogan")}
        </p>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          {t("subtitle")}
        </h1>
        <p className="mt-6 text-lg text-gray-text max-w-2xl mx-auto">
          Prompt · Skill · MCP · 教程 · 前沿追踪 · 人机共创社区
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <Link
            href="/prompts"
            className="rounded-lg bg-primary px-8 py-3 font-semibold text-white hover:bg-primary-hover transition"
          >
            {t("explore")}
          </Link>
          <a
            href="https://github.com/dwdecon/AI4Econ"
            target="_blank"
            rel="noopener"
            className="rounded-lg border border-dark-border px-8 py-3 font-semibold text-white hover:border-gray-text transition"
          >
            {t("github")}
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create StatsBar component**

Create `src/components/landing/StatsBar.tsx`:

```tsx
const stats = [
  { value: "128+", label: "Prompts" },
  { value: "45+", label: "Skills" },
  { value: "30+", label: "Tools" },
  { value: "500+", label: "研究者" },
];

export default function StatsBar() {
  return (
    <section className="border-y border-dark-border">
      <div className="mx-auto max-w-5xl px-6 py-12 flex justify-center gap-16 md:gap-24">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-3xl font-bold text-primary">{stat.value}</div>
            <div className="mt-1 text-sm text-gray-text">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create ModulesShowcase component**

Create `src/components/landing/ModulesShowcase.tsx`:

```tsx
import { Link } from "@/i18n/navigation";

const modules = [
  { num: "01", title: "Prompt Library", desc: "学术提示词库 — 文献综述、数据分析、论文写作", href: "/prompts" },
  { num: "02", title: "Skills Library", desc: "完整学术工作流 — 从选题到发表", href: "/skills" },
  { num: "03", title: "MCP / Tools", desc: "MCP 服务器、插件、工具接入指南", href: "/tools" },
  { num: "04", title: "Tutorials", desc: "推文、视频教程、实战案例", href: "/tutorials" },
  { num: "05", title: "Research Radar", desc: "最新论文、新工具、新模型追踪", href: "/radar" },
  { num: "06", title: "Community", desc: "人机共创社区 — 研究者与 AI Agent 共同交流", href: "/community" },
];

export default function ModulesShowcase() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">探索六大板块</h2>
        <p className="text-center text-gray-text mb-12">从提示词到完整工作流，一站式 AI 科研工具</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => (
            <Link
              key={m.num}
              href={m.href}
              className="group rounded-2xl border border-dark-border bg-dark-card p-6 hover:border-primary/50 transition"
            >
              <span className="font-mono text-xs text-primary">{m.num}</span>
              <h3 className="mt-2 text-lg font-semibold group-hover:text-primary transition">{m.title}</h3>
              <p className="mt-2 text-sm text-gray-text">{m.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create FeaturesGrid component**

Create `src/components/landing/FeaturesGrid.tsx`:

```tsx
const features = [
  { title: "AI Agent 社区", desc: "你的 Agent 可以自由发帖、分享发现、参与讨论" },
  { title: "一键下载", desc: "Prompt 文本、Skill 压缩包，即取即用" },
  { title: "中英双语", desc: "界面与内容支持中英文切换" },
  { title: "开放 API", desc: "Agent API 让你的 AI 助手接入平台" },
  { title: "社区驱动", desc: "用户发布、评论、评分，共建知识库" },
  { title: "前沿追踪", desc: "Research Radar 持续更新最新进展" },
];

export default function FeaturesGrid() {
  return (
    <section className="py-20 bg-dark-card">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Features</p>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">为研究者和 Agent 而建</h2>
        <p className="text-gray-text mb-12 max-w-xl">智能基础设施，助力 AI 时代的经济学研究</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-dark-border p-6">
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-text">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create FAQAccordion component**

Create `src/components/landing/FAQAccordion.tsx`:

```tsx
"use client";

import { useState } from "react";

const faqs = [
  { q: "AI4Econ 是什么？", a: "AI4Econ 是一个为经管研究者打造的 AI 科研工具平台，提供提示词、工作流、MCP 工具、教程和社区。" },
  { q: "如何使用 Prompt Library？", a: "浏览分类提示词，找到适合你研究场景的提示词，一键复制或下载使用。" },
  { q: "AI Agent 可以做什么？", a: "你可以创建 Agent Token，让你的 AI 助手代你在社区发帖、分享发现、参与讨论。" },
  { q: "平台免费吗？", a: "是的，AI4Econ 完全免费开放，所有内容均可自由浏览和下载。" },
  { q: "如何贡献内容？", a: "注册账号后，你可以发布自己的 Prompt、Skill、工具或教程，与社区共享。" },
];

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">常见问题</h2>
        <div className="flex flex-col gap-2">
          {faqs.map((faq, i) => (
            <button
              key={i}
              onClick={() => setOpen(open === i ? null : i)}
              className="text-left rounded-xl border border-dark-border p-5 hover:border-primary/30 transition"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">{faq.q}</span>
                <span className="text-gray-text ml-4">{open === i ? "−" : "+"}</span>
              </div>
              {open === i && (
                <p className="mt-3 text-sm text-gray-text">{faq.a}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Create CTASection component**

Create `src/components/landing/CTASection.tsx`:

```tsx
import { Link } from "@/i18n/navigation";

export default function CTASection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-primary mb-3">
          Join AI4Econ
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          加入 AI4Econ 社区
        </h2>
        <p className="text-gray-text mb-8">
          与经管研究者和 AI Agent 一起探索学术新范式
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/register"
            className="rounded-lg bg-primary px-8 py-3 font-semibold text-white hover:bg-primary-hover transition"
          >
            免费注册
          </Link>
          <Link
            href="/prompts"
            className="rounded-lg border border-dark-border px-8 py-3 font-semibold text-white hover:border-gray-text transition"
          >
            浏览 Prompts
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Assemble landing page**

Replace `src/app/[locale]/page.tsx`:

```tsx
import Hero from "@/components/landing/Hero";
import StatsBar from "@/components/landing/StatsBar";
import ModulesShowcase from "@/components/landing/ModulesShowcase";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import FAQAccordion from "@/components/landing/FAQAccordion";
import CTASection from "@/components/landing/CTASection";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <ModulesShowcase />
      <FeaturesGrid />
      <FAQAccordion />
      <CTASection />
    </>
  );
}
```

- [ ] **Step 8: Verify landing page renders**

```bash
npm run dev
```

Visit `http://localhost:3000` — should see full landing page with all sections. Stop dev server.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add landing page with Hero, Stats, Modules, Features, FAQ, CTA"
```

---

<!-- PLAN_TASKS_PART3 -->
## Task 7: Prompt Library — Server Actions & List Page

**Files:**
- Create: `src/actions/prompts.ts`, `src/components/prompts/PromptCard.tsx`, `src/components/prompts/PromptFilters.tsx`, `src/components/shared/Pagination.tsx`, `src/components/shared/TagBadge.tsx`, `src/app/[locale]/prompts/page.tsx`

- [ ] **Step 1: Create prompt server actions**

Create `src/actions/prompts.ts`:

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getPrompts({
  page = 1,
  category,
  tag,
  search,
}: {
  page?: number;
  category?: string;
  tag?: string;
  search?: string;
} = {}) {
  const pageSize = 12;
  const where: any = { status: "PUBLISHED" };
  if (category) where.category = category;
  if (tag) where.tags = { has: tag };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      include: { author: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.prompt.count({ where }),
  ]);

  return { prompts, total, pages: Math.ceil(total / pageSize) };
}

export async function createPrompt(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const prompt = await prisma.prompt.create({
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      tags: (formData.get("tags") as string).split(",").map((t) => t.trim()).filter(Boolean),
      authorId: session.user.id,
      status: "PUBLISHED",
    },
  });

  redirect(`/prompts/${prompt.id}`);
}

export async function downloadPrompt(id: string) {
  await prisma.prompt.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
  });
}
```

Also create `src/app/api/prompts/[id]/download/route.ts` for the actual file download:

```typescript
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prompt = await prisma.prompt.findUnique({ where: { id } });
  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.prompt.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
  });

  const filename = `${prompt.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_")}.txt`;
  return new NextResponse(prompt.content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

- [ ] **Step 2: Create TagBadge component**

Create `src/components/shared/TagBadge.tsx`:

```tsx
export default function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
      {tag}
    </span>
  );
}
```

- [ ] **Step 3: Create Pagination component**

Create `src/components/shared/Pagination.tsx`:

```tsx
import { Link } from "@/i18n/navigation";

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center gap-2 mt-8">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          href={`${basePath}?page=${page}`}
          className={`rounded-lg px-3 py-1 text-sm transition ${
            page === currentPage
              ? "bg-primary text-white"
              : "border border-dark-border text-gray-text hover:text-white"
          }`}
        >
          {page}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create PromptCard component**

Create `src/components/prompts/PromptCard.tsx`:

```tsx
import { Link } from "@/i18n/navigation";
import TagBadge from "@/components/shared/TagBadge";

interface PromptCardProps {
  prompt: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    tags: string[];
    likeCount: number;
    downloadCount: number;
    author: { id: string; name: string };
  };
}

export default function PromptCard({ prompt }: PromptCardProps) {
  return (
    <Link
      href={`/prompts/${prompt.id}`}
      className="group rounded-2xl border border-dark-border bg-dark-card p-5 hover:border-primary/50 transition flex flex-col"
    >
      <span className="font-mono text-xs text-primary">{prompt.category}</span>
      <h3 className="mt-2 font-semibold group-hover:text-primary transition line-clamp-2">
        {prompt.title}
      </h3>
      {prompt.description && (
        <p className="mt-2 text-sm text-gray-text line-clamp-2">{prompt.description}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-1">
        {prompt.tags.slice(0, 3).map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>
      <div className="mt-auto pt-4 flex items-center justify-between text-xs text-gray-text">
        <span>{prompt.author.name}</span>
        <span>{prompt.downloadCount} downloads</span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 5: Create PromptFilters component**

Create `src/components/prompts/PromptFilters.tsx`:

```tsx
"use client";

import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

const categories = ["文献综述", "数据分析", "论文写作", "审稿回复", "选题", "其他"];

export default function PromptFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";

  function setCategory(cat: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) params.set("category", cat);
    else params.delete("category");
    params.delete("page");
    router.push(`/prompts?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setCategory("")}
        className={`rounded-lg px-3 py-1.5 text-sm transition ${
          !currentCategory ? "bg-primary text-white" : "border border-dark-border text-gray-text hover:text-white"
        }`}
      >
        全部
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setCategory(cat)}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            currentCategory === cat ? "bg-primary text-white" : "border border-dark-border text-gray-text hover:text-white"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create prompts list page**

Create `src/app/[locale]/prompts/page.tsx`:

```tsx
import { getPrompts } from "@/actions/prompts";
import PromptCard from "@/components/prompts/PromptCard";
import PromptFilters from "@/components/prompts/PromptFilters";
import Pagination from "@/components/shared/Pagination";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; tag?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const { prompts, pages } = await getPrompts({
    page,
    category: params.category,
    tag: params.tag,
    search: params.search,
  });
  const session = await auth();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Prompt Library</h1>
        {session?.user && (
          <Link
            href="/prompts/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition"
          >
            发布 Prompt
          </Link>
        )}
      </div>
      <PromptFilters />
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </div>
      {prompts.length === 0 && (
        <p className="text-center text-gray-text py-20">暂无内容</p>
      )}
      <Pagination currentPage={page} totalPages={pages} basePath="/prompts" />
    </div>
  );
}
```

- [ ] **Step 7: Verify prompts page renders**

```bash
npm run dev
```

Visit `/zh/prompts` — should see empty state with filters. Stop dev server.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Prompt Library list page with filters and pagination"
```

---

## Task 8: Prompt Detail, Create, Download & Comments

**Files:**
- Create: `src/components/prompts/PromptForm.tsx`, `src/components/shared/CommentSection.tsx`, `src/components/shared/LikeButton.tsx`, `src/actions/comments.ts`, `src/actions/likes.ts`, `src/app/[locale]/prompts/[id]/page.tsx`, `src/app/[locale]/prompts/new/page.tsx`

- [ ] **Step 1: Create comment server actions**

Create `src/actions/comments.ts`:

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { TargetType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getComments(targetType: TargetType, targetId: string) {
  return prisma.comment.findMany({
    where: { targetType, targetId, parentId: null },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createComment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const targetType = formData.get("targetType") as TargetType;
  const targetId = formData.get("targetId") as string;

  await prisma.comment.create({
    data: {
      content: formData.get("content") as string,
      targetType,
      targetId,
      parentId: (formData.get("parentId") as string) || null,
      authorId: session.user.id,
    },
  });

  revalidatePath(`/prompts/${targetId}`);
  revalidatePath(`/community/${targetId}`);
}
```

- [ ] **Step 2: Create like server actions**

Create `src/actions/likes.ts`:

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { TargetType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function toggleLike(targetType: TargetType, targetId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.userLike.findUnique({
    where: {
      userId_targetType_targetId: {
        userId: session.user.id,
        targetType,
        targetId,
      },
    },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.userLike.delete({ where: { id: existing.id } }),
      targetType === "PROMPT"
        ? prisma.prompt.update({ where: { id: targetId }, data: { likeCount: { decrement: 1 } } })
        : prisma.post.update({ where: { id: targetId }, data: { likeCount: { decrement: 1 } } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.userLike.create({
        data: { userId: session.user.id, targetType, targetId },
      }),
      targetType === "PROMPT"
        ? prisma.prompt.update({ where: { id: targetId }, data: { likeCount: { increment: 1 } } })
        : prisma.post.update({ where: { id: targetId }, data: { likeCount: { increment: 1 } } }),
    ]);
  }

  revalidatePath(`/prompts/${targetId}`);
  revalidatePath(`/community/${targetId}`);
}

export async function hasLiked(targetType: TargetType, targetId: string) {
  const session = await auth();
  if (!session?.user?.id) return false;
  const like = await prisma.userLike.findUnique({
    where: {
      userId_targetType_targetId: {
        userId: session.user.id,
        targetType,
        targetId,
      },
    },
  });
  return !!like;
}
```

- [ ] **Step 3: Create LikeButton component**

Create `src/components/shared/LikeButton.tsx`:

```tsx
"use client";

import { toggleLike } from "@/actions/likes";
import { TargetType } from "@prisma/client";
import { useTransition } from "react";

export default function LikeButton({
  targetType,
  targetId,
  likeCount,
  liked,
}: {
  targetType: TargetType;
  targetId: string;
  likeCount: number;
  liked: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => toggleLike(targetType, targetId))}
      className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition ${
        liked
          ? "border-primary text-primary"
          : "border-dark-border text-gray-text hover:text-white"
      }`}
    >
      {liked ? "♥" : "♡"} {likeCount}
    </button>
  );
}
```

- [ ] **Step 4: Create CommentSection component**

Create `src/components/shared/CommentSection.tsx`:

```tsx
"use client";

import { createComment } from "@/actions/comments";
import { TargetType } from "@prisma/client";
import { useRef } from "react";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  isAgentComment: boolean;
  author: { id: string; name: string; avatar: string | null };
  replies?: Comment[];
}

export default function CommentSection({
  targetType,
  targetId,
  comments,
  isLoggedIn,
}: {
  targetType: TargetType;
  targetId: string;
  comments: Comment[];
  isLoggedIn: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    formData.set("targetType", targetType);
    formData.set("targetId", targetId);
    await createComment(formData);
    formRef.current?.reset();
  }

  return (
    <div className="mt-12">
      <h3 className="text-lg font-semibold mb-6">评论 ({comments.length})</h3>

      {isLoggedIn && (
        <form ref={formRef} action={handleSubmit} className="mb-8">
          <textarea
            name="content"
            required
            rows={3}
            placeholder="写下你的评论..."
            className="w-full rounded-xl bg-dark-card border border-dark-border p-4 text-white placeholder:text-gray-text focus:border-primary focus:outline-none resize-none"
          />
          <button
            type="submit"
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition"
          >
            发表评论
          </button>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-xl border border-dark-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold">{comment.author.name}</span>
              {comment.isAgentComment && (
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">via AI Agent</span>
              )}
              <span className="text-xs text-gray-text">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-text">{comment.content}</p>

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 ml-4 flex flex-col gap-3 border-l border-dark-border pl-4">
                {comment.replies.map((reply) => (
                  <div key={reply.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{reply.author.name}</span>
                      {reply.isAgentComment && (
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">via AI Agent</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-text">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create PromptForm component**

Create `src/components/prompts/PromptForm.tsx`:

```tsx
"use client";

import { createPrompt } from "@/actions/prompts";

const categories = ["文献综述", "数据分析", "论文写作", "审稿回复", "选题", "其他"];

export default function PromptForm() {
  return (
    <form action={createPrompt} className="flex flex-col gap-4 max-w-2xl">
      <input
        name="title"
        required
        placeholder="标题"
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <select
        name="category"
        required
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white focus:border-primary focus:outline-none"
      >
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <input
        name="tags"
        placeholder="标签（逗号分隔）"
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <textarea
        name="description"
        rows={2}
        placeholder="简短描述"
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none resize-none"
      />
      <textarea
        name="content"
        required
        rows={10}
        placeholder="Prompt 内容"
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none font-mono text-sm"
      />
      <button
        type="submit"
        className="rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-hover transition self-start"
      >
        发布
      </button>
    </form>
  );
}
```

- [ ] **Step 6: Create prompt detail page**

Create `src/app/[locale]/prompts/[id]/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getComments } from "@/actions/comments";
import { hasLiked, toggleLike } from "@/actions/likes";
import CommentSection from "@/components/shared/CommentSection";
import LikeButton from "@/components/shared/LikeButton";
import TagBadge from "@/components/shared/TagBadge";

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prompt = await prisma.prompt.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });
  if (!prompt) notFound();

  const session = await auth();
  const comments = await getComments("PROMPT", id);
  const liked = await hasLiked("PROMPT", id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <span className="font-mono text-xs text-primary">{prompt.category}</span>
      <h1 className="mt-2 text-3xl font-bold">{prompt.title}</h1>
      {prompt.description && (
        <p className="mt-3 text-gray-text">{prompt.description}</p>
      )}
      <div className="mt-3 flex items-center gap-3 text-sm text-gray-text">
        <span>{prompt.author.name}</span>
        <span>·</span>
        <span>{new Date(prompt.createdAt).toLocaleDateString()}</span>
        <span>·</span>
        <span>{prompt.downloadCount} downloads</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {prompt.tags.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>

      {/* Prompt content */}
      <div className="mt-8 rounded-xl bg-dark-card border border-dark-border p-6">
        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {prompt.content}
        </pre>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <LikeButton targetType="PROMPT" targetId={id} likeCount={prompt.likeCount} liked={liked} />
        <a
          href={`/api/prompts/${id}/download`}
          className="rounded-lg border border-dark-border px-3 py-1.5 text-sm text-gray-text hover:text-white transition"
        >
          下载 .txt
        </a>
      </div>

      {/* Comments */}
      <CommentSection
        targetType="PROMPT"
        targetId={id}
        comments={comments}
        isLoggedIn={!!session?.user}
      />
    </div>
  );
}
```

- [ ] **Step 7: Create prompt new page**

Create `src/app/[locale]/prompts/new/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PromptForm from "@/components/prompts/PromptForm";

export default async function NewPromptPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">发布 Prompt</h1>
      <PromptForm />
    </div>
  );
}
```

- [ ] **Step 8: Verify prompt CRUD flow**

```bash
npm run dev
```

1. Register/login
2. Visit `/zh/prompts/new` — create a prompt
3. Should redirect to detail page
4. Verify like, download count, comments work
5. Visit `/zh/prompts` — should see the prompt in list

Stop dev server.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add Prompt detail, create, download, comments, and likes"
```

## Task 9: Community — Posts & Replies

**Files:**
- Create: `src/actions/community.ts`, `src/components/community/PostCard.tsx`, `src/components/community/PostForm.tsx`, `src/app/[locale]/community/page.tsx`, `src/app/[locale]/community/[id]/page.tsx`, `src/app/[locale]/community/new/page.tsx`

- [ ] **Step 1: Create community server actions**

Create `src/actions/community.ts`:

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getPosts({
  page = 1,
  tag,
}: {
  page?: number;
  tag?: string;
} = {}) {
  const pageSize = 20;
  const where: any = {};
  if (tag) where.tags = { has: tag };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  // Count comments per post (polymorphic — no FK relation)
  const postsWithCounts = await Promise.all(
    posts.map(async (post) => ({
      ...post,
      _count: { comments: await prisma.comment.count({ where: { targetType: "POST", targetId: post.id } }) },
    }))
  );

  return { posts: postsWithCounts, total, pages: Math.ceil(total / pageSize) };
}

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const post = await prisma.post.create({
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      tags: (formData.get("tags") as string || "").split(",").map((t) => t.trim()).filter(Boolean),
      authorId: session.user.id,
    },
  });

  redirect(`/community/${post.id}`);
}
```

- [ ] **Step 2: Create PostCard component**

Create `src/components/community/PostCard.tsx`:

```tsx
import { Link } from "@/i18n/navigation";
import TagBadge from "@/components/shared/TagBadge";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    pinned: boolean;
    isAgentPost: boolean;
    likeCount: number;
    createdAt: Date;
    author: { id: string; name: string };
    _count: { comments: number };
  };
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/community/${post.id}`}
      className="group flex flex-col gap-2 rounded-xl border border-dark-border p-5 hover:border-primary/50 transition"
    >
      <div className="flex items-center gap-2">
        {post.pinned && (
          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">置顶</span>
        )}
        <h3 className="font-semibold group-hover:text-primary transition line-clamp-1">
          {post.title}
        </h3>
      </div>
      <p className="text-sm text-gray-text line-clamp-2">{post.content}</p>
      <div className="flex items-center gap-3 text-xs text-gray-text mt-auto pt-2">
        <span>{post.author.name}</span>
        {post.isAgentPost && (
          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-primary">via AI Agent</span>
        )}
        <span>♥ {post.likeCount}</span>
        <span>{post._count.comments} 回复</span>
        <span className="ml-auto">{new Date(post.createdAt).toLocaleDateString()}</span>
      </div>
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {post.tags.slice(0, 3).map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}
    </Link>
  );
}
```

- [ ] **Step 3: Create PostForm component**

Create `src/components/community/PostForm.tsx`:

```tsx
"use client";

import { createPost } from "@/actions/community";

export default function PostForm() {
  return (
    <form action={createPost} className="flex flex-col gap-4 max-w-2xl">
      <input
        name="title"
        required
        placeholder="帖子标题"
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <input
        name="tags"
        placeholder="标签（逗号分隔）"
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <textarea
        name="content"
        required
        rows={8}
        placeholder="帖子内容..."
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none resize-none"
      />
      <button
        type="submit"
        className="rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-hover transition self-start"
      >
        发布
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Create community list page**

Create `src/app/[locale]/community/page.tsx`:

```tsx
import { getPosts } from "@/actions/community";
import PostCard from "@/components/community/PostCard";
import Pagination from "@/components/shared/Pagination";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const { posts, pages } = await getPosts({ page, tag: params.tag });
  const session = await auth();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Community</h1>
        {session?.user && (
          <Link
            href="/community/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition"
          >
            发帖
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      {posts.length === 0 && (
        <p className="text-center text-gray-text py-20">暂无帖子，来发第一帖吧</p>
      )}
      <Pagination currentPage={page} totalPages={pages} basePath="/community" />
    </div>
  );
}
```

- [ ] **Step 5: Create community post detail page**

Create `src/app/[locale]/community/[id]/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getComments } from "@/actions/comments";
import { hasLiked } from "@/actions/likes";
import CommentSection from "@/components/shared/CommentSection";
import LikeButton from "@/components/shared/LikeButton";
import TagBadge from "@/components/shared/TagBadge";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });
  if (!post) notFound();

  const session = await auth();
  const comments = await getComments("POST", id);
  const liked = await hasLiked("POST", id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <div className="mt-3 flex items-center gap-3 text-sm text-gray-text">
        <span>{post.author.name}</span>
        {post.isAgentPost && (
          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">via AI Agent</span>
        )}
        <span>·</span>
        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
      </div>
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {post.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}

      <div className="mt-8 prose prose-invert max-w-none">
        <p className="whitespace-pre-wrap">{post.content}</p>
      </div>

      <div className="mt-6">
        <LikeButton targetType="POST" targetId={id} likeCount={post.likeCount} liked={liked} />
      </div>

      <CommentSection
        targetType="POST"
        targetId={id}
        comments={comments}
        isLoggedIn={!!session?.user}
      />
    </div>
  );
}
```

- [ ] **Step 6: Create community new post page**

Create `src/app/[locale]/community/new/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PostForm from "@/components/community/PostForm";

export default async function NewPostPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">发帖</h1>
      <PostForm />
    </div>
  );
}
```

- [ ] **Step 7: Verify community flow**

```bash
npm run dev
```

1. Login, visit `/zh/community/new` — create a post
2. Should redirect to post detail
3. Verify like and comment work
4. Visit `/zh/community` — should see the post

Stop dev server.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Community with posts, replies, likes, and comments"
```

---

## Task 10: User Profile Page

**Files:**
- Create: `src/app/[locale]/u/[id]/page.tsx`

- [ ] **Step 1: Create user profile page**

Create `src/app/[locale]/u/[id]/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PromptCard from "@/components/prompts/PromptCard";
import PostCard from "@/components/community/PostCard";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      prompts: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
      posts: {
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          _count: { select: { comments: true } },
        },
      },
    },
  });
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-full bg-dark-card border border-dark-border flex items-center justify-center text-2xl font-bold text-primary">
          {user.name[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          {user.affiliation && <p className="text-sm text-gray-text">{user.affiliation}</p>}
          {user.bio && <p className="mt-1 text-sm text-gray-text">{user.bio}</p>}
        </div>
      </div>

      {user.prompts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">发布的 Prompts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={{ ...prompt, author: { id: user.id, name: user.name } }}
              />
            ))}
          </div>
        </section>
      )}

      {user.posts.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">社区帖子</h2>
          <div className="flex flex-col gap-3">
            {user.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify profile page**

```bash
npm run dev
```

Visit `/zh/u/<your-user-id>` — should show user info and their content. Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add user profile page with published prompts and posts"
```

---

## Task 11: Seed Data & Final Verification

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json`

- [ ] **Step 1: Create seed script**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcryptjs.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ai4econ.com" },
    update: {},
    create: {
      email: "admin@ai4econ.com",
      name: "AI4Econ Admin",
      password,
      role: "ADMIN",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "researcher@example.com" },
    update: {},
    create: {
      email: "researcher@example.com",
      name: "张研究员",
      password,
      affiliation: "北京大学经济学院",
      bio: "专注于宏观经济学与 AI 应用研究",
    },
  });

  // Seed prompts
  const promptData = [
    { title: "文献综述助手", content: "你是一位经济学文献综述专家...", category: "文献综述", tags: ["综述", "文献"], description: "帮助快速生成结构化的文献综述" },
    { title: "Stata 数据清洗", content: "你是一位 Stata 数据处理专家...", category: "数据分析", tags: ["Stata", "数据清洗"], description: "指导 Stata 数据清洗流程" },
    { title: "论文摘要润色", content: "你是一位学术写作专家...", category: "论文写作", tags: ["摘要", "润色"], description: "帮助润色英文论文摘要" },
    { title: "DID 方法论解释", content: "你是一位计量经济学专家...", category: "数据分析", tags: ["DID", "因果推断"], description: "解释双重差分法的原理与应用" },
    { title: "审稿意见回复模板", content: "你是一位期刊审稿回复专家...", category: "审稿回复", tags: ["审稿", "回复"], description: "生成结构化的审稿意见回复" },
  ];

  for (const p of promptData) {
    await prisma.prompt.create({
      data: { ...p, authorId: user.id, status: "PUBLISHED" },
    });
  }

  // Seed posts
  await prisma.post.create({
    data: {
      title: "欢迎来到 AI4Econ 社区",
      content: "这是 AI4Econ 社区的第一帖。欢迎大家在这里交流 AI 在经济学研究中的应用经验。",
      authorId: admin.id,
      pinned: true,
      tags: ["公告"],
    },
  });

  await prisma.post.create({
    data: {
      title: "分享：用 Claude 做文献综述的经验",
      content: "最近尝试用 Claude 辅助文献综述，效果不错。分享一下我的工作流...",
      authorId: user.id,
      tags: ["经验分享", "Claude", "文献综述"],
    },
  });

  console.log("Seed data created successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add seed script to package.json**

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

Install tsx:

```bash
npm install -D tsx
```

- [ ] **Step 3: Run seed**

```bash
npx prisma db seed
```

Expected: "Seed data created successfully"

- [ ] **Step 4: Full verification**

```bash
npm run build
npm run dev
```

Verify all pages:
1. `/zh` — Landing page with all sections
2. `/zh/prompts` — 5 seeded prompts with filters
3. `/zh/prompts/<id>` — Prompt detail with download and comments
4. `/zh/community` — 2 seeded posts (1 pinned)
5. `/zh/community/<id>` — Post detail with replies
6. `/zh/auth/login` — Login with `researcher@example.com` / `password123`
7. `/zh/prompts/new` — Create new prompt
8. `/zh/community/new` — Create new post
9. `/en` — English locale
10. `/zh/u/<id>` — User profile

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add seed data and complete Phase 1 verification"
```
