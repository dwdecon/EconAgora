"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/cloudbase";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      const { error: authError } = await auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || "Sign-in failed.");
        return;
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/";
      window.location.href = callbackUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-80 flex-col gap-4">
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] focus:outline-none transition-shadow"
      />
      <input
        name="password"
        type="password"
        required
        placeholder="Password"
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] focus:outline-none transition-shadow"
      />
        <button
          type="submit"
          disabled={loading}
          className="rounded-[6px] bg-[var(--color-text-primary)] px-4 py-3 font-normal text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 shadow-[var(--shadow-inset-button)]"
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
    </form>
  );
}
