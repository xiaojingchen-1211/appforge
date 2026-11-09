"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Project, Version } from "@/lib/types";
import { PreviewFrame } from "@/components/PreviewFrame";

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [iterate, setIterate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [editHtml, setEditHtml] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/projects/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d?.project) setProject(d.project as Project);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  const selected: Version | undefined =
    project?.versions.find((v) => v.id === project.selectedVersionId) ?? project?.versions[0];

  async function selectVersion(versionId: string) {
    if (!project) return;
    const res = await fetch(`/api/projects/${project.id}/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    const data = await res.json();
    if (res.ok) setProject(data.project);
  }

  async function submitIterate() {
    if (!project || iterate.trim().length < 2 || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/projects/${project.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: iterate.trim(), parentVersionId: selected?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "迭代失败");
      setProject(data.project);
      setIterate("");
      if (data.notice) setNotice(data.notice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "迭代失败");
    } finally {
      setBusy(false);
    }
  }

  async function removeProject() {
    if (!project || !confirm("确定删除这个项目？")) return;
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    router.push("/");
  }

  function openEditor() {
    if (!selected) return;
    setEditHtml(selected.html);
    setEditing(true);
    setEditError("");
  }

  async function saveEdit() {
    if (!project || editBusy) return;
    if (editHtml.trim().length < 100) {
      setEditError("HTML 太短，请确认内容");
      return;
    }
    setEditBusy(true);
    setEditError("");
    try {
      const res = await fetch(`/api/projects/${project.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: editHtml,
          prompt: "手工编辑 HTML",
          parentVersionId: selected?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      setProject(data.project);
      setEditing(false);
      setNotice("手工编辑版本已保存 ✓");
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setEditBusy(false);
    }
  }

  if (notFound) {
    return (
      <main className="container">
        <div className="empty-box" style={{ marginTop: 80 }}>
          项目不存在或已被删除 · <a href="/" style={{ color: "var(--accent)" }}>返回工作台</a>
        </div>
      </main>
    );
  }

  if (!project || !selected) {
    return (
      <main className="container">
        <div className="loading-row" style={{ marginTop: 80 }}>
          <span className="spinner" />
          <span>加载项目…</span>
        </div>
      </main>
    );
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/">
            <div className="brand-mark">A</div>
            <div>
              <div className="brand-name">AppForge</div>
              <div className="brand-sub">项目详情</div>
            </div>
          </a>
          <div className="topbar-right">
            <a className="btn" href={`/api/projects/${project.id}/raw`} target="_blank" rel="noreferrer">
              新窗口打开应用
            </a>
          </div>
        </div>
      </header>

      <main className="container">
        <a className="back-link" href="/">
          ← 返回工作台
        </a>

        <h1 style={{ fontSize: 26, margin: "0 0 6px", letterSpacing: "-0.3px" }}>{project.title}</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 4px" }}>{project.prompt}</p>
        <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>
          {project.versions.length} 个版本 · 当前：{selected.kind === "initial" ? "初版" : "迭代版"} ·{" "}
          {selected.model} · 综合分 {selected.score.total}
        </p>

        {notice && (
          <div className="notice" style={{ marginTop: 16 }}>
            <span>⚠</span>
            <span>{notice}</span>
          </div>
        )}

        <div className="detail-grid">
          <div>
            <div className="preview-shell">
              <PreviewFrame html={selected.html} title={project.title} />
            </div>
          </div>

          <aside className="side">
            <div className="card">
              <h3>继续迭代</h3>
              <textarea
                className="iterate-input"
                placeholder="例如：把主色调换成蓝色，并增加任务搜索"
                value={iterate}
                onChange={(e) => setIterate(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submitIterate();
                }}
              />
              {error && <div className="error">{error}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  className="btn btn-primary"
                  onClick={submitIterate}
                  disabled={busy || iterate.trim().length < 2}
                  style={{ flex: 1 }}
                >
                  {busy ? "迭代中…" : "生成新版本"}
                </button>
              </div>
              <p style={{ color: "var(--muted)", fontSize: 11, margin: "8px 0 0" }}>
                新版本会基于当前版本增量修改，旧版本保留可回滚
              </p>
            </div>

            <div className="card">
              <h3>版本历史</h3>
              {project.versions.map((v) => (
                <div
                  key={v.id}
                  className={`version ${v.id === selected.id ? "active" : ""}`}
                  onClick={() => selectVersion(v.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div style={{ minWidth: 0 }}>
                    <div>{v.kind === "initial" ? "初版" : "迭代版"} · {timeLabel(v.createdAt)}</div>
                    <small>{v.prompt.slice(0, 34)}</small>
                  </div>
                  <span className="mono" style={{ color: "var(--muted)" }}>{v.score.total}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <h3>项目操作</h3>
              <a
                className="btn"
                href={`/api/projects/${project.id}/raw`}
                target="_blank"
                rel="noreferrer"
                style={{ display: "block", textAlign: "center" }}
              >
                在新窗口运行
              </a>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  const blob = new Blob([selected.html], { type: "text/html;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${project.title || "app"}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{ display: "block", width: "100%", marginTop: 8 }}
              >
                下载 HTML 文件
              </button>
              <button
                className="btn"
                type="button"
                onClick={openEditor}
                style={{ display: "block", width: "100%", marginTop: 8 }}
              >
                手工编辑 HTML
              </button>
              <button
                className="btn btn-danger"
                onClick={removeProject}
                type="button"
                style={{ display: "block", width: "100%", marginTop: 8 }}
              >
                删除项目
              </button>
            </div>
          </aside>
        </div>

        {editing && (
          <div className="card" style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>手工编辑 HTML</h3>
              <span style={{ color: "var(--muted)", fontSize: 12 }}>保存后会生成一个新版本，旧版本不受影响</span>
            </div>
            <textarea
              value={editHtml}
              onChange={(e) => setEditHtml(e.target.value)}
              spellCheck={false}
              style={{
                width: "100%",
                minHeight: 300,
                fontFamily: "Menlo, Monaco, monospace",
                fontSize: 12,
                padding: 12,
                border: "1px solid var(--border)",
                borderRadius: 8,
                background: "#0e1117",
                color: "#c9d1e0",
                resize: "vertical",
              }}
            />
            {editError && <div className="error">{editError}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                className="btn btn-primary"
                onClick={saveEdit}
                disabled={editBusy}
              >
                {editBusy ? "保存中…" : "保存为新版本"}
              </button>
              <button className="btn btn-ghost" onClick={() => setEditing(false)} type="button">
                取消
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
