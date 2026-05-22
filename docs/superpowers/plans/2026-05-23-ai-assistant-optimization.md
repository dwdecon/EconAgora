# AI Assistant Component Optimization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve AI assistant UX (bubble convergence, auth expiry, history panel, abort) and code quality (theme extraction, useMounted hook, setState fix) across 4 component files without visual changes.

**Architecture:** Refactor existing components in-place. Add one shared hook (`useMounted`). No new dependencies. All changes are internal improvements.

**Tech Stack:** React 18, TypeScript, next-intl, @page-agent/core

---

## File Structure

| File | Responsibility | Change Type |
|------|---------------|-------------|
| `src/hooks/useMounted.ts` | Shared mount detection hook | NEW |
| `src/components/ai-assistant/usePageAgent.ts` | Agent logic: activityHistory, AbortController, statuschange fix, onAuthExpired | MODIFY |
| `src/components/ai-assistant/FloatingStar.tsx` | Bubble convergence, i18n, useMounted | MODIFY |
| `src/components/ai-assistant/GlassBar.tsx` | History panel UI, theme extraction, useMounted | MODIFY |
| `src/components/ai-assistant/AiAssistant.tsx` | Auth expiry callback, pass activityHistory | MODIFY |
| `src/i18n/messages/zh.json` | Add bubbleHint key | MODIFY |
| `src/i18n/messages/en.json` | Add bubbleHint key | MODIFY |

---

## Task 1: Create useMounted Hook

**Files:**
- Create: `src/hooks/useMounted.ts`

- [ ] **Step 1: Create useMounted hook file**

```typescript
import { useEffect, useState } from "react";

export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
```

- [ ] **Step 2: Verify file compiles**

Run: `npm run build` or check TypeScript in IDE
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useMounted.ts
git commit -m "feat: add useMounted shared hook"
```

---

## Task 2: Add i18n Keys for Bubble Text

**Files:**
- Modify: `src/i18n/messages/zh.json`
- Modify: `src/i18n/messages/en.json`

- [ ] **Step 1: Add Chinese bubble hint**

In `src/i18n/messages/zh.json`, locate the `aiAssistant` object and add:

```json
"aiAssistant": {
  "bubbleHint": "找不到想要的？试试我吧~",
  // ... existing keys
}
```

- [ ] **Step 2: Add English bubble hint**

In `src/i18n/messages/en.json`, locate the `aiAssistant` object and add:

```json
"aiAssistant": {
  "bubbleHint": "Can't find what you want? Try me~",
  // ... existing keys
}
```

- [ ] **Step 3: Verify JSON syntax**

Run: `npm run build` or check for JSON parse errors
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/i18n/messages/zh.json src/i18n/messages/en.json
git commit -m "feat: add i18n keys for AI assistant bubble hint"
```

---

## Task 3: usePageAgent — Add activityHistory State

**Files:**
- Modify: `src/components/ai-assistant/usePageAgent.ts:10-31` (types)
- Modify: `src/components/ai-assistant/usePageAgent.ts:50-56` (state)

- [ ] **Step 1: Add activityHistory to return type**

In `UsePageAgentReturn` interface (line ~21):

```typescript
export interface UsePageAgentReturn {
  state: PageAgentState;
  errorMsg: string | null;
  activity: ActivityInfo;
  activityHistory: ActivityInfo[];  // ADD THIS
  sendCommand: (command: string) => void;
  retry: () => void;
  open: () => void;
  close: () => void;
  stop: () => void;
  dismissError: () => void;
}
```

- [ ] **Step 2: Add activityHistory state**

In `usePageAgent` hook body (after line ~55):

```typescript
const [activityHistory, setActivityHistory] = useState<ActivityInfo[]>([]);
```

- [ ] **Step 3: Return activityHistory**

In the return statement (line ~254):

```typescript
return { 
  state, 
  errorMsg, 
  activity, 
  activityHistory,  // ADD THIS
  sendCommand, 
  retry, 
  open, 
  close, 
  stop, 
  dismissError 
};
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: Check IDE for type errors
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/ai-assistant/usePageAgent.ts
git commit -m "feat(usePageAgent): add activityHistory state"
```


---

## Task 4: usePageAgent — Populate activityHistory from Events

**Files:**
- Modify: `src/components/ai-assistant/usePageAgent.ts:100-145` (activity listener)

- [ ] **Step 1: Append to history on thinking event**

In the `activity` event listener, `thinking` case (line ~104):

```typescript
case "thinking":
  setState("thinking");
  setActivity((prev) => ({
    ...prev,
    summary: "正在思考…",
    tool: null,
    step: stepRef.current,
  }));
  setActivityHistory((prev) => [
    ...prev,
    { summary: "正在思考…", tool: null, step: stepRef.current },
  ]);
  break;
```

- [ ] **Step 2: Append to history on executing event**

In the `executing` case (line ~112):

```typescript
case "executing":
  setState("acting");
  const execSummary = describeTool(act.tool, act.input);
  setActivity((prev) => ({
    ...prev,
    summary: execSummary,
    tool: act.tool,
    step: stepRef.current,
  }));
  setActivityHistory((prev) => [
    ...prev,
    { summary: execSummary, tool: act.tool, step: stepRef.current },
  ]);
  break;
```

- [ ] **Step 3: Append to history on executed event**

In the `executed` case (line ~123):

```typescript
case "executed":
  setState("acting");
  const execDoneSummary = describeTool(act.tool, act.input) + " ✓";
  setActivity((prev) => ({
    ...prev,
    summary: execDoneSummary,
    tool: act.tool,
    step: stepRef.current,
  }));
  setActivityHistory((prev) => [
    ...prev,
    { summary: execDoneSummary, tool: act.tool, step: stepRef.current },
  ]);
  break;
```

- [ ] **Step 4: Append to history on retrying event**

In the `retrying` case (line ~131):

```typescript
case "retrying":
  setState("acting");
  const retrySummary = `重试中 (${act.attempt}/${act.maxAttempts})…`;
  setActivity((prev) => ({
    ...prev,
    summary: retrySummary,
    tool: null,
    step: stepRef.current,
  }));
  setActivityHistory((prev) => [
    ...prev,
    { summary: retrySummary, tool: null, step: stepRef.current },
  ]);
  break;
```

- [ ] **Step 5: Append to history on error event**

In the `error` case (line ~140):

```typescript
case "error":
  setErrorMsg(act.message);
  setState("error");
  setActivityHistory((prev) => [
    ...prev,
    { summary: act.message, tool: null, step: stepRef.current },
  ]);
  break;
```

- [ ] **Step 6: Reset history in sendCommand**

In `sendCommand` function (line ~193), after `stepRef.current = 0`:

```typescript
setActivityHistory([]);
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: Check IDE for type errors
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add src/components/ai-assistant/usePageAgent.ts
git commit -m "feat(usePageAgent): populate activityHistory from events"
```


---

## Task 5: usePageAgent — Add AbortController Support

**Files:**
- Modify: `src/components/ai-assistant/usePageAgent.ts:61` (add ref)
- Modify: `src/components/ai-assistant/usePageAgent.ts:79-86` (customFetch)
- Modify: `src/components/ai-assistant/usePageAgent.ts:190-219` (sendCommand)
- Modify: `src/components/ai-assistant/usePageAgent.ts:240-246` (stop)

- [ ] **Step 1: Add abortRef**

After `stoppingRef` declaration (line ~61):

```typescript
const abortRef = useRef<AbortController | null>(null);
```

- [ ] **Step 2: Update customFetch to combine signals**

In `customFetch` (line ~79), replace the fetch call:

```typescript
const customFetch: typeof globalThis.fetch = async (input, init) => {
  const token = await getSessionAccessToken();
  const headers = new Headers((init?.headers as HeadersInit | undefined) ?? {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  const combinedSignal = AbortSignal.any(
    [init?.signal, abortRef.current?.signal].filter(Boolean) as AbortSignal[]
  );
  
  try {
    return await globalThis.fetch(input, { ...init, headers, signal: combinedSignal });
  } catch (error: any) {
    if (error.name === "AbortError") {
      return new Response(null, { status: 499 });
    }
    throw error;
  }
};
```

**Note:** `AbortSignal.any()` requires Chrome 116+, Firefox 124+, Safari 17.4+. If targeting older browsers, use a manual combination pattern or polyfill.

- [ ] **Step 3: Abort previous controller in sendCommand**

In `sendCommand`, before creating new controller (line ~193):

```typescript
abortRef.current?.abort();
abortRef.current = new AbortController();
```

- [ ] **Step 4: Abort in stop function**

In `stop()` (line ~240), before `core.stop()`:

```typescript
abortRef.current?.abort();
abortRef.current = null;
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: Check IDE for type errors
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/components/ai-assistant/usePageAgent.ts
git commit -m "feat(usePageAgent): add AbortController for fetch cancellation"
```


---

## Task 6: usePageAgent — Fix Nested setState Anti-pattern

**Files:**
- Modify: `src/components/ai-assistant/usePageAgent.ts:61` (add stateRef)
- Modify: `src/components/ai-assistant/usePageAgent.ts:147-170` (statuschange listener)
- Modify: All setState calls throughout the file

- [ ] **Step 1: Add stateRef**

After other refs (line ~61):

```typescript
const stateRef = useRef<PageAgentState>("idle");
```

- [ ] **Step 2: Create setStateAndRef wrapper**

After `stateRef` declaration and before `initAgent` call (line ~62):

```typescript
const setStateAndRef = useCallback((newState: PageAgentState | ((prev: PageAgentState) => PageAgentState)) => {
  setState((prev) => {
    const next = typeof newState === "function" ? newState(prev) : newState;
    stateRef.current = next;
    return next;
  });
}, []);
```

**Note:** This wrapper is defined at hook body level (not inside `initAgent`) so it's accessible in all setState calls including those in event listeners.

- [ ] **Step 3: Replace all setState calls with setStateAndRef**

Search and replace `setState(` with `setStateAndRef(` throughout the file.

- [ ] **Step 4: Fix statuschange error case**

In `statuschange` listener, `error` case (line ~157):

```typescript
case "error":
  if (stateRef.current !== "error") {
    setErrorMsg("An unknown error occurred.");
  }
  setStateAndRef("error");
  break;
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: Check IDE for type errors
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/components/ai-assistant/usePageAgent.ts
git commit -m "fix(usePageAgent): resolve nested setState anti-pattern"
```


---

## Task 7: usePageAgent — Add onAuthExpired Callback

**Files:**
- Modify: `src/components/ai-assistant/usePageAgent.ts:52` (hook params)
- Modify: `src/components/ai-assistant/usePageAgent.ts:79-86` (customFetch)

- [ ] **Step 1: Add onAuthExpired parameter**

Update `usePageAgent` function signature (line ~52):

```typescript
export function usePageAgent(options?: {
  onAuthExpired?: () => void;
}): UsePageAgentReturn {
```

- [ ] **Step 2: Check 401 in customFetch**

In `customFetch`, after the fetch call (line ~86):

```typescript
const customFetch: typeof globalThis.fetch = async (input, init) => {
  const token = await getSessionAccessToken();
  const headers = new Headers((init?.headers as HeadersInit | undefined) ?? {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  const combinedSignal = AbortSignal.any(
    [init?.signal, abortRef.current?.signal].filter(Boolean) as AbortSignal[]
  );
  
  try {
    const response = await globalThis.fetch(input, { ...init, headers, signal: combinedSignal });
    
    if (response.status === 401) {
      options?.onAuthExpired?.();
      // Set stopping flag to suppress error state in sendCommand
      stoppingRef.current = true;
      throw new Error("Authentication expired");
    }
    
    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      return new Response(null, { status: 499 });
    }
    throw error;
  }
};
```

**Note:** Setting `stoppingRef.current = true` prevents the error from showing in UI before redirect fires.

- [ ] **Step 3: Verify TypeScript compiles**

Run: Check IDE for type errors
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ai-assistant/usePageAgent.ts
git commit -m "feat(usePageAgent): add onAuthExpired callback for 401 handling"
```


---

## Task 8: AiAssistant — Pass onAuthExpired and activityHistory

**Files:**
- Modify: `src/components/ai-assistant/AiAssistant.tsx:12` (usePageAgent call)
- Modify: `src/components/ai-assistant/AiAssistant.tsx:32-40` (handleClick)
- Modify: `src/components/ai-assistant/AiAssistant.tsx:48-58` (GlassBar props)

- [ ] **Step 1: Add onAuthExpired callback to usePageAgent**

**IMPORTANT:** Ensure `useState` for `authState`/`setAuthState` is declared BEFORE the `usePageAgent` call.

Current order (line ~13-16):
```typescript
const [authState, setAuthState] = useState<"unknown" | "yes" | "no">("unknown");

const { state, errorMsg, activity, activityHistory, sendCommand, retry, open, close, stop, dismissError } = usePageAgent({
  onAuthExpired: useCallback(() => {
    sessionStorage.setItem(AUTH_KEY, "0");
    setAuthState("no");
    const currentPath = window.location.pathname;
    window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`;
  }, []),
});
```

This order is correct — `useState` on line 13, `usePageAgent` on line 15. Do not reorder.

- [ ] **Step 2: Pass activityHistory to GlassBar**

In the return statement (line ~48):

```typescript
return (
  <GlassBar
    state={state}
    errorMsg={errorMsg}
    activity={activity}
    activityHistory={activityHistory}
    onSend={sendCommand}
    onRetry={retry}
    onClose={close}
    onStop={stop}
    onDismissError={dismissError}
  />
);
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: Check IDE for type errors
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ai-assistant/AiAssistant.tsx
git commit -m "feat(AiAssistant): add onAuthExpired callback and pass activityHistory"
```


---

## Task 9: GlassBar — Add activityHistory Prop and Render History Panel

**Files:**
- Modify: `src/components/ai-assistant/GlassBar.tsx:10-19` (props interface)
- Modify: `src/components/ai-assistant/GlassBar.tsx:21-39` (component signature)
- Modify: `src/components/ai-assistant/GlassBar.tsx:124-167` (expanded panel)

- [ ] **Step 1: Add activityHistory to props interface**

In `GlassBarProps` (line ~10):

```typescript
interface GlassBarProps {
  state: AssistantState;
  errorMsg: string | null;
  activity: ActivityInfo;
  activityHistory: ActivityInfo[];  // ADD THIS
  onSend: (command: string) => void;
  onRetry: () => void;
  onClose: () => void;
  onStop: () => void;
  onDismissError: () => void;
}
```

- [ ] **Step 2: Destructure activityHistory in component**

Update function signature (line ~21):

```typescript
export default function GlassBar({
  state,
  errorMsg,
  activity,
  activityHistory,  // ADD THIS
  onSend,
  onRetry,
  onClose,
  onStop,
  onDismissError,
}: GlassBarProps) {
```

- [ ] **Step 3: Add auto-scroll ref**

After existing refs (line ~38):

```typescript
const scrollSentinelRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 4: Add auto-scroll effect**

After existing useEffects (line ~84):

```typescript
useEffect(() => {
  if (expanded && scrollSentinelRef.current) {
    scrollSentinelRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [expanded, activityHistory]);
```

- [ ] **Step 5: Replace expanded panel content**

Replace the expanded panel div (lines ~124-167) with:

```typescript
{expanded && isWorking && (
  <div
    className="mb-2 overflow-hidden rounded-[16px] px-4 py-3"
    style={{
      maxHeight: 180,
      overflowY: "auto",
      background: isDark
        ? "linear-gradient(135deg, rgba(30,30,30,0.9), rgba(20,20,20,0.8))"
        : "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(255,255,255,0.62))",
      border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
      boxShadow: isDark
        ? "0 4px 24px rgba(0,0,0,0.3)"
        : "0 4px 24px rgba(0,0,0,0.06)",
      backdropFilter: "blur(40px) saturate(180%)",
      animation: "tissue-pull-out 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      transformOrigin: "bottom center",
    }}
  >
    {activityHistory.length === 0 ? (
      <p
        className="text-sm leading-relaxed"
        style={{ color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.7)" }}
      >
        {t("thinking")}…
      </p>
    ) : (
      <div className="space-y-2">
        {activityHistory.map((item, idx) => {
          const isLast = idx === activityHistory.length - 1;
          return (
            <div
              key={idx}
              style={{ opacity: isLast ? 1 : 0.55 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-semibold"
                  style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)" }}
                >
                  {t("step")} {item.step || idx + 1}
                </span>
                {item.tool && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-md font-medium"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                      color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
                    }}
                  >
                    {item.tool.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.7)" }}
              >
                {item.summary}
              </p>
            </div>
          );
        })}
        <div ref={scrollSentinelRef} />
      </div>
    )}
  </div>
)}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: Check IDE for type errors
Expected: No errors

- [ ] **Step 7: Test in browser**

Run: `npm run dev`, open AI assistant, trigger thinking state, expand panel
Expected: See history list with auto-scroll

- [ ] **Step 8: Commit**

```bash
git add src/components/ai-assistant/GlassBar.tsx
git commit -m "feat(GlassBar): add activity history panel with auto-scroll"
```


---

## Task 10: GlassBar — Extract Theme Styles

**Files:**
- Modify: `src/components/ai-assistant/GlassBar.tsx:340` (add getThemeStyles function)
- Modify: `src/components/ai-assistant/GlassBar.tsx:40` (call getThemeStyles)
- Modify: All inline style ternaries throughout the component

- [ ] **Step 1: Add getThemeStyles function at bottom**

After the `AnimatedDots` component (line ~340):

```typescript
function getThemeStyles(isDark: boolean) {
  return {
    barBg: isDark
      ? "linear-gradient(135deg, rgba(30,30,30,0.75), rgba(20,20,20,0.65), rgba(30,30,30,0.7))"
      : "linear-gradient(135deg, rgba(255,255,255,0.68), rgba(255,255,255,0.48), rgba(255,255,255,0.58))",
    barBorder: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.5)",
    barShadow: isDark
      ? "0 4px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)"
      : "0 4px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
    barHighlight: isDark
      ? "linear-gradient(180deg, rgba(255,255,255,0.04), transparent)"
      : "linear-gradient(180deg, rgba(255,255,255,0.25), transparent)",
    inputColor: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)",
    panelBg: isDark
      ? "linear-gradient(135deg, rgba(30,30,30,0.9), rgba(20,20,20,0.8))"
      : "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(255,255,255,0.62))",
    panelBorder: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
    panelShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.06)",
    labelColor: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
    toolBadgeBg: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
    toolBadgeColor: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
    statusColor: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
    stepColor: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)",
    closeBtnBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    closeBtnBorder: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
    closeBtnColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)",
    stopBtnBg: isDark ? "rgba(255,80,80,0.15)" : "rgba(220,50,50,0.1)",
    stopBtnBorder: isDark ? "1px solid rgba(255,80,80,0.2)" : "1px solid rgba(220,50,50,0.15)",
    stopBtnColor: isDark ? "rgba(255,100,100,0.8)" : "rgba(200,50,50,0.7)",
    sendBtnBg: isDark ? "#fff" : "rgba(0,0,0,0.8)",
    sendBtnShadow: isDark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.15)",
    sendBtnIconColor: isDark ? "#1c1c1c" : "#fff",
    dotColor: isDark ? "#fff" : "#000",
  };
}
```

- [ ] **Step 2: Call getThemeStyles in component**

After `isDark` declaration (line ~40):

```typescript
const theme = getThemeStyles(isDark);
```

- [ ] **Step 3: Replace all inline ternaries with theme references**

Search for all `isDark ?` ternaries in style props and replace with `theme.*` references. This includes:
- Original bar and button styles
- The new history panel JSX added in Task 9 (lines ~124-167)

Examples:
- `background: isDark ? "..." : "..."` → `background: theme.barBg`
- `border: isDark ? "..." : "..."` → `border: theme.barBorder`
- `color: isDark ? "..." : "..."` → `color: theme.inputColor`

- [ ] **Step 4: Verify no visual changes**

Run: `npm run dev`, toggle dark mode, compare before/after
Expected: Identical appearance

- [ ] **Step 5: Commit**

```bash
git add src/components/ai-assistant/GlassBar.tsx
git commit -m "refactor(GlassBar): extract theme styles to getThemeStyles function"
```


---

## Task 11: GlassBar — Use useMounted Hook

**Files:**
- Modify: `src/components/ai-assistant/GlassBar.tsx:1-6` (imports)
- Modify: `src/components/ai-assistant/GlassBar.tsx:34` (replace mounted state)

- [ ] **Step 1: Import useMounted**

Add to imports (line ~1):

```typescript
import { useMounted } from "@/hooks/useMounted";
```

- [ ] **Step 2: Replace mounted state with useMounted**

Remove the local mounted state and effect (lines ~34, ~42-44):

```typescript
// DELETE:
const [mounted, setMounted] = useState(false);
// ...
useEffect(() => {
  setMounted(true);
}, []);

// REPLACE WITH:
const mounted = useMounted();
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: Check IDE for type errors
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ai-assistant/GlassBar.tsx
git commit -m "refactor(GlassBar): use shared useMounted hook"
```

---

## Task 12: FloatingStar — Use useMounted Hook

**Files:**
- Modify: `src/components/ai-assistant/FloatingStar.tsx:1-4` (imports)
- Modify: `src/components/ai-assistant/FloatingStar.tsx:13` (replace mounted state)

- [ ] **Step 1: Import useMounted**

Add to imports (line ~1):

```typescript
import { useMounted } from "@/hooks/useMounted";
```

- [ ] **Step 2: Replace mounted state with useMounted**

Remove the local mounted state and effect (lines ~13, ~18-20):

```typescript
// DELETE:
const [mounted, setMounted] = useState(false);
// ...
useEffect(() => {
  setMounted(true);
}, []);

// REPLACE WITH:
const mounted = useMounted();
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: Check IDE for type errors
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ai-assistant/FloatingStar.tsx
git commit -m "refactor(FloatingStar): use shared useMounted hook"
```


---

## Task 13: FloatingStar — Add i18n for Bubble Text

**Files:**
- Modify: `src/components/ai-assistant/FloatingStar.tsx:1-4` (imports)
- Modify: `src/components/ai-assistant/FloatingStar.tsx:66` (bubble text)

- [ ] **Step 1: Import useTranslations**

Add to imports (line ~1):

```typescript
import { useTranslations } from "next-intl";
```

- [ ] **Step 2: Get translations in component**

After `mounted` declaration (line ~13):

```typescript
const t = useTranslations("aiAssistant");
```

- [ ] **Step 3: Replace hardcoded bubble text**

Replace line ~66:

```typescript
// BEFORE:
找不到想要的？试试我吧~

// AFTER:
{t("bubbleHint")}
```

- [ ] **Step 4: Test in browser**

Run: `npm run dev`, wait for bubble to appear
Expected: Chinese text "找不到想要的？试试我吧~" appears

- [ ] **Step 5: Test English locale**

Switch locale to English in browser
Expected: English text "Can't find what you want? Try me~" appears

- [ ] **Step 6: Commit**

```bash
git add src/components/ai-assistant/FloatingStar.tsx
git commit -m "feat(FloatingStar): use i18n for bubble hint text"
```


---

## Task 14: FloatingStar — Implement Bubble Convergence Strategy

**Files:**
- Modify: `src/components/ai-assistant/FloatingStar.tsx:14-16` (add refs)
- Modify: `src/components/ai-assistant/FloatingStar.tsx:22-43` (replace bubble scheduling logic)

- [ ] **Step 1: Add shownCount ref**

After existing refs (line ~16):

```typescript
const shownCountRef = useRef(0);
const quietTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

- [ ] **Step 2: Check sessionStorage on mount**

Replace the bubble scheduling useEffect (lines ~22-43) with:

```typescript
useEffect(() => {
  if (!mounted) return;

  // Check if maxed out
  if (sessionStorage.getItem('econagora-bubble-maxed')) {
    shownCountRef.current = 3;
    return;
  }

  // First bubble after 5s
  const initialTimer = setTimeout(() => {
    setShowBubble(true);
    shownCountRef.current += 1;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowBubble(false);
      if (shownCountRef.current < 3) {
        startQuietPeriod();
      } else {
        sessionStorage.setItem('econagora-bubble-maxed', '1');
      }
    }, 4000);
  }, 5000);

  return () => {
    clearTimeout(initialTimer);
    if (quietTimerRef.current) clearTimeout(quietTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };
}, [mounted]);
```

- [ ] **Step 3: Add quiet period logic with proper cleanup**

Replace the bubble scheduling useEffect (lines ~22-43) with:

```typescript
useEffect(() => {
  if (!mounted) return;

  // Check if maxed out
  if (sessionStorage.getItem('econagora-bubble-maxed')) {
    shownCountRef.current = 3;
    return;
  }

  let quietTimer: ReturnType<typeof setTimeout> | null = null;
  let isQuietPeriodActive = false;
  
  const resetQuiet = () => {
    if (quietTimer) clearTimeout(quietTimer);
    quietTimer = setTimeout(() => {
      if (shownCountRef.current < 3) {
        setShowBubble(true);
        shownCountRef.current += 1;
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          setShowBubble(false);
          if (shownCountRef.current < 3) {
            isQuietPeriodActive = true;
            window.addEventListener('scroll', resetQuiet);
            window.addEventListener('mousemove', resetQuiet);
            resetQuiet();
          } else {
            sessionStorage.setItem('econagora-bubble-maxed', '1');
          }
        }, 4000);
      }
    }, 30000);
  };

  // First bubble after 5s
  const initialTimer = setTimeout(() => {
    setShowBubble(true);
    shownCountRef.current += 1;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowBubble(false);
      if (shownCountRef.current < 3) {
        isQuietPeriodActive = true;
        window.addEventListener('scroll', resetQuiet);
        window.addEventListener('mousemove', resetQuiet);
        resetQuiet();
      } else {
        sessionStorage.setItem('econagora-bubble-maxed', '1');
      }
    }, 4000);
  }, 5000);

  return () => {
    clearTimeout(initialTimer);
    if (quietTimer) clearTimeout(quietTimer);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isQuietPeriodActive) {
      window.removeEventListener('scroll', resetQuiet);
      window.removeEventListener('mousemove', resetQuiet);
    }
  };
}, [mounted]);
```

- [ ] **Step 4: Test bubble convergence**

Run: `npm run dev`, observe bubble behavior
Expected: 
- First bubble at 5s
- If no interaction for 30s → second bubble
- If interaction within 30s → timer resets
- After 3 bubbles → stops permanently

- [ ] **Step 5: Test sessionStorage persistence**

After seeing 3 bubbles, reload page
Expected: No bubbles appear

- [ ] **Step 6: Commit**

```bash
git add src/components/ai-assistant/FloatingStar.tsx
git commit -m "feat(FloatingStar): implement bubble convergence strategy with 3-bubble limit"
```

---

## Task 15: Final Integration Test

**Files:**
- All modified files

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: No TypeScript errors, build succeeds

- [ ] **Step 2: Test bubble convergence**

Run: `npm run dev`, observe FloatingStar behavior
Expected: Bubble appears max 3 times with 30s quiet periods

- [ ] **Step 3: Test auth expiry**

Mock 401 response or wait for token expiry
Expected: Auto-redirect to login page

- [ ] **Step 4: Test activity history**

Trigger AI assistant, expand thinking panel
Expected: See full history list with auto-scroll

- [ ] **Step 5: Test stop button**

Start AI task, click stop button
Expected: HTTP requests abort immediately

- [ ] **Step 6: Test dark mode**

Toggle dark mode
Expected: All colors match original appearance

- [ ] **Step 7: Test i18n**

Switch between zh/en locales
Expected: Bubble text changes language

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "chore: final integration test passed for AI assistant optimization"
```

