"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wraps page children. Starts invisible (opacity 0), reveals with fade
 * once HeroHalo image dispatches "hero-halo-ready".
 * 3s fallback ensures reveal even if event misses.
 */
export default function HaloReveal({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const revealed = useRef(false);

  useEffect(() => {
    const reveal = () => {
      if (revealed.current) return;
      revealed.current = true;
      setReady(true);
    };

    window.addEventListener("hero-halo-ready", reveal);

    // fallback: 3s max wait
    const timer = setTimeout(reveal, 3000);

    return () => {
      window.removeEventListener("hero-halo-ready", reveal);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      style={{
        opacity: ready ? 1 : 0,
        transition: "opacity 800ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {children}
    </div>
  );
}
