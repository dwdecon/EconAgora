# AI Page Assistant — Design Spec

Date: 2026-05-18

## Overview

Add an in-page AI assistant to AI4Econ that lets logged-in users control the page via natural language. Uses Page Agent's core engine (`@page-agent/core` + `@page-agent/page-controller`) from the [Alibaba Page Agent monorepo](https://github.com/alibaba/page-agent) (npm published, MIT license) for LLM orchestration and DOM manipulation, with a fully custom liquid-glass UI.

## Architecture

### Approach: Core + PageController + Custom UI (Plan B)

Use only `@page-agent/core` and `@page-agent/page-controller` from the Page Agent monorepo. The UI is entirely custom — no `@page-agent/ui` dependency. This gives full control over the "tissue-pull" animation and liquid-glass aesthetic while leveraging Page Agent's proven reflection-before-action loop and DOM action system.

### Data Flow

```
User clicks ✦ → Glass bar slides up → User types command
  ↓
Custom UI → usePageAgent hook → PageAgentCore
  ↓
Core calls /api/chat (proxy) → DeepSeek API → streaming response
  ↓
Core triggers PageController → DOM actions (click/type/scroll)
  ↓
PageController + ai-motion → visual feedback on page elements
  ↓
UI state updates (thinking/acting/idle)
```

### Layers

| Layer | Responsibility | Implementation |
|-------|---------------|----------------|
| UI | Floating ✦ button, liquid-glass status bar, animations | Custom React components, no external UI lib |
| Hook | State machine, bridges UI ↔ Core | `usePageAgent` custom hook |
| Core | LLM tool orchestration, system prompts, auto-fix | `@page-agent/core` |
| Page Control | DOM parsing, element actions, visual feedback | `@page-agent/page-controller` + `ai-motion` |
| API Proxy | Auth check, key hiding, request forwarding | Next.js Route Handler `/api/chat` |

## UI Design

### Icon

All icons use the text character `✦` (U+2726). No SVG or image assets.

- Light mode: `color: #000`
- Dark mode: `color: #fff`
- Font: renders correctly in Sora, Noto Sans SC, system fonts

### States

The assistant has 5 states:

#### 1. Idle — Collapsed

- Right side of page, positioned `bottom: 24px; right: 24px`
- Single `✦` character, `font-size: 32px`, no border/frame
- Breathing animation: `opacity 0.6 ↔ 1`, 3s cycle, ease-in-out

#### 2. Input — Glass bar expanded

- Clicking ✦ triggers "tissue-pull" animation: bar slides up from bottom
- Animation: `translateY(100%) → 0`, `cubic-bezier(0.34, 1.56, 0.64, 1)`, 400ms
- Liquid-glass horizontal bar, centered at bottom, `max-width: 520px`
- Glass effect: `backdrop-filter: blur(40px) saturate(180%)`, semi-transparent gradient background, inner glow highlight layer, `1px solid rgba(255,255,255,0.5)` border
- Content: `✦` icon (16px, opacity 0.4) + text input placeholder "输入指令，我来操作页面..." + send button (dark rounded rect with ↑ arrow)
- Responsive: full width on mobile, max 520px on desktop

#### 3. Thinking — LLM processing

- Same glass bar, input replaced by status display
- `✦` at 18px with slow rotation animation (3s per revolution)
- Text: "正在思考" + three animated dots (`.`, `.`, `.`) that fade in sequentially, 1.4s cycle, 0.2s stagger
- Close button (✕) available

#### 4. Acting — DOM operations in progress

- `✦` at 18px with pulse animation (`scale 1 → 1.35`, 1.2s cycle)
- Text: "正在操作页面" + same three animated dots
- Page elements highlighted/clicked by PageController via ai-motion
- Close button (✕) available

#### 5. Error — Request or execution failed

- Same glass bar, shows error message
- `✦` static at 16px, opacity 0.6
- Text: error description in red tint (e.g. "请求失败，请重试")
- Two actions: "重试" (retry last command → back to thinking) and ✕ (dismiss → back to input)
- Auto-dismiss after 8 seconds → back to input state

### Dark Mode

| Element | Light | Dark |
|---------|-------|------|
| ✦ color | `#000` | `#fff` |
| Glass background | `rgba(255,255,255,0.48-0.68)` gradient | `rgba(20-30,20-30,20-30,0.65-0.75)` gradient |
| Glass border | `rgba(255,255,255,0.5)` | `rgba(255,255,255,0.1)` |
| Text color | `rgba(0,0,0,0.65)` | `rgba(255,255,255,0.65)` |
| Send button | `rgba(0,0,0,0.8)` bg, white arrow | `#fff` bg, dark arrow |
| Inner glow | `rgba(255,255,255,0.25)` | `rgba(255,255,255,0.04)` |

### State Machine

```
idle → (click ✦) → input → (send) → thinking → (tool call) → acting → (done) → input
                                              ↓ (error)                    ↓ (error)
                                            error → (retry) → thinking
                                              ↓ (✕)
                                             input
                                      acting ↓ (✕ / click outside)
                                            idle
```

No chat history. The bar is a single-command interface: input → status → done → ready for next command.

### Login Guard

- Floating ✦ visible to all users
- Clicking while not logged in: redirect to login page instead of expanding bar

## Backend

### API Route: `/api/chat`

```
POST /api/chat
Authorization: Bearer <cloudbase-auth-token>
Content-Type: application/json

{
  "messages": [...],
  "tools": [...],
  "model": "deepseek-chat"
}
```

**Flow:**
1. Validate CloudBase auth token from Authorization header
2. If invalid/missing → return 401
3. Forward request to `https://api.deepseek.com/v1/chat/completions`
4. Inject `DEEPSEEK_API_KEY` from server environment variable
5. Stream response back as SSE — transparent passthrough of DeepSeek's OpenAI-compatible SSE format
6. Return tool calls for Core to execute via PageController

**Streaming implementation:**
```ts
// route.ts — transparent SSE proxy
export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  // validate CloudBase token → 401 if invalid
  const body = await req.json();
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({ ...body, stream: true }),
  });
  // Pipe DeepSeek's SSE response directly to client
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

The Core expects standard OpenAI SSE wire format (`data: {"choices":[{"delta":...}]}\n\n`), which DeepSeek provides natively. The proxy is a transparent pipe — no transformation needed.

**Environment variable:** `DEEPSEEK_API_KEY` set in Vercel/CloudBase

### LLM Configuration

- **Provider:** DeepSeek
- **Model:** `deepseek-chat` (DeepSeek-V3)
- **Endpoint:** `https://api.deepseek.com/v1/chat/completions` (OpenAI-compatible)
- **API Key:** server-side only, never exposed to browser

## File Structure

```
src/
  components/
    ai-assistant/
      AiAssistant.tsx       # Main container, loaded via dynamic(import, { ssr: false })
      FloatingStar.tsx      # Floating ✦ button with breathing animation
      GlassBar.tsx          # Liquid-glass status bar (input/thinking/acting states)
      usePageAgent.ts       # Hook: init Core + PageController, bridge UI ↔ Core state
  app/
    api/
      chat/
        route.ts            # POST handler: auth → proxy to DeepSeek → stream back
```

All components use React built-in hooks (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`). No external UI libraries.

## Dependencies (new)

| Package | Version | Purpose |
|---------|---------|---------|
| `@page-agent/core` | ^1.6 | Tool orchestration, system prompts, auto-fix. Published to npm from [github.com/alibaba/page-agent](https://github.com/alibaba/page-agent) |
| `@page-agent/page-controller` | ^1.7 | DOM parsing, element actions, visual mask. Same source |
| `ai-motion` | ^0.4 | Cursor/click animations on page elements. Peer dependency of page-controller, provides visual feedback (animated cursor, click ripple, highlight overlay). Initialized automatically when PageController is created — zero-config |
| `zod` | already in project | Schema validation (Page Agent peer dependency) |

## Technical Notes

### SSR Compatibility

The entire `AiAssistant` component tree is client-only (`'use client'`) and loaded via:

```ts
const AiAssistant = dynamic(
  () => import('@/components/ai-assistant/AiAssistant'),
  { ssr: false }
)
```

### Core Bridge Pattern

`usePageAgent` hook bridges Page Agent Core events to React state:

```ts
// Simplified bridge — usePageAgent hook
const controller = new PageController();
const core = new PageAgentCore({
  url: '/api/chat',  // our proxy endpoint
  model: 'deepseek-chat',
  apiKey: 'unused',  // real key is server-side; Core requires a non-empty string
  pageController: controller,
  // Inject CloudBase auth token via custom fetch wrapper
  fetch: async (url, init) => {
    const token = await cloudbaseAuth.getAccessToken();
    return fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
  },
});

// Subscribe to state changes
core.on('thinking', () => setState('thinking'));
core.on('acting', () => setState('acting'));
core.on('done', () => setState('input'));
core.on('error', (err) => setState('error'));
```

### Custom System Prompt

Add site-specific instructions to help the agent understand AI4Econ's structure:

- Available pages: prompts, skills, tools, blog, community, account
- Content categories and subcategories
- Navigation patterns (sidebar filters, search)
- Form fields for content creation

### Visual Feedback

PageController's ai-motion provides visual feedback during DOM operations:
- Animated cursor following the agent's "click" position
- Click ripple effect on target elements
- Highlight overlay on elements being interacted with

These animations integrate automatically when PageController is initialized.

### Mounting Point

`<AiAssistant />` is mounted in `src/app/[locale]/layout.tsx` as a sibling of `{children}`, inside the existing `<main>` element. It appears on all pages.

- The floating ✦ uses `position: fixed; z-index: 40` — below the Navbar's `z-index: 50` so it doesn't overlap navigation
- The glass bar uses `position: fixed; z-index: 40` with a semi-transparent backdrop, so it layers behind the Navbar but above page content

### i18n

Status messages use `next-intl` `useTranslations('aiAssistant')` with keys:
- `placeholder`: "输入指令，我来操作页面..." / "Type a command..."
- `thinking`: "正在思考" / "Thinking"
- `acting`: "正在操作页面" / "Operating page"
- `error`: "请求失败，请重试" / "Request failed, please retry"
- `retry`: "重试" / "Retry"

Translation files added to `src/i18n/messages/zh.json` and `src/i18n/messages/en.json`.

## Access Control

- **Requirement:** User must be logged in (CloudBase auth)
- **Check:** Client-side reads auth state from CloudBase SDK; server-side validates Bearer token in `/api/chat`
- **Not logged in:** Clicking ✦ redirects to `/[locale]/auth/login`
