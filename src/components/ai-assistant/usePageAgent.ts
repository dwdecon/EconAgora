"use client";

import { useCallback, useRef, useState } from "react";
import { getSessionAccessToken } from "@/lib/cloudbase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PageAgentState = "idle" | "input" | "thinking" | "acting" | "error";

export interface UsePageAgentReturn {
  state: PageAgentState;
  errorMsg: string | null;
  sendCommand: (command: string) => void;
  retry: () => void;
  open: () => void;
  close: () => void;
  dismissError: () => void;
}

// ---------------------------------------------------------------------------
// Lazy-loaded module refs (browser-only)
// ---------------------------------------------------------------------------

type PageAgentCoreType = import("@page-agent/core").PageAgentCore;
type PageControllerType = import("@page-agent/page-controller").PageController;

interface AgentRefs {
  controller: PageControllerType;
  core: PageAgentCoreType;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePageAgent(): UsePageAgentReturn {
  const [state, setState] = useState<PageAgentState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Persisted refs — survive re-renders without triggering them
  const agentRef = useRef<AgentRefs | null>(null);
  const lastCommandRef = useRef<string | null>(null);
  const initPromiseRef = useRef<Promise<AgentRefs> | null>(null);

  // ---------------------------------------------------------------------------
  // Init (lazy, idempotent)
  // ---------------------------------------------------------------------------

  const initAgent = useCallback(async (): Promise<AgentRefs> => {
    // Return existing instance if already initialised
    if (agentRef.current) return agentRef.current;

    // Deduplicate concurrent init calls
    if (initPromiseRef.current) return initPromiseRef.current;

    initPromiseRef.current = (async () => {
      // Dynamic imports — these packages are browser-only
      const [{ PageController }, { PageAgentCore }] = await Promise.all([
        import("@page-agent/page-controller"),
        import("@page-agent/core"),
      ]);

      const controller = new PageController({ enableMask: true });

      // Custom fetch that injects the CloudBase auth token as a Bearer header
      const customFetch: typeof globalThis.fetch = async (input, init) => {
        const token = await getSessionAccessToken();
        const headers = new Headers((init?.headers as HeadersInit | undefined) ?? {});
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        return globalThis.fetch(input, { ...init, headers });
      };

      const core = new PageAgentCore({
        // LLMConfig fields — point at our proxy route
        baseURL: "/api/chat",
        model: "deepseek-v4-flash",
        // No apiKey needed — auth is handled by customFetch
        customFetch,
        // PageAgentCoreConfig field
        pageController: controller,
        // Language
        language: "zh-CN",
      });

      // ------------------------------------------------------------------
      // Subscribe to Core events
      // ------------------------------------------------------------------

      // `activity` — transient real-time feedback
      core.addEventListener("activity", (e: Event) => {
        const activity = (e as CustomEvent).detail as import("@page-agent/core").AgentActivity;
        switch (activity.type) {
          case "thinking":
            setState("thinking");
            break;
          case "executing":
          case "executed":
          case "retrying":
            setState("acting");
            break;
          case "error":
            setErrorMsg(activity.message);
            setState("error");
            break;
        }
      });

      // `statuschange` — agent lifecycle transitions
      core.addEventListener("statuschange", (e: Event) => {
        const status = (e as CustomEvent).detail as import("@page-agent/core").AgentStatus;
        switch (status) {
          case "running":
            // Keep thinking/acting state driven by activity events
            break;
          case "completed":
            setState("input");
            break;
          case "error":
            // errorMsg should already be set by the activity 'error' event;
            // fall back to a generic message if not
            setState((prev) => {
              if (prev !== "error") {
                setErrorMsg("An unknown error occurred.");
              }
              return "error";
            });
            break;
          case "idle":
            // Only reset to input if we were previously active
            setState((prev) =>
              prev === "thinking" || prev === "acting" ? "input" : prev,
            );
            break;
        }
      });

      const refs: AgentRefs = { controller, core };
      agentRef.current = refs;
      initPromiseRef.current = null;
      return refs;
    })();

    return initPromiseRef.current;
  }, []);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  const sendCommand = useCallback(
    (command: string) => {
      lastCommandRef.current = command;
      setState("thinking");
      setErrorMsg(null);

      initAgent()
        .then(({ core }) => {
          // execute() is fire-and-forget here; state is driven by events
          core.execute(command).catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err);
            setErrorMsg(msg);
            setState("error");
          });
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          setErrorMsg(msg);
          setState("error");
        });
    },
    [initAgent],
  );

  const retry = useCallback(() => {
    if (lastCommandRef.current) {
      sendCommand(lastCommandRef.current);
    }
  }, [sendCommand]);

  const open = useCallback(() => {
    setState("input");
    // Kick off lazy init in the background so the first command is faster
    initAgent().catch(() => {
      // Ignore init errors here — they'll surface on sendCommand
    });
  }, [initAgent]);

  const close = useCallback(() => {
    // Stop any running task but keep the agent instance alive for reuse
    agentRef.current?.core.stop();
    setState("idle");
    setErrorMsg(null);
  }, []);

  const dismissError = useCallback(() => {
    setErrorMsg(null);
    setState("input");
  }, []);

  return { state, errorMsg, sendCommand, retry, open, close, dismissError };
}
