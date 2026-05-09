const CATEGORY_THEME: Record<string, string> = {
  Research: "border-sky-300 bg-sky-100 text-sky-800",
  文献: "border-sky-300 bg-sky-100 text-sky-800",
  Writing: "border-emerald-300 bg-emerald-100 text-emerald-800",
  写作: "border-emerald-300 bg-emerald-100 text-emerald-800",
  Coding: "border-rose-300 bg-rose-100 text-rose-800",
  编程: "border-rose-300 bg-rose-100 text-rose-800",
  Analysis: "border-amber-300 bg-amber-100 text-amber-900",
  数据: "border-amber-300 bg-amber-100 text-amber-900",
  Default: "border-[#d8cab3] bg-[#efe4d1] text-[#7f4a22]",
};

export function getPromptCategoryTheme(category: string) {
  return CATEGORY_THEME[category] ?? CATEGORY_THEME.Default;
}
