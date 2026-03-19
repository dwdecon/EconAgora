import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import LocaleSwitcher from "./LocaleSwitcher";

export default async function Navbar() {
  const session = await auth();
  const t = await getTranslations("nav");

  const navItems = [
    { href: "/prompts", label: t("prompts") },
    { href: "/community", label: t("community") },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-dark-border bg-dark/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold">
          AI<span className="text-primary">4</span>Econ
        </Link>
        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-gray-text hover:text-white transition"
            >
              {item.label}
            </Link>
          ))}
          <LocaleSwitcher />
          {session?.user ? (
            <Link
              href={`/u/${session.user.id}`}
              className="text-sm text-white"
            >
              {session.user.name}
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
