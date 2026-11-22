export function safeRedirectPath(value: string | null | undefined): string {
  if (!value?.startsWith("/") || /[\u0000-\u0020\\]/.test(value)) return "/";
  try {
    const url = new URL(value, "https://same-origin.invalid");
    return url.origin === "https://same-origin.invalid" ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch { return "/"; }
}
