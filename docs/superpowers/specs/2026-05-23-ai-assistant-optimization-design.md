# AI Assistant Component Optimization — Design Spec

## Goal

Improve the AI assistant's UX and code quality across all four component files (`FloatingStar.tsx`, `GlassBar.tsx`, `AiAssistant.tsx`, `usePageAgent.ts`) without changing the visual appearance or external API.

## Scope

8 optimization items. One item (#6 describeTool i18n) is explicitly deferred.

---

## 1. FloatingStar Bubble Convergence Strategy

**File:** `src/components/ai-assistant/FloatingStar.tsx`

**Problem:** The speech bubble fires every 10s indefinitely, becoming a persistent distraction on long-lived pages.

**Design:**

- **On mount:** Check `sessionStorage.getItem('econagora-bubble-maxed')`. If set, skip all scheduling (set `shownCount = 3` and return early).
- First bubble appears 5s after mount (unchanged).
- After the bubble hides, enter a 30s quiet period.
- During quiet period, listen for `scroll` and `mousemove` on `window`.
  - Any interaction resets the 30s timer.
  - 30s of silence → show bubble again.
- Maintain a `shownCount` ref. Once `shownCount >= 3`, stop scheduling entirely and set `sessionStorage.setItem('econagora-bubble-maxed', '1')`.
- Remove the existing `setInterval(10000)` loop entirely.

**Bubble text i18n:**

- Move `"找不到想要的？试试我吧~"` to `src/i18n/messages/zh.json` under `aiAssistant.bubbleHint`.
- Add English equivalent to `en.json`: `"Can't find what you want? Try me~"`.
- `FloatingStar` reads the string via `useTranslations("aiAssistant")`.

---

## 2. Auth Expiry — Auto-redirect on 401

**Files:** `src/components/ai-assistant/AiAssistant.tsx`, `src/components/ai-assistant/usePageAgent.ts`

**Problem:** `sessionStorage` caches `AUTH_KEY = "1"` but token can expire or be revoked. The user sees an input bar but every API call silently fails with 401.

**Design:**

- `usePageAgent` accepts an optional `onAuthExpired?: () => void` callback.
- Inside `customFetch`: after `globalThis.fetch(…)`, check `response.status === 401`.
  - If 401: call `onAuthExpired()`, then throw a custom `AuthExpiredError` so the execute chain aborts cleanly.
- `AiAssistant.tsx` passes `onAuthExpired` that:
  1. Clears `sessionStorage.setItem(AUTH_KEY, "0")`.
  2. Sets `authState = "no"`.
  3. Redirects: `window.location.href = /auth/login?callbackUrl=…`.

**Why `onAuthExpired` callback instead of direct redirect in the hook:** The hook has no awareness of routing or auth storage; the container component owns that concern.

---

## 3. Activity History Panel (Full Scrollable)

**Files:** `src/components/ai-assistant/usePageAgent.ts`, `src/components/ai-assistant/GlassBar.tsx`, `src/components/ai-assistant/AiAssistant.tsx`

**Problem:** The expanded thinking panel only shows the current step's summary. Users cannot review what the agent did previously.

**Design — Data:**

- `usePageAgent` adds a new state: `activityHistory: ActivityInfo[]`.
- Every `activity` event appends to `activityHistory`:
  - `thinking` → `{ summary: "正在思考…", tool: null, step: stepRef.current }`
  - `executing` → `{ summary: describeTool(…), tool: act.tool, step: stepRef.current }`
  - `executed` → `{ summary: describeTool(…) + " ✓", tool: act.tool, step: stepRef.current }`
  - `retrying` → `{ summary: "重试中 (${act.attempt}/${act.maxAttempts})…", tool: null, step: stepRef.current }`
  - `error` → `{ summary: act.message, tool: null, step: stepRef.current }`
- `sendCommand` resets `activityHistory` to `[]`.
- Expose `activityHistory` in the `UsePageAgentReturn` type.
- Add `activityHistory: ActivityInfo[]` to `GlassBarProps` interface.
- `AiAssistant.tsx` passes `activityHistory={activityHistory}` to `<GlassBar />`.

**Design — UI (`GlassBar`):**

- The expanded panel renders `activityHistory` as a vertical list, newest at bottom.
- Fixed max-height: `180px` (unchanged from current), `overflow-y: auto`.
- Auto-scroll to bottom on new entries (via `scrollIntoView` on a sentinel div).
- Each entry shows: step number badge + tool tag (if present) + summary text.
- Current (last) entry: full opacity. Previous entries: `opacity: 0.55`.
- When `activityHistory.length === 0` and agent is working, show `t("thinking")` (i18n) with trailing ellipsis as placeholder.

---

## 4. AbortController for Fetch Cancellation

**File:** `src/components/ai-assistant/usePageAgent.ts`

**Problem:** `stop()` calls `core.stop()` but already-dispatched HTTP requests run to completion.

**Design:**

- Add `abortRef = useRef<AbortController | null>(null)`.
- `sendCommand`: abort any previous controller, then create a new `AbortController` and store in `abortRef`.
- `customFetch`: combine signals using `AbortSignal.any([init?.signal, abortRef.current?.signal].filter(Boolean))` so both the core's signal and the hook's signal can cancel the request.
- `stop()`: call `abortRef.current?.abort()` before `core.stop()`. Reset ref to null.
- In `customFetch`, catch errors: if `error.name === "AbortError"`, silently return an empty Response (do not set error state).

---

## 5. Fix Nested setState Anti-pattern in statuschange

**File:** `src/components/ai-assistant/usePageAgent.ts`

**Problem:** The `statuschange` handler uses `setState((prev) => { if (prev !== "error") setErrorMsg(…); return "error" })` — calling a setter inside another setter's updater function. This is a React anti-pattern that can cause issues in StrictMode.

**Design:**

- Add `stateRef = useRef<PageAgentState>("idle")` to track current state synchronously.
- Update `stateRef.current` alongside every `setState` call.
- In the `statuschange` `"error"` case: use `stateRef.current` to decide whether to call `setErrorMsg`, then call `setState("error")` separately.
- Pattern: read ref → conditionally set error msg → set state. No nesting.

---

## 6. describeTool i18n — DEFERRED

Not included in this round. The Chinese hardcoded strings in `describeTool` stay as-is. Will be addressed in a future i18n sweep.

---

## 7. GlassBar Theme Styles Extraction

**File:** `src/components/ai-assistant/GlassBar.tsx`

**Problem:** 50+ lines of `isDark ? "rgba(…)" : "rgba(…)"` ternaries scattered across JSX make the component hard to read.

**Design:**

- Extract a pure function `getThemeStyles(isDark: boolean)` at the bottom of `GlassBar.tsx` (not exported).
- Returns a flat object with all color/style values used in the component. The implementer should identify all `isDark ?` ternaries and extract them into named keys. Minimum set includes: `barBg`, `barBorder`, `barShadow`, `barHighlight`, `inputColor`, `panelBg`, `panelBorder`, `panelShadow`, `labelColor`, `toolBadgeBg`, `toolBadgeColor`, `statusColor`, `stepColor`, `closeBtnBg`, `closeBtnBorder`, `closeBtnColor`, `stopBtnBg`, `stopBtnBorder`, `stopBtnColor`, `sendBtnBg`, `sendBtnShadow`, `sendBtnIconColor`, `dotColor`. Add additional keys as needed to cover all ternaries.
- Each JSX element references `theme.barBg` etc. instead of inline ternaries.
- The function is called once per render: `const theme = getThemeStyles(isDark)`.
- No visual change. Pure refactor.

---

## 8. Shared `useMounted` Hook

**File (new):** `src/hooks/useMounted.ts`

**Problem:** Both `FloatingStar` and `GlassBar` independently implement the same mounted-state pattern.

**Design:**

```ts
import { useEffect, useState } from "react";

export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
```

- Replace the local `mounted` state + effect in `FloatingStar.tsx` and `GlassBar.tsx` with `useMounted()`.
- Delete the local `mounted`/`setMounted` declarations and the corresponding `useEffect`.

---

## File Change Summary

| File | Changes |
|---|---|
| `src/hooks/useMounted.ts` | **NEW** — shared hook |
| `src/components/ai-assistant/FloatingStar.tsx` | Bubble convergence strategy, i18n text, useMounted |
| `src/components/ai-assistant/GlassBar.tsx` | History panel UI, theme styles extraction, useMounted |
| `src/components/ai-assistant/AiAssistant.tsx` | onAuthExpired callback, 401 redirect, pass activityHistory prop |
| `src/components/ai-assistant/usePageAgent.ts` | activityHistory state, AbortController, statuschange fix, onAuthExpired |
| `src/i18n/messages/zh.json` | Add `aiAssistant.bubbleHint` |
| `src/i18n/messages/en.json` | Add `aiAssistant.bubbleHint` |

## Constraints

- No visual appearance changes to existing elements (exception: expanded panel max-height stays at 180px, not increased to 240px).
- No new dependencies.
- All existing functionality preserved.
- `describeTool` Chinese hardcoding stays (deferred).
