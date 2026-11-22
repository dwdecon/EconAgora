"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/cloudbase";
import { safeRedirectPath } from "@/lib/auth/redirect";

export default function RegisterForm() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError(locale === "en" ? "Please complete all fields." : "请填写所有字段。");
      return;
    }
    if (password.length < 6) {
      setError(locale === "en" ? "Password must be at least 6 characters." : "密码至少6个字符。");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: signUpData, error: signUpError } = await auth.signUp({
        email: email.trim(),
        password,
        nickname: name.trim(),
      });

      if (signUpError) {
        setError(signUpError.message || (locale === "en" ? "Registration failed." : "注册失败。"));
        return;
      }

      // The registration response already contains the authenticated user.
      if (signUpData?.user) {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), locale }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          setError(payload?.error || (locale === "en" ? "Failed to initialize profile." : "初始化用户信息失败。"));
          return;
        }
      }

      const callbackUrl = safeRedirectPath(searchParams.get("callbackUrl"));
      window.location.href = callbackUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === "en" ? "Registration failed." : "注册失败。"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-80 flex-col gap-4">
      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={locale === "en" ? "Display name" : "显示名称"}
        required
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] focus:outline-none transition-shadow"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] focus:outline-none transition-shadow"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={locale === "en" ? "Password (min. 6 characters)" : "密码（至少6个字符）"}
        required
        minLength={6}
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] focus:outline-none transition-shadow"
      />
        <button
          type="submit"
          disabled={loading}
          className="rounded-[6px] bg-[var(--color-text-primary)] px-4 py-3 font-normal text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 shadow-[var(--shadow-inset-button)]"
        >
          {loading ? (locale === "en" ? "Creating account..." : "创建中...") : (locale === "en" ? "Create account" : "创建账户")}
        </button>
      </form>
    </div>
  );
}
