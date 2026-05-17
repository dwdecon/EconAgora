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
