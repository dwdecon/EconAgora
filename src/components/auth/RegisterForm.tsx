"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        name: formData.get("name"),
        password: formData.get("password"),
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "注册失败");
    } else {
      router.push("/auth/login");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <input
        name="name"
        type="text"
        required
        placeholder="用��名"
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="邮箱"
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <input
        name="password"
        type="password"
        required
        placeholder="密码"
        className="rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-primary-hover transition"
      >
        注册
      </button>
    </form>
  );
}
