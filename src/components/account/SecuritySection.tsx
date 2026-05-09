"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { auth } from "@/lib/cloudbase";

interface SecuritySectionProps {
  email: string | null;
}

type EmailStep = "idle" | "sending" | "otp";

type OtpVerifier = {
  verifyOtp: (opts: { type?: string; token: string }) => Promise<{
    error?: { message: string } | null;
  }>;
};

const i18n = {
  zh: {
    title: "账户安全",
    email: "邮箱",
    emailChange: "修改邮箱",
    emailChangeDesc: "通过发送到新邮箱的验证码完成变更",
    newEmail: "新邮箱地址",
    sendCode: "发送验证码",
    sending: "发送中...",
    verifyUpdate: "验证并更新",
    verifying: "验证中...",
    emailUpdated: "邮箱已更新",
    resend: "重新发送",
    back: "返回",
    password: "密码",
    changePassword: "修改密码",
    updatePassword: "更新密码",
    currentPassword: "当前密码",
    newPassword: "新密码",
    confirmPassword: "确认新密码",
    passwordUpdated: "密码已更新",
    updating: "更新中...",
    updated: "已更新",
    logout: "退出登录",
    logoutConfirm: "确定要退出登录吗？",
    error: "操作失败",
    minLength: "密码至少需要 6 个字符",
    mismatch: "两次输入的密码不一致",
    wrongPassword: "当前密码不正确",
    invalidEmail: "请输入有效的邮箱地址。",
    sendCodeError: "发送验证码失败。",
    enterCode: "请输入验证码。",
    requestNewCode: "请先重新获取验证码。",
    invalidCode: "验证码错误。",
    verifyFailed: "验证失败。",
    codeSentTo: "验证码已发送至",
    verificationCode: "验证码",
    cancel: "取消",
    signedOut: "退出中...",
  },
  en: {
    title: "Account Security",
    email: "Email",
    emailChange: "Change Email",
    emailChangeDesc: "Verify with a code sent to your new email to complete the change",
    newEmail: "New Email Address",
    sendCode: "Send Code",
    sending: "Sending...",
    verifyUpdate: "Verify & Update",
    verifying: "Verifying...",
    emailUpdated: "Email updated",
    resend: "Resend",
    back: "Back",
    password: "Password",
    changePassword: "Change Password",
    updatePassword: "Update Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    passwordUpdated: "Password updated",
    updating: "Updating...",
    updated: "Updated",
    logout: "Sign Out",
    logoutConfirm: "Are you sure you want to sign out?",
    error: "Operation failed",
    minLength: "Password must be at least 6 characters",
    mismatch: "Passwords do not match",
    wrongPassword: "Current password is incorrect",
    invalidEmail: "Please enter a valid email.",
    sendCodeError: "Failed to send code.",
    enterCode: "Please enter the verification code.",
    requestNewCode: "Please request a new code.",
    invalidCode: "Invalid code.",
    verifyFailed: "Verification failed.",
    codeSentTo: "Code sent to",
    verificationCode: "Verification code",
    cancel: "Cancel",
    signedOut: "Signing out...",
  },
} as const;

export default function SecuritySection({ email }: SecuritySectionProps) {
  const locale = useLocale();
  const t = i18n[locale === "en" ? "en" : "zh"];

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const [emailStep, setEmailStep] = useState<EmailStep>("idle");
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [otpVerifier, setOtpVerifier] = useState<OtpVerifier | null>(null);

  async function handlePasswordChange(event: React.FormEvent) {
    event.preventDefault();

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: t.minLength });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: t.mismatch });
      return;
    }

    setSaving(true);
    setSaved(false);
    setMessage(null);

    try {
      const { error } = await auth.updateUser({ password: newPassword });
      if (error) {
        setMessage({
          type: "error",
          text: error.message === "Password update not allowed" ? t.wrongPassword : t.error,
        });
        return;
      }

      setMessage({ type: "success", text: t.passwordUpdated });
      setSaved(true);
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setMessage({ type: "error", text: t.error });
    } finally {
      setSaving(false);
    }
  }

  async function handleSendEmailCode() {
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setEmailError(t.invalidEmail);
      return;
    }

    setEmailSending(true);
    setEmailError("");

    try {
      const { data, error } = await auth.updateUser({ email: trimmedEmail });
      if (error) {
        setEmailError(error.message || t.sendCodeError);
        return;
      }

      setOtpVerifier(data as OtpVerifier);
      setEmailStep("otp");
    } catch {
      setEmailError(t.sendCodeError);
    } finally {
      setEmailSending(false);
    }
  }

  async function handleVerifyEmailCode() {
    if (!emailOtp.trim()) {
      setEmailError(t.enterCode);
      return;
    }

    if (!otpVerifier) {
      setEmailError(t.requestNewCode);
      return;
    }

    setEmailVerifying(true);
    setEmailError("");

    try {
      const { error } = await otpVerifier.verifyOtp({
        type: "email_change",
        token: emailOtp.trim(),
      });

      if (error) {
        setEmailError(error.message || t.invalidCode);
        return;
      }

      setMessage({ type: "success", text: t.emailUpdated });
      resetEmailChange();
    } catch {
      setEmailError(t.verifyFailed);
    } finally {
      setEmailVerifying(false);
    }
  }

  async function handleLogout() {
    if (!confirm(t.logoutConfirm)) {
      return;
    }

    setLoggingOut(true);

    try {
      await auth.signOut();
      window.location.href = "/";
    } catch {
      setLoggingOut(false);
    }
  }

  function resetEmailChange() {
    setEmailStep("idle");
    setNewEmail("");
    setEmailOtp("");
    setEmailError("");
    setOtpVerifier(null);
  }

  function resetPasswordForm() {
    setShowPasswordForm(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSaved(false);
    setMessage(null);
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
      <h2 className="mb-6 text-lg font-semibold text-[var(--color-text-primary)]">{t.title}</h2>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "border border-green-500/20 bg-green-500/10 text-green-500"
              : "border border-red-500/20 bg-red-500/10 text-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="border-b border-[var(--color-border)] py-4">
        {emailStep === "idle" ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[var(--color-text-primary)]">{t.email}</div>
              <div className="mt-0.5 text-sm text-[var(--color-text-muted)]">{email ?? "—"}</div>
            </div>
            <button
              type="button"
              onClick={() => setEmailStep("sending")}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              {t.emailChange}
            </button>
          </div>
        ) : emailStep === "sending" ? (
          <div className="flex flex-col gap-3">
            <div className="text-sm font-medium text-[var(--color-text-primary)]">{t.emailChange}</div>
            <div className="text-sm text-[var(--color-text-muted)]">{t.emailChangeDesc}</div>
            <input
              type="email"
              value={newEmail}
              onChange={(event) => {
                setNewEmail(event.target.value);
                setEmailError("");
              }}
              placeholder={t.newEmail}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] focus:outline-none transition-shadow"
            />
            {emailError && <div className="text-xs text-red-500">{emailError}</div>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSendEmailCode}
                disabled={emailSending}
                className="rounded-[6px] bg-[var(--color-text-primary)] px-5 py-2 text-sm font-normal text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:opacity-50 shadow-[var(--shadow-inset-button)]"
              >
                {emailSending ? t.sending : t.sendCode}
              </button>
              <button
                type="button"
                onClick={resetEmailChange}
                className="rounded-lg border border-[var(--color-border)] px-5 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-text-muted)]"
              >
                {t.back}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-sm font-medium text-[var(--color-text-primary)]">
              {t.codeSentTo} {newEmail}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={emailOtp}
                onChange={(event) => {
                  setEmailOtp(event.target.value);
                  setEmailError("");
                }}
                placeholder={t.verificationCode}
                maxLength={6}
                inputMode="numeric"
                className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-center text-lg tracking-widest text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] focus:outline-none transition-shadow"
              />
              <button
                type="button"
                onClick={handleSendEmailCode}
                disabled={emailSending}
                className="shrink-0 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium whitespace-nowrap text-[var(--color-text-secondary)] transition hover:border-[var(--color-text-muted)]"
              >
                {emailSending ? t.sending : t.resend}
              </button>
            </div>
            {emailError && <div className="text-xs text-red-500">{emailError}</div>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleVerifyEmailCode}
                disabled={emailVerifying}
                className="rounded-[6px] bg-[var(--color-text-primary)] px-5 py-2 text-sm font-normal text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:opacity-50 shadow-[var(--shadow-inset-button)]"
              >
                {emailVerifying ? t.verifying : t.verifyUpdate}
              </button>
              <button
                type="button"
                onClick={resetEmailChange}
                className="rounded-lg border border-[var(--color-border)] px-5 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-text-muted)]"
              >
                {t.back}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border-b border-[var(--color-border)] py-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-[var(--color-text-primary)]">{t.password}</div>
          </div>
          {!showPasswordForm && (
            <button
              type="button"
              onClick={() => {
                setSaved(false);
                setShowPasswordForm(true);
              }}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              {t.changePassword}
            </button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="mt-4 flex flex-col gap-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder={t.currentPassword}
              required
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] focus:outline-none transition-shadow"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder={t.newPassword}
              required
              minLength={6}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] focus:outline-none transition-shadow"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={t.confirmPassword}
              required
              minLength={6}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] focus:outline-none transition-shadow"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-[6px] bg-[var(--color-text-primary)] px-5 py-2.5 text-sm font-normal text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:opacity-50 shadow-[var(--shadow-inset-button)]"
              >
                {saving ? t.updating : saved ? t.updated : t.updatePassword}
              </button>
              <button
                type="button"
                onClick={resetPasswordForm}
                className="rounded-lg border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-text-muted)]"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="pt-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-lg border border-red-500/30 px-5 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
        >
          {loggingOut ? t.signedOut : t.logout}
        </button>
      </div>
    </div>
  );
}
