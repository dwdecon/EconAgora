"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { auth, getSessionAccessToken } from "@/lib/cloudbase";

type Step = "form" | "otp";

export default function RegisterForm() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpData, setOtpData] = useState<any>(null);

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
      const { data, error: signUpError } = await auth.signUp({
        email: email.trim(),
        nickname: name.trim(),
      });

      if (signUpError) {
        setError(signUpError.message || (locale === "en" ? "Registration failed." : "注册失败。"));
        return;
      }

      setOtpData(data);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === "en" ? "Registration failed." : "注册失败。"));
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!otp.trim()) {
      setError(locale === "en" ? "Please enter the verification code." : "请输入验证码。");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: verifyError } = await otpData.verifyOtp({ token: otp.trim() });

      if (verifyError) {
        setError(verifyError.message || (locale === "en" ? "Verification failed." : "验证码错误。"));
        return;
      }

      // OTP verification succeeded — user is now signed in
      // Set password for future sign-ins
      if (password) {
        const { error: updateError } = await auth.updateUser({ password });
        if (updateError) {
          console.warn("Failed to set password:", updateError);
          // Non-fatal: user is already signed in
        }
      }

      // Save profile
      const { data: userData } = await auth.getUser();
      const currentUser = userData?.user;
      if (currentUser) {
        const accessToken = await getSessionAccessToken();
        if (accessToken) {
          const response = await fetch("/api/profile", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: name.trim(), locale }),
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            setError(payload?.error || (locale === "en" ? "Failed to initialize profile." : "初始化用户信息失败。"));
            return;
          }
        }
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/";
      window.location.href = callbackUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === "en" ? "Verification failed." : "验证失败。"));
    } finally {
      setLoading(false);
    }
  }

  function resendOtp() {
    setOtp("");
    setStep("form");
    setOtpData(null);
  }

  return (
    <div className="flex w-80 flex-col gap-4">
      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {step === "form" ? (
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
            {loading ? (locale === "en" ? "Sending code..." : "发送中...") : (locale === "en" ? "Send verification code" : "发送验证码")}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {locale === "en"
              ? `Verification code sent to ${email}.`
              : `验证码已发送至 ${email}。`}
          </p>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder={locale === "en" ? "Verification code" : "验证码"}
            required
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]*"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] focus:outline-none transition-shadow tracking-widest text-center text-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-[6px] bg-[var(--color-text-primary)] px-4 py-3 font-normal text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 shadow-[var(--shadow-inset-button)]"
          >
            {loading ? (locale === "en" ? "Verifying..." : "验证中...") : (locale === "en" ? "Verify & create account" : "验证并创建账户")}
          </button>
          <button
            type="button"
            onClick={resendOtp}
            className="text-sm text-primary hover:underline"
          >
            {locale === "en" ? "Change email or resend code" : "更换邮箱或重新发送"}
          </button>
        </form>
      )}
    </div>
  );
}
