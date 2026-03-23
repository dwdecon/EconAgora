"use client";

import { useEffect, useRef } from "react";

/**
 * Visual lock for the landing-page halo.
 *
 * Pre-rendered WebP image + CSS GPU animations (halo-spin + halo-hue).
 * Do not change geometry, transforms, blend behavior, or animation timings
 * unless the user explicitly asks to modify the halo/background effect.
 */

const HUE_CYCLE = 10000; // 10s, same as halo-hue on main ring
const HUE_RANGE = -40; // degrees, same as halo-hue keyframe
const SPIN_CYCLE = 14000; // 14s, same as halo-spin on main ring

// Ring color stops sampled from glowing-shape (5).webp at 35% radius
// 0°: warm orange-red, 120°: magenta-pink, 240°: orange, 360°: warm orange-red
const RING_COLORS: [number, number, number][] = [
  [236, 93, 74],   // 0° — warm orange-red
  [243, 83, 149],  // 120° — magenta-pink
  [241, 106, 50],  // 240° — orange
];

/** Lerp between two RGB colors */
function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/** Sample the ring color at a given angle (0–360) */
function sampleRing(angle: number): [number, number, number] {
  const a = ((angle % 360) + 360) % 360;
  const segment = a / 120; // 3 segments of 120°
  const idx = Math.floor(segment);
  const t = segment - idx;
  return lerpRgb(RING_COLORS[idx % 3], RING_COLORS[(idx + 1) % 3], t);
}

function hueRotate(
  [r, g, b]: [number, number, number],
  deg: number,
): string {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const nr = Math.min(255, Math.max(0, Math.round(
    r * (0.213 + 0.787 * cos - 0.213 * sin) +
    g * (0.715 - 0.715 * cos - 0.715 * sin) +
    b * (0.072 - 0.072 * cos + 0.928 * sin),
  )));
  const ng = Math.min(255, Math.max(0, Math.round(
    r * (0.213 - 0.213 * cos + 0.143 * sin) +
    g * (0.715 + 0.285 * cos + 0.140 * sin) +
    b * (0.072 - 0.072 * cos - 0.283 * sin),
  )));
  const nb = Math.min(255, Math.max(0, Math.round(
    r * (0.213 - 0.213 * cos - 0.787 * sin) +
    g * (0.715 - 0.715 * cos + 0.715 * sin) +
    b * (0.072 + 0.928 * cos + 0.072 * sin),
  )));
  return `rgb(${nr},${ng},${nb})`;
}

export default function HeroHalo() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number;
    const startTime = performance.now();

    function tick(now: number) {
      if (!ringRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const elapsed = now - startTime;

      // 1. Calculate rotation (linear 24s cycle)
      const rotAngle = ((elapsed % SPIN_CYCLE) / SPIN_CYCLE) * 360;

      // 2. Calculate hue shift (ease-in-out 10s cycle)
      const hueProgress = (elapsed % HUE_CYCLE) / HUE_CYCLE;
      const hueDeg = ((1 - Math.cos(hueProgress * 2 * Math.PI)) / 2) * HUE_RANGE;

      // 3. Sample colors (left=左上角, right=右上角)
      const leftBase = sampleRing(20 - rotAngle);
      const rightBase = sampleRing(160 - rotAngle);

      const lc = hueRotate(leftBase, hueDeg);
      const rc = hueRotate(rightBase, hueDeg);

      if (leftRef.current) {
        leftRef.current.style.background = `radial-gradient(circle at center, ${lc} 0%, transparent 70%)`;
      }
      if (rightRef.current) {
        rightRef.current.style.background = `radial-gradient(circle at center, ${rc} 0%, transparent 70%)`;
      }
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <div
        ref={leftRef}
        className="absolute top-[-10%] left-[-10%] h-[35vh] w-[40vw] pointer-events-none z-0 opacity-75 mix-blend-screen blur-[120px] md:blur-[160px]"
        style={{
          background:
            "radial-gradient(circle at center, #FF0055 0%, transparent 75%)",
        }}
      />

      <div
        ref={rightRef}
        className="absolute top-[-10%] right-[-10%] h-[35vh] w-[40vw] pointer-events-none z-0 opacity-75 mix-blend-screen blur-[120px] md:blur-[160px]"
        style={{
          background:
            "radial-gradient(circle at center, #FF4D00 0%, transparent 75%)",
        }}
      />

      <div
        ref={ringRef}
        className="absolute top-0 left-1/2 h-[220vw] w-[220vw] max-w-none pointer-events-none z-0 md:h-[1800px] md:w-[1800px]"
        style={{
          animation: "halo-spin 14s linear infinite",
          willChange: "transform",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-halo.webp"
          alt=""
          width={1800}
          height={1800}
          className="h-full w-full object-contain mix-blend-screen opacity-[0.95]"
        />
      </div>
    </>
  );
}
