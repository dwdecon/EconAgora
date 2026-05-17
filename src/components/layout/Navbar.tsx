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

function UserDropdown({ user, isHome, locale }: { user: NavUser; isHome: boolean; locale: string }) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const baseLinkClass = `block px-4 py-2.5 text-sm text-left transition-colors rounded-lg ${
    isHome
      ? "text-white/80 hover:bg-white/10 hover:text-white"
      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]"
  }`;

  const itemZh = { account: "账户", signOut: "退出登录" };
  const itemEn = { account: "Account", signOut: "Sign Out" };
  const items = locale === "en" ? itemEn : itemZh;

  return (
    <div className="relative" ref={dropRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`rounded-full border px-4 py-2.5 text-[13px] font-semibold transition-all duration-300 ${
          isHome
            ? "border-white/10 text-white hover:border-white/30 hover:bg-white/5"
            : "border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface)]"
        }`}
      >
        {user.displayName}
      </button>

      {open && (
        <div className={`absolute right-0 mt-2 w-40 rounded-xl border py-1 shadow-xl ${
          isHome
            ? "border-white/10 bg-black/90 backdrop-blur-md"
            : "border-[var(--color-border)] bg-[var(--color-bg-card)]"
        }`}>
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className={baseLinkClass}
          >
            {items.account}
          </Link>
          <button
            onClick={async () => {
              setOpen(false);
              await auth.signOut();
              window.location.href = "/";
            }}
            className={`${baseLinkClass} w-full cursor-pointer`}
          >
            {items.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

function BrandMark() {
  return (
    <svg width="25" height="25" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="navbar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="40" stroke="url(#navbar-grad)" strokeWidth="14" fill="none" />
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
        navRef.current.style.backgroundColor = "var(--color-nav-glass)";
        navRef.current.style.backdropFilter = "blur(20px) saturate(180%)";
        (navRef.current.style as any).webkitBackdropFilter = "blur(20px) saturate(180%)";
        navRef.current.style.opacity = "1";
      }
      return;
    }

    // Reset styles when returning to home page
    if (navRef.current) {
      navRef.current.style.backdropFilter = "";
      (navRef.current.style as any).webkitBackdropFilter = "";
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

  // Fade-in on mount: only on home page — only animates opacity, not transform/background
  useEffect(() => {
    if (!isHome || !navRef.current) return;
    const el = navRef.current;
    const start = performance.now();
    const DURATION = 1200;

    function animate(now: number) {
      const t = Math.min((now - start) / DURATION, 1);
      const fastT = Math.min(t * 2, 1);
      const fastEase = 1 - Math.pow(1 - fastT, 3);
      el.style.opacity = String(fastEase);

      if (t < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let mounted = true;

    async function syncUser(currentUser: any) {
      if (!mounted) return;
      if (!currentUser) {
        setUser(null);
        return;
      }

      // Defensive: ensure id is a string, not a function reference
      const userId = currentUser.id;
      if (!userId || typeof userId !== "string") {
        setUser(null);
        return;
      }

      const { data: profile } = await db
        .from("user_profile")
        .select("name")
        .eq("cloudbase_uid", userId)
        .single();

      if (!mounted) return;

      const profileName = (profile as any)?.name;
      const metaName = currentUser.user_metadata?.nickname || currentUser.user_metadata?.nickName;
      const emailPrefix = currentUser.email?.split("@")[0];

      // No profile, no metadata name, no email → treat as unauthenticated
      if (!profileName && !metaName && !emailPrefix && !currentUser.phone) {
        setUser(null);
        return;
      }

      setUser({
        id: userId,
        displayName: profileName || metaName || emailPrefix || "User",
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

  function isActiveNavItem(href: string) {
    if (href.startsWith("#")) {
      return false;
    }

    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

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
          <span className={`mt-0.5 text-[22px] font-normal tracking-[-0.04em] ${isHome ? "text-white" : "text-[var(--color-text-primary)]"}`}>
            EconAgora
          </span>
        </Link>

        <div className={`absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-[14px] font-semibold md:flex ${isHome ? "text-[#A1A1AA]" : "text-[var(--color-text-muted)]"}`}>
          {(content.nav.items as Array<{label: string; href: string; external?: boolean}>).map((item) => {
            const href = localizeHref(locale, item.href);
            const hoverClass = isHome ? "hover:text-white" : "hover:text-[var(--color-text-primary)]";
            const isActive = isActiveNavItem(item.href);
            const stateClass = isActive ? "text-[var(--color-text-primary)]" : hoverClass;

            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className={`transition-colors duration-300 ${stateClass}`}
                >
                  {item.label}
                </a>
              );
            }

            return (
              <a
                key={item.label}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`transition-colors duration-300 ${stateClass}`}
              >
                {item.label}
              </a>
            );
          })}
        </div>

        <div className="relative z-20 flex items-center gap-3">
          <LocaleSwitcher isHome={isHome} />
          {user ? (
            <UserDropdown user={user} isHome={isHome} locale={locale} />
          ) : (
            <Link
              href="/auth/register"
              className={`ml-2 rounded-[6px] px-5 py-2 text-[14px] font-normal transition-opacity shadow-[var(--shadow-inset-button)] ${
                isHome
                  ? "bg-white text-black hover:opacity-90"
                  : "bg-[var(--color-text-primary)] text-[var(--color-bg)] hover:opacity-80"
              }`}
            >
              {content.nav.register}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
