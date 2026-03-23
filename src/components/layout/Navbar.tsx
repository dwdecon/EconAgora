/**
 * VISUAL LOCK — Navbar
 *
 * The styling, layout, classes, transitions, scroll behavior, and frosted-glass
 * effect in this component have been approved by the user.
 * Do NOT change any className, inline style, transition timing, scroll threshold,
 * backdrop-blur/saturate values, or z-index unless the user explicitly asks to
 * modify the Navbar UI/UX.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { auth, db } from "@/lib/cloudbase";
import LocaleSwitcher from "./LocaleSwitcher";
import { getHomeContent, localizeHref } from "@/components/landing/content";

interface NavUser {
  id: string;
  displayName: string;
}

function BrandMark() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2 12L9 3L13 6L6 15L2 12Z" fill="white" />
      <path d="M8 5L22 5L14 19L9 14.5L14.5 9L8 5Z" fill="white" />
    </svg>
  );
}

export default function Navbar() {
  const [user, setUser] = useState<NavUser | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const locale = useLocale();
  const pathname = usePathname();
  const content = getHomeContent(locale);
  const isHome = pathname === "/";

  // Scroll-driven interpolation: translateY 45→0, bg rgba(10,10,10, 0→1)
  const SCROLL_RANGE = 80;
  const START_Y = 45;

  useEffect(() => {
    if (!isHome) {
      if (navRef.current) {
        navRef.current.style.transform = "translate3d(0px, 0px, 0px)";
        navRef.current.style.backgroundColor = "rgb(10, 10, 10)";
      }
      return;
    }

    function update() {
      if (!navRef.current) return;
      const t = Math.min(window.scrollY / SCROLL_RANGE, 1);
      const y = START_Y * (1 - t);
      const alpha = t;
      const c = Math.round(10 * alpha);
      navRef.current.style.transform = `translate3d(0px, ${y}px, 0px)`;
      navRef.current.style.backgroundColor = `rgba(${c}, ${c}, ${c}, ${alpha})`;
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [isHome]);

  // Fade-in on mount: slide from -30px above initial position, blur→clear
  useEffect(() => {
    if (!navRef.current) return;
    const el = navRef.current;
    const start = performance.now();
    const DURATION = 1200; // ms, same speed as scroll translateY feel

    function animate(now: number) {
      const t = Math.min((now - start) / DURATION, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      // slide: from -30px offset to 0 (relative to initial 45px position)
      const offsetY = -30 * (1 - ease);
      const scrollT = Math.min(window.scrollY / 80, 1);
      const baseY = 45 * (1 - scrollT);
      el.style.transform = `translate3d(0px, ${baseY + offsetY}px, 0px)`;
      // opacity + blur resolve faster
      const fastT = Math.min(t * 2, 1);
      const fastEase = 1 - Math.pow(1 - fastT, 3);
      el.style.opacity = String(fastEase);

      if (t < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function syncUser(currentUser: any) {
      if (!mounted) return;
      if (!currentUser) {
        setUser(null);
        return;
      }

      const { data: profile } = await db
        .from("user_profile")
        .select("name")
        .eq("cloudbase_uid", currentUser.id)
        .single();

      if (!mounted) return;
      setUser({
        id: currentUser.id,
        displayName:
          (profile as any)?.name ||
          currentUser.user_metadata?.nickname ||
          currentUser.user_metadata?.nickName ||
          currentUser.email?.split("@")[0] ||
          "User",
      });
    }

    auth
      ?.getUser?.()
      .then(({ data }: any) => syncUser(data?.user ?? null))
      .catch(() => syncUser(null));

    const subscription = auth
      ?.onAuthStateChange?.((_event: string, session: any) => {
        syncUser(session?.user ?? null);
      })
      ?.data?.subscription;

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  return (
    <nav
      ref={navRef}
      style={{
        willChange: "background-color, transform, opacity, filter",
        transform: "translate3d(0px, 15px, 0px)",
        backgroundColor: "rgba(0, 0, 0, 0)",
        transformStyle: "preserve-3d",
        opacity: 0,
      }}
      className="fixed top-0 z-50 w-full px-6 py-4 md:px-10"
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between">
        <Link href="/" className="relative z-20 flex items-center gap-2">
          <BrandMark />
          <span className="mt-0.5 text-[22px] font-normal tracking-[-0.04em]">
            EconAgora
          </span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-[14px] font-semibold text-[#A1A1AA] md:flex">
          {content.nav.items.map((item) => {
            const href = localizeHref(locale, item.href);

            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors duration-300 hover:text-white"
                >
                  {item.label}
                </a>
              );
            }

            return (
              <a
                key={item.label}
                href={href}
                className="transition-colors duration-300 hover:text-white"
              >
                {item.label}
              </a>
            );
          })}
        </div>

        <div className="relative z-20 flex items-center gap-3">
          <LocaleSwitcher />
          {user ? (
            <Link
              href={`/u/${user.id}`}
              className="rounded-full border border-white/10 px-4 py-2.5 text-[13px] font-semibold text-white transition-all duration-300 hover:border-white/30 hover:bg-white/5"
            >
              {user.displayName}
            </Link>
          ) : (
            <Link
              href="/auth/register"
              className="rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-black transition-all duration-300 hover:bg-gray-200"
            >
              {content.nav.register}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
