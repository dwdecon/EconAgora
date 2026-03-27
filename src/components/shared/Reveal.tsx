"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

type RevealDirection = "up" | "down" | "left" | "right" | "scale";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: RevealDirection;
  duration?: number;
  threshold?: number;
};

type ObserverOptions = {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
};

function isElementVisible(element: HTMLElement, threshold: number) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
  const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);

  return (
    visibleHeight >= Math.min(rect.height, rect.height * threshold) &&
    visibleWidth > 0
  );
}

function useIntersectionObserver(options: ObserverOptions = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const {
    threshold = 0.4,
    root = null,
    rootMargin = "0px",
    triggerOnce = true,
  } = options;

  useEffect(() => {
    if (typeof window === "undefined" || !window.IntersectionObserver) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true);
      return;
    }

    const checkVisibility = () => {
      if (!triggerOnce || isVisible) {
        return;
      }

      const currentElement = elementRef.current;
      if (!currentElement) {
        return;
      }

      if (isElementVisible(currentElement, threshold)) {
        setIsVisible(true);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce && elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, root, rootMargin },
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    const handlePageRestore = () => {
      requestAnimationFrame(checkVisibility);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestAnimationFrame(checkVisibility);
      }
    };

    requestAnimationFrame(checkVisibility);
    window.addEventListener("pageshow", handlePageRestore);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
      window.removeEventListener("pageshow", handlePageRestore);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    isVisible,
    root,
    rootMargin,
    threshold,
    triggerOnce,
  ]);

  return [elementRef, isVisible] as const;
}

export default function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  duration = 800,
  threshold = 0.4,
}: RevealProps) {
  const [ref, isVisible] = useIntersectionObserver({ threshold });

  const getTransform = () => {
    switch (direction) {
      case "up":
        return "translateY(60px)";
      case "down":
        return "translateY(-60px)";
      case "left":
        return "translateX(50px)";
      case "right":
        return "translateX(-50px)";
      case "scale":
        return "scale(0.92)";
      default:
        return "translateY(0)";
    }
  };

  const style = {
    opacity: isVisible ? 1 : 0,
    filter: isVisible ? "blur(0px)" : "blur(6px)",
    transform: isVisible ? "translate(0) scale(1)" : getTransform(),
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), filter ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
    transitionDelay: `${delay}ms`,
    willChange: "opacity, filter, transform" as const,
  };

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}
