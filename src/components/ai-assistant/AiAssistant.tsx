"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FloatingStar from "./FloatingStar";
import GlassBar from "./GlassBar";
import { usePageAgent } from "./usePageAgent";
import { getSessionAccessToken } from "@/lib/cloudbase";

const AUTH_KEY = "econagora-agent-logged-in";

export default function AiAssistant() {
  const [authState, setAuthState] = useState<"unknown" | "yes" | "no">("unknown");

  const { state, errorMsg, activity, activityHistory, sendCommand, retry, open, close, stop, dismissError, newConversation } = usePageAgent({
    onAuthExpired: useCallback(() => {
      sessionStorage.setItem(AUTH_KEY, "0");
      setAuthState("no");
      const currentPath = window.location.pathname;
      window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`;
    }, []),
  });

  const hasCheckedRef = useRef(false);
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const cached = sessionStorage.getItem(AUTH_KEY);
    if (cached === "1") {
      setAuthState("yes");
    }

    getSessionAccessToken().then((token) => {
      const loggedIn = !!token;
      setAuthState(loggedIn ? "yes" : "no");
      sessionStorage.setItem(AUTH_KEY, loggedIn ? "1" : "0");
    });
  }, []);

  const handleClick = useCallback(() => {
    if (authState === "unknown") return;
    if (authState === "no") {
      const currentPath = window.location.pathname;
      window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`;
      return;
    }
    open();
  }, [authState, open]);

  if (authState === "unknown") return null;

  if (state === "idle") {
    return <FloatingStar onClick={handleClick} />;
  }

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
      onNewConversation={newConversation}
    />
  );
}
