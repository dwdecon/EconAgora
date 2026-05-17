const CATEGORY_THEME: Record<string, string> = {
  // Unified research-stage categories (Chinese + English)
  选题: "border-violet-300 bg-violet-100 text-violet-800",
  Discovery: "border-violet-300 bg-violet-100 text-violet-800",

  文献: "border-sky-300 bg-sky-100 text-sky-800",
  Literature: "border-sky-300 bg-sky-100 text-sky-800",

  数据: "border-emerald-300 bg-emerald-100 text-emerald-800",
  Data: "border-emerald-300 bg-emerald-100 text-emerald-800",

  分析: "border-amber-300 bg-amber-100 text-amber-900",
  Analysis: "border-amber-300 bg-amber-100 text-amber-900",

  写作: "border-rose-300 bg-rose-100 text-rose-800",
  Writing: "border-rose-300 bg-rose-100 text-rose-800",

  展示: "border-purple-300 bg-purple-100 text-purple-800",
  Presentation: "border-purple-300 bg-purple-100 text-purple-800",

  投稿: "border-teal-300 bg-teal-100 text-teal-800",
  Submission: "border-teal-300 bg-teal-100 text-teal-800",

  Default: "border-[#d8cab3] bg-[#efe4d1] text-[#7f4a22]",
};

export function getCategoryTheme(category: string): string {
  return CATEGORY_THEME[category] ?? CATEGORY_THEME.Default;
}
