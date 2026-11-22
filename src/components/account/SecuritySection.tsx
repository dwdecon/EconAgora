"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { auth } from "@/lib/cloudbase";

interface SecuritySectionProps {
  email: string | null;
  onEmailChanged?: (email: string) => void;
}

const i18n = {
  zh: {
    title: "账户安全",
    email: "邮箱",
    emailChange: "修改邮箱",
    emailChangeDesc: "输入当前密码确认修改，请核对新邮箱地址。",
    newEmail: "新邮箱地址",
    emailUpdated: "邮箱已更新",
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
    invalidEmail: "请输入有效的邮箱地址。",
    cancel: "取消",
    signedOut: "退出中...",
  },
  en: {
    title: "Account Security",
    email: "Email",
    emailChange: "Change Email",
    emailChangeDesc: "Confirm with your current password and check the new email address.",
    newEmail: "New Email Address",
    emailUpdated: "Email updated",
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
    invalidEmail: "Please enter a valid email.",
    cancel: "Cancel",
    signedOut: "Signing out...",
  },
} as const;

export default function SecuritySection({ email, onEmailChanged }: SecuritySectionProps) {
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

  const [emailStep, setEmailStep] = useState<"idle" | "editing">("idle");
  const [currentEmail, setCurrentEmail] = useState(email);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState("");

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
      const { error } = await auth.updateUser({ password: newPassword, currentPassword });
      if (error) {
        setMessage({
          type: "error",
          text: error.message || t.error,
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

  async function handleEmailChange(event: React.FormEvent) {
    event.preventDefault();
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@") || !emailPassword) {
      setEmailError(t.invalidEmail);
      return;
    }
    setEmailSending(true);
    setEmailError("");
    try {
      const { error } = await auth.updateUser({ email: trimmedEmail, currentPassword: emailPassword });
      if (error) { setEmailError(error.message || t.error); return; }
      setCurrentEmail(trimmedEmail);
      onEmailChanged?.(trimmedEmail);
      setMessage({ type: "success", text: t.emailUpdated });
      resetEmailChange();
    } catch { setEmailError(t.error); }
    finally { setEmailSending(false); }
  }

  async function handleLogout() {
    if (!confirm(t.logoutConfirm)) {
      return;
    }

    setLoggingOut(true);

    try {
      const result = await auth.signOut();
      if (result.error) throw new Error(result.error.message);
      window.location.href = "/";
    } catch {
      setMessage({ type: "error", text: t.error });
      setLoggingOut(false);
    }
  }

  function resetEmailChange() {
    setEmailStep("idle");
    setNewEmail("");
    setEmailPassword("");
    setEmailError("");
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
              <div className="mt-0.5 text-sm text-[var(--color-text-muted)]">{currentEmail ?? "—"}</div>
            </div>
            <button type="button" onClick={() => setEmailStep("editing")}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)]">
              {t.emailChange}
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailChange} className="flex flex-col gap-3">
            <div className="text-sm font-medium text-[var(--color-text-primary)]">{t.emailChange}</div>
            <div className="text-sm text-[var(--color-text-muted)]">{t.emailChangeDesc}</div>
            <input type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)}
              placeholder={t.newEmail} aria-label={t.newEmail} required maxLength={254}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-primary)]" />
            <input type="password" value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)}
              placeholder={t.currentPassword} aria-label={t.currentPassword} autoComplete="current-password" required
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-primary)]" />
            {emailError && <div className="text-xs text-red-500">{emailError}</div>}
            <div className="flex gap-2">
              <button type="submit" disabled={emailSending}
                className="rounded-[6px] bg-[var(--color-text-primary)] px-5 py-2 text-sm text-[var(--color-bg)] disabled:opacity-50">
                {emailSending ? t.updating : t.emailChange}
              </button>
              <button type="button" onClick={resetEmailChange}
                className="rounded-lg border border-[var(--color-border)] px-5 py-2 text-sm text-[var(--color-text-secondary)]">
                {t.cancel}
              </button>
            </div>
          </form>
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
