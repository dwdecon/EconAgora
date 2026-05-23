"use client";

import { useCallback, useRef, useState } from "react";
import { getSessionAccessToken } from "@/lib/cloudbase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PageAgentState = "idle" | "input" | "thinking" | "acting" | "error";

export interface ActivityInfo {
  /** What the agent is currently doing, shown as subtitle text */
  summary: string;
  /** Tool being executed (if acting) */
  tool: string | null;
  /** Step count so far */
  step: number;
}

export interface UsePageAgentReturn {
  state: PageAgentState;
  errorMsg: string | null;
  activity: ActivityInfo;
  activityHistory: ActivityInfo[];
  sendCommand: (command: string) => void;
  retry: () => void;
  open: () => void;
  close: () => void;
  stop: () => void;
  dismissError: () => void;
}

// ---------------------------------------------------------------------------
// Lazy-loaded module refs (browser-only)
// ---------------------------------------------------------------------------

type PageAgentCoreType = import("@page-agent/core").PageAgentCore;
type PageControllerType = import("@page-agent/page-controller").PageController;
type AgentActivity = import("@page-agent/core").AgentActivity;

interface AgentRefs {
  controller: PageControllerType;
  core: PageAgentCoreType;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const emptyActivity: ActivityInfo = { summary: "", tool: null, step: 0 };

export function usePageAgent(options?: {
  onAuthExpired?: () => void;
}): UsePageAgentReturn {
  const [state, setState] = useState<PageAgentState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityInfo>(emptyActivity);
  const [activityHistory, setActivityHistory] = useState<ActivityInfo[]>([]);

  const agentRef = useRef<AgentRefs | null>(null);
  const lastCommandRef = useRef<string | null>(null);
  const initPromiseRef = useRef<Promise<AgentRefs> | null>(null);
  const stepRef = useRef(0);
  const stoppingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const stateRef = useRef<PageAgentState>("idle");

  const setStateAndRef = useCallback(
    (newState: PageAgentState | ((prev: PageAgentState) => PageAgentState)) => {
      setState((prev) => {
        const next = typeof newState === "function" ? newState(prev) : newState;
        stateRef.current = next;
        return next;
      });
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Init (lazy, idempotent)
  // ---------------------------------------------------------------------------

  const initAgent = useCallback(async (): Promise<AgentRefs> => {
    if (agentRef.current) return agentRef.current;
    if (initPromiseRef.current) return initPromiseRef.current;

    initPromiseRef.current = (async () => {
      const [{ PageController }, { PageAgentCore }] = await Promise.all([
        import("@page-agent/page-controller"),
        import("@page-agent/core"),
      ]);

      const controller = new PageController({ enableMask: true });

      const customFetch: typeof globalThis.fetch = async (input, init) => {
        const token = await getSessionAccessToken();
        const headers = new Headers((init?.headers as HeadersInit | undefined) ?? {});
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }

        const combinedSignal = AbortSignal.any(
          [init?.signal, abortRef.current?.signal].filter(Boolean) as AbortSignal[],
        );

        try {
          const response = await globalThis.fetch(input, {
            ...init,
            headers,
            signal: combinedSignal,
          });

          if (response.status === 401) {
            options?.onAuthExpired?.();
            stoppingRef.current = true;
            throw new Error("Authentication expired");
          }

          return response;
        } catch (error: any) {
          if (error.name === "AbortError") {
            stoppingRef.current = true;
          }
          throw error;
        }
      };

      const core = new PageAgentCore({
        baseURL: "/api",
        model: "deepseek-v4-flash",
        customFetch,
        pageController: controller,
        language: "zh-CN",
        maxSteps: 30,
      });

      // ------------------------------------------------------------------
      // Subscribe to Core events
      // ------------------------------------------------------------------

      core.addEventListener("activity", (e: Event) => {
        const act = (e as CustomEvent).detail as AgentActivity;
        switch (act.type) {
          case "thinking":
            setStateAndRef("thinking");
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
          case "executing":
            setStateAndRef("acting");
            setActivity((prev) => ({
              ...prev,
              summary: describeTool(act.tool, act.input),
              tool: act.tool,
              step: stepRef.current,
            }));
            setActivityHistory((prev) => [
              ...prev,
              {
                summary: describeTool(act.tool, act.input),
                tool: act.tool,
                step: stepRef.current,
              },
            ]);
            break;
          case "executed":
            setStateAndRef("acting");
            setActivity((prev) => ({
              ...prev,
              summary: describeTool(act.tool, act.input) + " ✓",
              tool: act.tool,
              step: stepRef.current,
            }));
            setActivityHistory((prev) => [
              ...prev,
              {
                summary: describeTool(act.tool, act.input) + " ✓",
                tool: act.tool,
                step: stepRef.current,
              },
            ]);
            break;
          case "retrying":
            setStateAndRef("acting");
            setActivity((prev) => ({
              ...prev,
              summary: `重试中 (${act.attempt}/${act.maxAttempts})…`,
              tool: null,
              step: stepRef.current,
            }));
            setActivityHistory((prev) => [
              ...prev,
              {
                summary: `重试中 (${act.attempt}/${act.maxAttempts})…`,
                tool: null,
                step: stepRef.current,
              },
            ]);
            break;
          case "error":
            setErrorMsg(act.message);
            setStateAndRef("error");
            setActivityHistory((prev) => [
              ...prev,
              { summary: act.message, tool: null, step: stepRef.current },
            ]);
            break;
        }
      });

      core.addEventListener("statuschange", () => {
        const status = core.status;
        switch (status) {
          case "running":
            break;
          case "completed":
            setStateAndRef("input");
            setActivity({ ...emptyActivity, step: stepRef.current });
            break;
          case "error":
            if (stateRef.current !== "error") {
              setErrorMsg("An unknown error occurred.");
            }
            setStateAndRef("error");
            break;
          case "idle":
            setStateAndRef((prev) =>
              prev === "thinking" || prev === "acting" ? "input" : prev,
            );
            break;
        }
      });

      // Track step count from history changes
      core.addEventListener("historychange", () => {
        const steps = core.history.filter((h: any) => h.type === "step").length;
        stepRef.current = steps;
      });

      const refs: AgentRefs = { controller, core };
      agentRef.current = refs;
      initPromiseRef.current = null;
      return refs;
    })();

    return initPromiseRef.current;
  }, [options]);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  const sendCommand = useCallback(
    (command: string) => {
      lastCommandRef.current = command;
      stepRef.current = 0;
      stoppingRef.current = false;
      setActivityHistory([]);
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setStateAndRef("thinking");
      setErrorMsg(null);
      setActivity({ summary: "正在思考…", tool: null, step: 0 });

      initAgent()
        .then(({ core }) => {
          core.execute(command).catch((err: unknown) => {
            if (stoppingRef.current || (err instanceof Error && err.name === "AbortError")) {
              return;
            }
            const msg = err instanceof Error ? err.message : String(err);
            setErrorMsg(msg);
            setStateAndRef("error");
          });
        })
        .catch((err: unknown) => {
          if (stoppingRef.current || (err instanceof Error && err.name === "AbortError")) {
            return;
          }
          const msg = err instanceof Error ? err.message : String(err);
          setErrorMsg(msg);
          setStateAndRef("error");
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
    setStateAndRef("input");
    setActivity(emptyActivity);
    initAgent().catch(() => {});
  }, [initAgent]);

  const close = useCallback(() => {
    agentRef.current?.core.stop();
    setStateAndRef("idle");
    setErrorMsg(null);
    setActivity(emptyActivity);
  }, []);

  const stop = useCallback(() => {
    stoppingRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;
    agentRef.current?.core.stop();
    setStateAndRef("input");
    setActivity((prev) => ({ ...prev, summary: "" }));
    stepRef.current = 0;
  }, []);

  const dismissError = useCallback(() => {
    setErrorMsg(null);
    setStateAndRef("input");
    setActivity(emptyActivity);
  }, []);

  return { state, errorMsg, activity, activityHistory, sendCommand, retry, open, close, stop, dismissError };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function describeTool(tool: string, input: unknown): string {
  const inp = input as Record<string, any> | undefined;
  switch (tool) {
    case "click_element_by_index":
      return `点击元素 #${inp?.index ?? "?"}`;
    case "input_text":
      return `输入文本 "${(inp?.text ?? "").slice(0, 20)}"`;
    case "scroll":
      return inp?.down ? "向下滚动" : "向上滚动";
    case "wait":
      return `等待 ${inp?.seconds ?? 1} 秒`;
    case "done":
      return "完成任务";
    case "go_to_url":
    case "navigate_to":
      return `导航到 ${inp?.url ?? ""}`;
    default:
      return tool.replace(/_/g, " ");
  }
}
