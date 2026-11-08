import type { Scores } from "./types";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * 静态启发式打分：不额外调用模型，零成本地为赛马的每个候选打分。
 * 评委看的是"能不能用"，所以三个维度都围绕可运行、可交互、可展示。
 */
export function scoreHtml(html: string): Scores {
  const lower = html.toLowerCase();
  const hasScript = /<script[\s>]/.test(lower);
  const buttonCount = (lower.match(/<button/g) || []).length;
  const inputCount = (lower.match(/<input|<textarea|<select/g) || []).length;
  const eventCount = (
    lower.match(
      /addeventlistener|onclick|oninput|onchange|onsubmit|draggable|dragstart|dragover|drop\b/g,
    ) || []
  ).length;
  const persistCount = (lower.match(/localstorage|indexeddb|setitem/g) || []).length;
  const listCount = (lower.match(/<ul|<ol|<table|role="list"/g) || []).length;

  const styleLength = (lower.match(/<style[\s\S]*?<\/style>/) || [""])[0].length;
  const mediaCount = (lower.match(/@media/g) || []).length;
  const flexGridCount = (lower.match(/display:\s*(flex|grid)/g) || []).length;
  const transitionCount = (lower.match(/transition|animation/g) || []).length;

  const completeness = clamp(
    30 +
      (hasScript ? 18 : 0) +
      Math.min(12, inputCount * 4) +
      Math.min(12, buttonCount * 3) +
      Math.min(10, listCount * 4) +
      (html.length > 4000 ? 10 : html.length > 1800 ? 5 : 0),
  );

  const interactivity = clamp(
    (hasScript ? 26 : 4) +
      Math.min(30, eventCount * 5) +
      Math.min(14, inputCount * 3) +
      Math.min(12, buttonCount * 2) +
      Math.min(18, persistCount * 9),
  );

  const visual = clamp(
    26 +
      Math.min(24, Math.round(styleLength / 90)) +
      Math.min(14, mediaCount * 7) +
      Math.min(18, flexGridCount * 3) +
      Math.min(12, transitionCount * 3) +
      (/(<meta[^>]+viewport)/i.test(html) ? 6 : 0),
  );

  const total = clamp(completeness * 0.4 + interactivity * 0.35 + visual * 0.25);
  return { completeness, interactivity, visual, total };
}

export function rankCandidates<T extends { score: Scores }>(list: T[]): T[] {
  return [...list].sort((a, b) => b.score.total - a.score.total);
}
