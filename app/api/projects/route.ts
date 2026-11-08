import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { scoreHtml } from "@/lib/score";
import { extractTitle, summarizePrompt } from "@/lib/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = await getStore();
  const projects = await store.listProjects();
  return NextResponse.json({ projects, driver: store.driver });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    prompt?: string;
    html?: string;
    model?: string;
    lane?: number;
    title?: string;
  } | null;

  const prompt = (body?.prompt ?? "").trim();
  const html = (body?.html ?? "").trim();

  if (!prompt || !html) {
    return NextResponse.json({ error: "缺少 prompt 或 html" }, { status: 400 });
  }
  if (html.length > 400_000) {
    return NextResponse.json({ error: "生成内容过大，请精简后重试" }, { status: 413 });
  }

  try {
    const store = await getStore();
    const project = await store.createProject({
      title: body?.title?.trim() || extractTitle(html, summarizePrompt(prompt)),
      prompt,
      html,
      score: scoreHtml(html),
      model: body?.model || "unknown",
      lane: Number(body?.lane) || 0,
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "保存失败", detail: msg }, { status: 500 });
  }
}
