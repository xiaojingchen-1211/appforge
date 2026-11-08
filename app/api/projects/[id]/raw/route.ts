import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getStore();
  const project = await store.getProject(id);
  if (!project) return new NextResponse("项目不存在", { status: 404 });

  const want = new URL(req.url).searchParams.get("v");
  const version =
    project.versions.find((v) => v.id === want) ??
    project.versions.find((v) => v.id === project.selectedVersionId) ??
    project.versions[0];

  if (!version) return new NextResponse("版本不存在", { status: 404 });

  return new NextResponse(version.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
