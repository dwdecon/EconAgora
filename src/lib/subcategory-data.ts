export interface SubcategoryGroup {
  category: string;
  subcategories: string[];
}

export const SUBCATEGORY_MAP: Record<string, string[]> = {
  选题: ["趋势分析", "选题评估", "研究规划", "IDE"],
  文献: ["检索", "阅读", "笔记", "引用管理", "Zotero", "Mendeley", "EndNote"],
  数据: ["数据库", "清洗", "匹配", "FRED", "World Bank", "Census", "中国统计", "OpenAlex", "法律数据库"],
  分析: ["计量", "因果推断", "面板数据", "DID", "Stata", "R", "Python", "MATLAB", "SPSS", "Jupyter", "图表", "三线表"],
  写作: ["起草", "润色", "翻译", "结构", "APA", "方法章节", "结果章节"],
  展示: ["排版", "幻灯片", "Beamer", "海报", "Excalidraw"],
  投稿: ["期刊选择", "审稿回复", "格式检查", "投稿指南"],
};

export function getSubcategories(category: string): string[] {
  return SUBCATEGORY_MAP[category] ?? [];
}

export function getAllCategories(): string[] {
  return Object.keys(SUBCATEGORY_MAP);
}
