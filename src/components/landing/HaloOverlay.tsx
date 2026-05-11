"use client";

import { useEffect, useRef, useState } from "react";

export default function HaloOverlay() {
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);
  const revealed = useRef(false);

  useEffect(() => {
    const reveal = () => {
      if (revealed.current) return;
      revealed.current = true;
      setReady(true);
      // remove from DOM after fade completes
      setTimeout(() => setHidden(true), 850);
    };

    window.addEventListener("hero-halo-ready", reveal);
    const timer = setTimeout(reveal, 3000);

    return () => {
      window.removeEventListener("hero-halo-ready", reveal);
      clearTimeout(timer);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#000000",
        opacity: ready ? 0 : 1,
        transition: "opacity 800ms cubic-bezier(0.22, 1, 0.36, 1)",
        pointerEvents: ready ? "none" : "auto",
      }}
    />
  );
}
