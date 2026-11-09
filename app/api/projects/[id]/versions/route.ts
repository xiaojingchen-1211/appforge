import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { generateLane } from "@/lib/llm";
import { scoreHtml } from "@/lib/score";
import { extractTitle } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as {
    prompt?: string;
    parentVersionId?: string;
    html?: string; // 手工编辑时直接传入 HTML，跳过模型生成
  } | null;

  const store = await getStore();
  const project = await store.getProject(id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });

  const parent =
    project.versions.find((v) => v.id === (body?.parentVersionId || project.selectedVersionId)) ??
    project.versions[0];

  // 手工编辑场景：直接存 HTML，不走模型
  if (body?.html && body.html.trim().length > 100) {
    const updated = await store.addVersion(id, {
      prompt: body.prompt?.trim() || "手工编辑 HTML",
      html: body.html.trim(),
      score: scoreHtml(body.html),
      model: "手工编辑",
      lane: 0,
      kind: "iteration",
      parentVersionId: parent?.id ?? null,
    });
    if (!updated) return NextResponse.json({ error: "版本写入失败" }, { status: 500 });
    const version = updated.versions.find((v) => v.id === updated.selectedVersionId);
    return NextResponse.json({
      project: updated,
      version,
      title: extractTitle(body.html, project.title),
      degraded: false,
      notice: "手工编辑版本已保存",
    });
  }

  // 正常迭代：prompt + parentHtml → 模型生成
  const prompt = (body?.prompt ?? "").trim();
  if (prompt.length < 2) {
    return NextResponse.json({ error: "请描述要修改的内容" }, { status: 400 });
  }

  const result = await generateLane(prompt, 0, parent?.html);

  const updated = await store.addVersion(id, {
    prompt,
    html: result.html,
    score: scoreHtml(result.html),
    model: result.model,
    lane: 0,
    kind: "iteration",
    parentVersionId: parent?.id ?? null,
  });

  if (!updated) return NextResponse.json({ error: "版本写入失败" }, { status: 500 });

  const version = updated.versions.find((v) => v.id === updated.selectedVersionId);
  return NextResponse.json({
    project: updated,
    version,
    title: extractTitle(result.html, project.title),
    degraded: result.degraded,
    notice: result.error,
  });
}
