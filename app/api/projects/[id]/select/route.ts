import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { versionId?: string } | null;

  if (!body?.versionId) {
    return NextResponse.json({ error: "缺少 versionId" }, { status: 400 });
  }

  const store = await getStore();
  const project = await store.selectVersion(id, body.versionId);
  if (!project) return NextResponse.json({ error: "项目或版本不存在" }, { status: 404 });
  return NextResponse.json({ project });
}
