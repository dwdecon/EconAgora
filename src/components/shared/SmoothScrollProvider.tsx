"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Lenis?: new (options: {
      lerp?: number;
      smoothWheel?: boolean;
      wheelMultiplier?: number;
    }) => {
      raf: (time: number) => void;
      destroy: () => void;
    };
  }
}

export default function SmoothScrollProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let lenisInstance: {
      raf: (time: number) => void;
      destroy: () => void;
    } | null = null;
    let animationFrameId: number | null = null;

    const initLenis = () => {
      if (!window.Lenis) return;

      lenisInstance = new window.Lenis({
        lerp: 0.07,
        smoothWheel: true,
        wheelMultiplier: 1,
      });

      const raf = (time: number) => {
        lenisInstance?.raf(time);
        animationFrameId = requestAnimationFrame(raf);
      };
      animationFrameId = requestAnimationFrame(raf);
    };

    if (window.Lenis) {
      initLenis();
    } else {
      const existingScript = document.getElementById("lenis-script") as
        | HTMLScriptElement
        | null;

      if (existingScript) {
        existingScript.onload = initLenis;
      } else {
        const script = document.createElement("script");
        script.src =
          "https://unpkg.com/@studio-freight/lenis@1.0.39/dist/lenis.min.js";
        script.id = "lenis-script";
        script.onload = initLenis;
        document.head.appendChild(script);
      }
    }

    return () => {
      lenisInstance?.destroy();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return null;
}
