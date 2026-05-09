"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useLocale } from "next-intl";
import { getSessionAccessToken } from "@/lib/cloudbase";

interface Profile {
  name: string;
  avatar: string | null;
  affiliation: string;
  bio: string;
  locale: string;
}

interface AccountFormProps {
  profile: Profile;
  email: string | null;
}

const i18n = {
  zh: {
    title: "基本信息",
    avatar: "头像",
    name: "昵称",
    affiliation: "机构 / 职位",
    bio: "个人简介",
    locale: "界面语言",
    localeZh: "中文",
    localeEn: "English",
    save: "保存修改",
    saving: "保存中...",
    saved: "已保存",
    uploadAvatar: "更换头像",
    uploading: "上传中...",
  },
  en: {
    title: "Profile",
    avatar: "Avatar",
    name: "Display Name",
    affiliation: "Affiliation",
    bio: "Bio",
    locale: "Interface Language",
    localeZh: "中文",
    localeEn: "English",
    save: "Save Changes",
    saving: "Saving...",
    saved: "Saved",
    uploadAvatar: "Change Avatar",
    uploading: "Uploading...",
  },
};

export default function AccountForm({ profile: initialProfile, email }: AccountFormProps) {
  const locale = useLocale();
  const t = i18n[locale === "en" ? "en" : "zh"];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: initialProfile.name,
    affiliation: initialProfile.affiliation,
    bio: initialProfile.bio,
    locale: initialProfile.locale,
    avatar: initialProfile.avatar,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError("");

    try {
      const accessToken = await getSessionAccessToken();
      if (!accessToken) {
        setError("Not authenticated.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(json.error ?? "Upload failed");
      }

      const { url } = await res.json();
      setForm((f) => ({ ...f, avatar: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const accessToken = await getSessionAccessToken();
      if (!accessToken) {
        setError("Not authenticated.");
        return;
      }

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          affiliation: form.affiliation.trim(),
          bio: form.bio.trim(),
          locale: form.locale,
          avatar: form.avatar ?? "",
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: "Save failed" }));
        throw new Error(json.error ?? "Save failed");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">{t.title}</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {form.avatar ? (
              <Image
                src={form.avatar}
                alt="Avatar"
                width={80}
                height={80}
                unoptimized
                className="h-20 w-20 rounded-full object-cover ring-2 ring-[var(--color-border)]"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-[var(--color-bg-surface)] flex items-center justify-center text-3xl text-[var(--color-text-muted)]">
                {form.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-[var(--color-bg-surface-strong)] flex items-center justify-center backdrop-blur-sm">
                <span className="text-[var(--color-text-primary)] text-xs font-medium">{t.uploading}</span>
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition hover:border-[var(--color-text-muted)] disabled:opacity-50"
            >
              {uploadingAvatar ? t.uploading : t.uploadAvatar}
            </button>
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Email
          </label>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
            {email ?? "—"}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            {t.name}
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] focus:outline-none transition-shadow"
          />
        </div>

        {/* Affiliation */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            {t.affiliation}
          </label>
          <input
            type="text"
            value={form.affiliation}
            onChange={(e) => setForm((f) => ({ ...f, affiliation: e.target.value }))}
            placeholder={locale === "en" ? "e.g. Professor, Tsinghua University" : "例如：清华大学教授"}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] focus:outline-none transition-shadow"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            {t.bio}
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={3}
            placeholder={locale === "en" ? "Tell us about yourself..." : "介绍一下你自己..."}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] focus:outline-none resize-none transition-shadow"
          />
        </div>

        {/* Locale */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            {t.locale}
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, locale: "zh" }))}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                form.locale === "zh"
                  ? "border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[var(--color-bg)]"
                  : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]"
              }`}
            >
              {t.localeZh}
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, locale: "en" }))}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                form.locale === "en"
                  ? "border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[var(--color-bg)]"
                  : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]"
              }`}
            >
              {t.localeEn}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-[6px] bg-[var(--color-text-primary)] px-5 py-2.5 text-[16px] font-normal text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:opacity-50 shadow-[var(--shadow-inset-button)]"
          >
            {saving ? t.saving : saved ? t.saved : t.save}
          </button>
        </div>
      </form>
    </div>
  );
}
