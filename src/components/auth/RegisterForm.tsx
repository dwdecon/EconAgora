"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { auth, getSessionAccessToken } from "@/lib/cloudbase";

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please complete all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: signUpError } = await auth.signUpWithEmailAndPassword(
        email,
        password,
      );
      if (signUpError) {
        setError(signUpError.message || "Registration failed.");
        return;
      }

      const { error: signInError } = await auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message || "Registration succeeded, but sign-in failed.");
        return;
      }

      const { data: userData } = await auth.getUser();
      const currentUser = userData?.user;
      if (currentUser) {
        const accessToken = await getSessionAccessToken();
        const profilePayload = {
          name: name.trim(),
          email: email.trim(),
          role: "USER",
          locale: "zh",
        };

        if (accessToken) {
          const response = await fetch("/api/profile", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(profilePayload),
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            setError(payload?.error || "Failed to initialize profile.");
            return;
          }
        }
      }

      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-80 flex-col gap-4">
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Display name"
        required
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary focus:outline-none"
      />
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        required
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary focus:outline-none"
      />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password (min. 6 characters)"
        required
        minLength={6}
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
