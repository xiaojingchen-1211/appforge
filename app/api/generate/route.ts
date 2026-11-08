import { NextResponse } from "next/server";
import { generateLane, hasProvider } from "@/lib/llm";
import { extractTitle, summarizePrompt } from "@/lib/prompt";
import { scoreHtml, rankCandidates } from "@/lib/score";
import type { Candidate } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const { prompt, lanes, parentHtml } = body as {
    prompt?: string;
    lanes?: number;
    parentHtml?: string;
  };

  const text = (prompt ?? "").trim();
  if (text.length < 2) {
    return NextResponse.json({ error: "请至少输入 2 个字的需求描述" }, { status: 400 });
  }
  if (text.length > 300) {
    return NextResponse.json({ error: "需求描述请控制在 300 字以内" }, { status: 400 });
  }

  const laneCount = Math.max(1, Math.min(3, Number(lanes) || 1));

  const results = await Promise.all(
    Array.from({ length: laneCount }, async (_, lane) => {
      const result = await generateLane(text, lane, parentHtml);
      const score = scoreHtml(result.html);
      const candidate: Candidate = {
        id: crypto.randomUUID(),
        title: extractTitle(result.html, summarizePrompt(text)),
        summary: summarizePrompt(text),
        html: result.html,
        score,
        model: result.model,
        lane,
        latencyMs: result.latencyMs,
      };
      return { candidate, degraded: result.degraded, error: result.error };
    }),
  );

  const candidates = rankCandidates(results.map((r) => r.candidate));
  const degraded = results.some((r) => r.degraded);

  return NextResponse.json({
    candidates,
    provider: hasProvider() ? "live" : "mock",
    degraded,
    notices: results.map((r) => r.error).filter(Boolean),
  });
}
