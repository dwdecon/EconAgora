# AI Page Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-page AI assistant that lets logged-in users control the page via natural language, using Page Agent core + custom liquid-glass UI.

**Architecture:** Custom React UI (floating ✦ + glass status bar) → `usePageAgent` hook bridges to `@page-agent/core` + `@page-agent/page-controller`. LLM calls go through `/api/chat` proxy to DeepSeek. No chat history — single-command interface with state machine (idle/input/thinking/acting/error).

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, `@page-agent/core`, `@page-agent/page-controller`, `openai` (server-side), CloudBase auth, `next-intl` for i18n.

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/app/api/chat/route.ts` | SSE proxy: auth check → forward to DeepSeek → stream back |
| Create | `src/components/ai-assistant/AiAssistant.tsx` | Main container: mounts FloatingStar or GlassBar based on state |
| Create | `src/components/ai-assistant/FloatingStar.tsx` | Pure ✦ character, breathing animation, click handler |
| Create | `src/components/ai-assistant/GlassBar.tsx` | Liquid-glass bar: input field, status text, close button |
| Create | `src/components/ai-assistant/usePageAgent.ts` | Hook: init Core + PageController, state machine, auth bridge |
| Modify | `src/app/[locale]/layout.tsx:59` | Add `<AiAssistant />` after `<Footer />` |
| Modify | `src/i18n/messages/zh.json` | Add `aiAssistant` namespace |
| Modify | `src/i18n/messages/en.json` | Add `aiAssistant` namespace |
| Modify | `src/app/globals.css` | Add ✦ animations (breathe, spin, pulse) and glass-bar CSS |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
cd E:/BaiduSyncdisk/01project/EconAgora/AI4Econ
pnpm add @page-agent/core @page-agent/page-controller ai-motion openai zod
```

- [ ] **Step 2: Verify installation**

```bash
cat node_modules/@page-agent/core/package.json | head -5
cat node_modules/@page-agent/page-controller/package.json | head -5
ls node_modules/zod/package.json
```

Expected: both show valid package.json with name and version fields.

- [ ] **Step 3: Commit**

```bash
git add pnpm-lock.yaml package.json
git commit -m "chore: add page-agent and openai dependencies"
```

---

## Task 2: Add CSS Animations

**Files:**
- Modify: `src/app/globals.css`

Add three keyframe animations for the ✦ icon states and the tissue-pull transition. Place them after the existing `@keyframes showcase-fade` block.

- [ ] **Step 1: Add animations**

Add after the `showcase-fade` keyframe block in `globals.css`:

```css
@keyframes star-breathe {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes star-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes star-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.35); opacity: 0.7; }
}

@keyframes dot-fade {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 1; }
}

@keyframes glass-slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

- [ ] **Step 2: Verify dev server starts**

```bash
pnpm dev
```

Expected: no CSS compilation errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add AI assistant CSS animations"
```

---

## Task 3: Add i18n Translations

**Files:**
- Modify: `src/i18n/messages/zh.json`
- Modify: `src/i18n/messages/en.json`

- [ ] **Step 1: Add Chinese translations**

Add `"aiAssistant"` key at the top level of `zh.json`:

```json
"aiAssistant": {
  "placeholder": "输入指令，我来操作页面...",
  "thinking": "正在思考",
  "acting": "正在操作页面",
  "error": "请求失败，请重试",
  "retry": "重试"
}
```

- [ ] **Step 2: Add English translations**

Add `"aiAssistant"` key at the top level of `en.json`:

```json
"aiAssistant": {
  "placeholder": "Type a command...",
  "thinking": "Thinking",
  "acting": "Operating page",
  "error": "Request failed, please retry",
  "retry": "Retry"
}
```

- [ ] **Step 3: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/i18n/messages/zh.json','utf8')); console.log('zh OK')"
node -e "JSON.parse(require('fs').readFileSync('src/i18n/messages/en.json','utf8')); console.log('en OK')"
```

Expected: both print "OK".

- [ ] **Step 4: Commit**

```bash
git add src/i18n/messages/zh.json src/i18n/messages/en.json
git commit -m "feat: add AI assistant i18n translations"
```

---

## Task 4: Create API Route `/api/chat`

**Files:**
- Create: `src/app/api/chat/route.ts`

Follow the existing pattern from `src/lib/cloudbase-server-auth.ts` for auth validation.

- [ ] **Step 1: Create the route handler**

```ts
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { requireCloudBaseUser, badRequest, serverError } from "@/lib/cloudbase-server-auth";

const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY || "sk-91908ab54bf4465f8b32049aecdb7822",
});

export async function POST(request: NextRequest) {
  const auth = await requireCloudBaseUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  let body: { messages?: unknown[]; tools?: unknown[] };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return badRequest("messages is required and must be a non-empty array.");
  }

  try {
    const stream = await deepseek.chat.completions.create({
      model: "deepseek-v4-flash",
      messages: body.messages as any,
      tools: body.tools as any,
      stream: true,
      thinking: { type: "enabled" },
      reasoning_effort: "high",
    });

    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      },
    );
  } catch (error) {
    console.error("DeepSeek API error:", error);
    return serverError("Failed to connect to AI service.");
  }
}
```

- [ ] **Step 2: Verify the route compiles**

```bash
pnpm build 2>&1 | head -20
```

Expected: build succeeds, no type errors for `route.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: add /api/chat SSE proxy for DeepSeek"
```

---

## Task 5: Create `usePageAgent` Hook

**Files:**
- Create: `src/components/ai-assistant/usePageAgent.ts`

This is the core bridge between Page Agent and React state. It initializes the PageController and PageAgentCore, manages the state machine, and handles auth token injection.

**Important:** Before writing this, the implementer must check the actual API surface of `@page-agent/core` and `@page-agent/page-controller` by reading their TypeScript declarations in `node_modules/@page-agent/core/dist/index.d.ts` and `node_modules/@page-agent/page-controller/dist/index.d.ts`. The code below is a best-effort sketch based on the spec and README; exact constructor signatures, event names, and method names must be verified.

**Auth token injection strategy:** The hook must inject the CloudBase access token into requests from `@page-agent/core` to `/api/chat`. Step 1 below checks if Core accepts a `fetch` option. If it does, the custom fetch wrapper in the code below works. If it does NOT accept a `fetch` option, the fallback is: override `window.fetch` temporarily during the Core's `chat()` call, adding the auth header to requests to `/api/chat` only. Example fallback:

```ts
// Fallback if Core doesn't accept custom fetch
const originalFetch = window.fetch;
window.fetch = async (url, init) => {
  if (typeof url === 'string' && url.includes('/api/chat')) {
    const token = await getSessionAccessToken();
    return originalFetch(url, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${token}` } });
  }
  return originalFetch(url, init);
};
try {
  await core.chat(command);
} finally {
  window.fetch = originalFetch;
}
```

- [ ] **Step 1: Read actual Page Agent API types**

```bash
cat node_modules/@page-agent/core/dist/index.d.ts 2>/dev/null | head -80
cat node_modules/@page-agent/page-controller/dist/index.d.ts 2>/dev/null | head -80
```

Use the output to adjust constructor args, event names, and method signatures below.

- [ ] **Step 2: Create the hook**

```ts
"use client";

import { useState, useRef, useCallback } from "react";
import { getSessionAccessToken } from "@/lib/cloudbase";

type AssistantState = "idle" | "input" | "thinking" | "acting" | "error";

export function usePageAgent() {
  const [state, setState] = useState<AssistantState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const lastCommandRef = useRef<string>("");
  const coreRef = useRef<any>(null);
  const controllerRef = useRef<any>(null);
  const initRef = useRef(false);

  const init = useCallback(async () => {
    if (initRef.current) return;
    initRef.current = true;

    const { PageController } = await import("@page-agent/page-controller");
    const { PageAgentCore } = await import("@page-agent/core");

    const controller = new PageController();
    controllerRef.current = controller;

    const core = new PageAgentCore({
      url: "/api/chat",
      model: "deepseek-v4-flash",
      apiKey: "unused",
      pageController: controller,
      fetch: async (url: string, init: RequestInit) => {
        const token = await getSessionAccessToken();
        return fetch(url, {
          ...init,
          headers: {
            ...init.headers,
            Authorization: `Bearer ${token}`,
          },
        });
      },
    });

    // Subscribe to events — verify exact event names from API types
    core.on("thinking", () => setState("thinking"));
    core.on("acting", () => setState("acting"));
    core.on("done", () => setState("input"));
    core.on("error", (err: any) => {
      setErrorMsg(String(err?.message || err || "Unknown error"));
      setState("error");
    });

    coreRef.current = core;
  }, []);

  const sendCommand = useCallback(async (command: string) => {
    lastCommandRef.current = command;
    await init();

    if (!coreRef.current) return;

    setState("thinking");
    try {
      await coreRef.current.chat(command);
    } catch (err: any) {
      setErrorMsg(String(err?.message || err || "Unknown error"));
      setState("error");
    }
  }, [init]);

  const retry = useCallback(() => {
    if (lastCommandRef.current) {
      sendCommand(lastCommandRef.current);
    }
  }, [sendCommand]);

  const open = useCallback(() => {
    setState("input");
    init();
  }, [init]);

  const close = useCallback(() => {
    setState("idle");
  }, []);

  const dismissError = useCallback(() => {
    setState("input");
    setErrorMsg("");
  }, []);

  return { state, errorMsg, sendCommand, retry, open, close, dismissError };
}
```

- [ ] **Step 3: Verify no type errors**

```bash
npx tsc --noEmit src/components/ai-assistant/usePageAgent.ts 2>&1 | head -10
```

Expected: either no errors, or only errors related to Page Agent API surface (fix those based on Step 1 findings).

- [ ] **Step 4: Commit**

```bash
git add src/components/ai-assistant/usePageAgent.ts
git commit -m "feat: add usePageAgent hook for Page Agent bridge"
```

---

## Task 6: Create `FloatingStar` Component

**Files:**
- Create: `src/components/ai-assistant/FloatingStar.tsx`

Pure ✦ text character with breathing animation. Follows the click-outside-dismiss pattern from `Navbar.tsx`'s `UserDropdown`.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useTheme } from "next-themes";

interface FloatingStarProps {
  onClick: () => void;
}

export default function FloatingStar({ onClick }: FloatingStarProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 text-[32px] leading-none cursor-pointer select-none"
      style={{
        color: isDark ? "#fff" : "#000",
        animation: "star-breathe 3s ease-in-out infinite",
      }}
      aria-label="AI Assistant"
    >
      ✦
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ai-assistant/FloatingStar.tsx
git commit -m "feat: add FloatingStar component"
```

---

## Task 7: Create `GlassBar` Component

**Files:**
- Create: `src/components/ai-assistant/GlassBar.tsx`

The liquid-glass status bar. Handles input, thinking, acting, and error states. Uses `useTranslations` for i18n and `useTheme` for dark mode detection.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

type AssistantState = "idle" | "input" | "thinking" | "acting" | "error";

interface GlassBarProps {
  state: AssistantState;
  errorMsg: string;
  onSend: (command: string) => void;
  onRetry: () => void;
  onClose: () => void;
  onDismissError: () => void;
}

export default function GlassBar({
  state,
  errorMsg,
  onSend,
  onRetry,
  onClose,
  onDismissError,
}: GlassBarProps) {
  const t = useTranslations("aiAssistant");
  const { resolvedTheme } = useTheme();
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout>>();

  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-focus input when entering input state
  useEffect(() => {
    if (state === "input") {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [state]);

  // Auto-dismiss error after 8s
  useEffect(() => {
    if (state === "error") {
      autoDismissRef.current = setTimeout(onDismissError, 8000);
      return () => clearTimeout(autoDismissRef.current);
    }
  }, [state, onDismissError]);

  if (!mounted) return null;

  const handleSubmit = () => {
    const cmd = input.trim();
    if (!cmd) return;
    setInput("");
    onSend(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  const starStyle: React.CSSProperties =
    state === "thinking"
      ? { animation: "star-spin 3s linear infinite" }
      : state === "acting"
        ? { animation: "star-pulse 1.2s ease-in-out infinite" }
        : {};

  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[min(92%,520px)]"
      style={{ animation: "glass-slide-up 400ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}
    >
      <div
        className="relative overflow-hidden rounded-[20px]"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(30,30,30,0.75), rgba(20,20,20,0.65), rgba(30,30,30,0.7))"
            : "linear-gradient(135deg, rgba(255,255,255,0.68), rgba(255,255,255,0.48), rgba(255,255,255,0.58))",
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.5)",
          boxShadow: isDark
            ? "0 4px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 4px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
          backdropFilter: "blur(40px) saturate(180%)",
        }}
      >
        {/* Inner glow */}
        <div
          className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none rounded-t-[20px]"
          style={{
            background: isDark
              ? "linear-gradient(180deg, rgba(255,255,255,0.04), transparent)"
              : "linear-gradient(180deg, rgba(255,255,255,0.25), transparent)",
          }}
        />

        <div className="relative flex items-center gap-2.5 px-4 py-2.5">
          {/* ✦ icon */}
          <span
            className="shrink-0 leading-none select-none"
            style={{
              fontSize: state === "thinking" || state === "acting" ? 18 : 16,
              color: isDark ? "#fff" : "#000",
              opacity: state === "input" ? 0.4 : state === "error" ? 0.6 : 1,
              ...starStyle,
            }}
          >
            ✦
          </span>

          {/* Input state */}
          {state === "input" && (
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("placeholder")}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)" }}
            />
          )}

          {/* Thinking / Acting status */}
          {(state === "thinking" || state === "acting") && (
            <div
              className="flex-1 text-sm flex items-center gap-0.5"
              style={{ color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.65)" }}
            >
              {t(state === "thinking" ? "thinking" : "acting")}
              <AnimatedDots isDark={isDark} />
            </div>
          )}

          {/* Error state */}
          {state === "error" && (
            <div className="flex-1 flex items-center gap-3">
              <span className="text-sm text-red-500">{errorMsg || t("error")}</span>
              <button
                onClick={onRetry}
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{
                  background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                  color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                  border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.06)",
                }}
              >
                {t("retry")}
              </button>
            </div>
          )}

          {/* Send button (input state) */}
          {state === "input" && (
            <button
              onClick={handleSubmit}
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: isDark ? "#fff" : "rgba(0,0,0,0.8)",
                boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.15)",
              }}
            >
              <span style={{ color: isDark ? "#1c1c1c" : "#fff", fontSize: 16 }}>↑</span>
            </button>
          )}

          {/* Close button (thinking / acting / error) */}
          {state !== "input" && (
            <button
              onClick={state === "error" ? onDismissError : onClose}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
                color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)",
                fontSize: 12,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AnimatedDots({ isDark }: { isDark: boolean }) {
  const color = isDark ? "#fff" : "#000";
  return (
    <span className="inline-flex gap-[2px] ml-0.5">
      {[0, 0.2, 0.4].map((delay) => (
        <span
          key={delay}
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            backgroundColor: color,
            animation: `dot-fade 1.4s ease-in-out ${delay}s infinite`,
          }}
        />
      ))}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ai-assistant/GlassBar.tsx
git commit -m "feat: add GlassBar liquid-glass status bar component"
```

---

## Task 8: Create `AiAssistant` Container

**Files:**
- Create: `src/components/ai-assistant/AiAssistant.tsx`

Main container that orchestrates FloatingStar and GlassBar. Handles login guard.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import FloatingStar from "./FloatingStar";
import GlassBar from "./GlassBar";
import { usePageAgent } from "./usePageAgent";
import { getSessionAccessToken } from "@/lib/cloudbase";

export default function AiAssistant() {
  const { state, errorMsg, sendCommand, retry, open, close, dismissError } = usePageAgent();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getSessionAccessToken().then((token) => {
      setIsLoggedIn(!!token);
      setChecked(true);
    });
  }, []);

  const handleClick = useCallback(() => {
    if (!checked) return;
    if (!isLoggedIn) {
      const currentPath = window.location.pathname;
      window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`;
      return;
    }
    open();
  }, [checked, isLoggedIn, open]);

  if (!checked) return null;

  if (state === "idle") {
    return <FloatingStar onClick={handleClick} />;
  }

  return (
    <GlassBar
      state={state}
      errorMsg={errorMsg}
      onSend={sendCommand}
      onRetry={retry}
      onClose={close}
      onDismissError={dismissError}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ai-assistant/AiAssistant.tsx
git commit -m "feat: add AiAssistant container with login guard"
```

---

## Task 9: Mount in Layout

**Files:**
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Add dynamic import and mount**

At the top of `layout.tsx`, add after the existing imports:

```ts
import dynamic from "next/dynamic";

const AiAssistant = dynamic(
  () => import("@/components/ai-assistant/AiAssistant"),
  { ssr: false },
);
```

Then in the JSX, add `<AiAssistant />` after `<Footer />`:

```tsx
<Footer />
<AiAssistant />
```

- [ ] **Step 2: Verify dev server renders**

```bash
pnpm dev
```

Open the site. Expected:
- ✦ appears at bottom-right with breathing animation
- Clicking ✦ while logged out redirects to login
- After login, clicking ✦ opens the glass bar

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/layout.tsx
git commit -m "feat: mount AiAssistant in root layout"
```

---

## Task 10: Integration Test

**Files:** None (manual testing)

- [ ] **Step 1: Test full flow with dev server**

```bash
pnpm dev
```

Checklist:
- [ ] ✦ visible on all pages (bottom-right, breathing animation)
- [ ] Click ✦ while logged out → redirects to `/zh/auth/login`
- [ ] Login → ✦ still visible
- [ ] Click ✦ → glass bar slides up with elastic animation
- [ ] Type a command (e.g. "回到首页") → press Enter
- [ ] State changes to "正在思考..." with ✦ spinning
- [ ] State changes to "正在操作页面..." with ✦ pulsing
- [ ] Page navigates/scrolls as commanded
- [ ] State returns to input (glass bar shows input field again)
- [ ] Press Escape or click ✕ → glass bar slides down, ✦ returns
- [ ] Dark mode toggle → glass bar switches to dark theme
- [ ] Mobile viewport → glass bar takes full width

- [ ] **Step 2: Test error handling**

- Open browser DevTools → Network → block requests to `/api/chat`
- Send a command → expect error state with retry button
- Click retry → should re-attempt
- Wait 8 seconds → error auto-dismisses

- [ ] **Step 3: Commit any fixes**

If any fixes were needed during testing, commit them:

```bash
git add -u
git commit -m "fix: AI assistant integration adjustments"
```

---

## Notes for Implementer

1. **Page Agent API verification (Task 5, Step 1) is critical.** The exact constructor signatures, event names, and method names must match what `@page-agent/core` and `@page-agent/page-controller` actually export. Read the `.d.ts` files before writing the hook.

2. **Auth token injection fallback is provided above** (window.fetch override). Use the `fetch` constructor option if Core supports it; otherwise use the fallback.

3. **No existing dynamic imports in the codebase.** Task 9 introduces `next/dynamic` for the first time. This is standard Next.js but worth noting.

4. **`useTheme` from `next-themes` is used for the first time.** While `ThemeProvider` is set up in `layout.tsx`, no existing component calls `useTheme` or reads `resolvedTheme`. The `FloatingStar` and `GlassBar` components are the first to do so. This is architecturally correct but note it introduces a new pattern.

5. **`thinking` and `reasoning_effort` params** are DeepSeek-specific. If the OpenAI SDK types complain, cast with `as any` since DeepSeek accepts these params even though the types may not include them.
