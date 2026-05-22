# Plan Fixes for AI Assistant Optimization

## Issue 1: Task 6 Step 2 — setStateAndRef scope clarification

**Problem:** The wrapper is defined inside the hook but needs to be accessible in all setState calls, including those inside the `initAgent` async closure.

**Fix:** Change Step 2 instruction to:

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
```

---

## Issue 2: Task 10 Step 3 — Clarify coverage of Task 9's new JSX

**Problem:** Task 9 adds new history panel JSX with isDark ternaries. Task 10's extraction must cover these too.

**Fix:** Update Task 10 Step 3 to:

```
- [ ] **Step 3: Replace all inline ternaries with theme references**

Search for all `isDark ?` ternaries in style props and replace with `theme.*` references. This includes:
- Original bar and button styles
- The new history panel JSX added in Task 9 (lines ~124-167)

Examples:
- `background: isDark ? "..." : "..."` → `background: theme.barBg`
- `border: isDark ? "..." : "..."` → `border: theme.barBorder`
- `color: isDark ? "..." : "..."` → `color: theme.inputColor`
```

---

## Issue 3: Task 5 — Add AbortSignal.any browser compatibility note

**Problem:** `AbortSignal.any()` is only available in Chrome 116+, Firefox 124+, Safari 17.4+.

**Fix:** Add note after Task 5 Step 2:

```
**Note:** `AbortSignal.any()` requires Chrome 116+, Firefox 124+, Safari 17.4+. If targeting older browsers, use a manual combination pattern or polyfill.
```

---

## Issue 4: Task 7 Step 2 — Fix AuthExpiredError propagation

**Problem:** Generic `Error` propagates to sendCommand's catch block, showing transient error state before redirect.

**Fix:** Update Task 7 Step 2 code to:

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

Add note: "Setting `stoppingRef.current = true` prevents the error from showing in UI before redirect fires."

---

## Issue 5: Task 14 — Fix startQuietPeriod memory leak

**Problem:** Event listeners not removed on unmount if timer hasn't fired.

**Fix:** Replace Task 14 Step 3 with refactored version:

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

Remove the separate `startQuietPeriod` function from Step 3 — it's now integrated into the main useEffect.
```

---

## Issue 6: Task 8 Step 1 — Clarify useState declaration order

**Problem:** `setAuthState` referenced in usePageAgent callback but may not be declared yet.

**Fix:** Update Task 8 Step 1 to:

```
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
```
