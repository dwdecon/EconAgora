"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { auth } from "@/lib/cloudbase";

export default function LoginForm() {
  const router = useRouter();
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

      router.replace("/");
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
        className="rounded-lg border border-dark-border bg-dark-card px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <input
        name="password"
        type="password"
        required
        placeholder="Password"
        className="rounded-lg border border-dark-border bg-dark-card px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
