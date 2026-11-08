export interface RaceVariant {
  key: string;
  label: string;
  direction: string;
}

/** 赛马模式的三条"跑道"，同一个需求用不同设计方向并行生成，再多维打分择优。 */
export const RACE_VARIANTS: RaceVariant[] = [
  {
    key: "focus",
    label: "极简专注",
    direction: "极简风：大留白、单色强调、弱边框、以主任务流为主，文案克制，卡片层次靠间距而不是阴影",
  },
  {
    key: "dense",
    label: "专业高密度",
    direction: "专业工具风：信息密度高、紧凑栅格、统计摘要条、键盘提示、表格式排布，适合重度使用",
  },
  {
    key: "warm",
    label: "亲和手作",
    direction: "亲和风：暖色低饱和、略大圆角、插画式空状态、口语化文案，适合个人日常使用",
  },
];

const SYSTEM_PROMPT = `你是一名资深前端工程师兼产品设计师。根据用户的一句话需求，输出一个完整、可直接运行的单文件 HTML 应用。

硬性要求：
1. 只输出 HTML 代码，从 <!DOCTYPE html> 开始；不要 Markdown 代码块包裹，不要任何解释性文字。
2. 单文件：CSS 与 JS 全部内联；不引用任何外部资源（CDN、外链字体、外链图片一律不要），图标用内联 SVG 或字符。
3. 真实交互：至少实现"新增 / 编辑 / 删除"中的两种，并配合筛选、排序或拖拽；每个按钮都必须真的能用，不能是装饰。
4. 数据持久化：所有业务数据写入 localStorage（用 try/catch 包裹，失败时降级到内存变量）。
5. 响应式：适配 375px 手机宽度，无横向滚动；桌面端有合理最大宽度。
6. 中文界面。必须包含空状态、输入校验与错误提示；不要用 alert 作为主要交互手段。
7. 代码整洁：语义化标签、统一的 CSS 变量、合理的函数划分，总行数控制在 700 行以内。
8. 不要出现"这是一个 demo""示例数据"之类的说明性文案，界面要像一个真实产品。`;

export function buildGenerationMessages(
  prompt: string,
  variant: RaceVariant,
  parentHtml?: string,
): { role: "system" | "user"; content: string }[] {
  const style = `\n\n本候选的视觉方向：${variant.direction}。请在不牺牲可用性的前提下贯彻该方向。`;

  if (parentHtml) {
    return [
      { role: "system", content: SYSTEM_PROMPT + style },
      {
        role: "user",
        content: `这是在之前版本基础上的迭代修改，请在保留现有结构与可用功能的前提下做增量修改，不要从零重写。

修改需求：${prompt}

现有代码：
${parentHtml}`,
      },
    ];
  }

  return [
    { role: "system", content: SYSTEM_PROMPT + style },
    { role: "user", content: `需求：${prompt}` },
  ];
}

/** 从模型输出里剥掉 Markdown 代码块、前后说明文字，只留 HTML。 */
export function extractHtml(raw: string): string {
  let text = raw.trim();
  const fence = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  const doctype = text.toLowerCase().indexOf("<!doctype");
  const htmlTag = text.toLowerCase().indexOf("<html");
  const start = doctype >= 0 ? doctype : htmlTag >= 0 ? htmlTag : -1;
  if (start > 0) text = text.slice(start);

  const end = text.toLowerCase().lastIndexOf("</html>");
  if (end >= 0) text = text.slice(0, end + 7);

  return text.trim();
}

export function extractTitle(html: string, fallback: string): string {
  const title = html.match(/<title[^>]*>([^<]{1,80})</i)?.[1]?.trim();
  if (title) return title;

  const h1 = html.match(/<h1[^>]*>([^<]{1,80})</i)?.[1]?.trim();
  if (h1) return h1.replace(/<[^>]+>/g, "").trim();

  return fallback.slice(0, 40);
}

export function summarizePrompt(prompt: string): string {
  return prompt.replace(/\s+/g, " ").trim().slice(0, 80);
}
