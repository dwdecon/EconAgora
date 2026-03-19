"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    if (res?.error) {
      setError("邮箱或密码错误");
    } else {
      router.push("/");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
      {error && <p className="text-red-500 text-sm">{error}</p>}
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
        登录
      </button>
    </form>
  );
}
