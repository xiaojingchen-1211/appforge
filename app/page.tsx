"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Candidate, Project } from "@/lib/types";
import { PreviewFrame } from "@/components/PreviewFrame";

const EXAMPLES = [
  "一个带优先级、截止日期和拖拽排序的项目看板",
  "一个能算房贷月供、并对比提前还款省多少利息的计算器",
  "一个填写资料就能生成个人主页的小工具",
  "一个记录每日饮水量并统计达标天数的打卡应用",
];

const LANES = [
  { value: 1, label: "单路" },
  { value: 2, label: "赛马 2 路" },
  { value: 3, label: "赛马 3 路" },
];

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${Math.floor(diff / 86400)} 天前`;
}

export default function Workbench() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [lanes, setLanes] = useState(2);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [notices, setNotices] = useState<string[]>([]);
  const [provider, setProvider] = useState<"live" | "mock" | null>(null);
  const [error, setError] = useState("");
  const [codeView, setCodeView] = useState<Candidate | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(Array.isArray(d.projects) ? d.projects : []))
      .catch(() => undefined);
  }, []);

  async function generate() {
    const text = prompt.trim();
    if (text.length < 2 || loading) return;
    setLoading(true);
    setError("");
    setCandidates([]);
    setNotices([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, lanes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成失败");
      setCandidates(data.candidates ?? []);
      setNotices(data.notices ?? []);
      setProvider(data.provider ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  async function adopt(candidate: Candidate) {
    if (savingId) return;
    setSavingId(candidate.id);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          html: candidate.html,
          model: candidate.model,
          lane: candidate.lane,
          title: candidate.title,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      router.push(`/p/${data.project.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
      setSavingId(null);
    }
  }

  async function removeProject(id: string) {
    if (!confirm("确定删除这个项目？")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects((list) => list.filter((p) => p.id !== id));
  }

  const hasResults = candidates.length > 0 || loading;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-mark">A</div>
            <div>
              <div className="brand-name">AppForge</div>
              <div className="brand-sub">一句话生成可运行的应用</div>
            </div>
          </div>
          <div className="topbar-right">
            <span className="pill">
              <span className={`dot ${provider === "mock" ? "mock" : provider === "live" ? "live" : ""}`} />
              {provider === "live" ? "模型已连接" : provider === "mock" ? "离线演示模式" : "就绪"}
            </span>
          </div>
        </div>
      </header>

      <main className="container">
        {!hasResults && (
          <section className="hero">
            <div className="eyebrow">AI Native · 生成器</div>
            <h1 className="title">
              说一句话，
              <br />
              得到一个<span className="title-accent">能点、能存</span>的应用
            </h1>
            <p className="lead">
              需求 → 多路智能体并行生成 → 页面内直接运行 → 一键保存。
              生成结果会落库，刷新、换设备回来都还在，还能继续对话式迭代。
            </p>

            <div className="prompt-card">
              <textarea
                className="prompt-input"
                placeholder="描述你想要的应用，例如：一个带优先级、截止日期和拖拽排序的项目看板"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate();
                }}
                maxLength={300}
              />

              {error && <div className="error">{error}</div>}

              <div className="prompt-foot">
                <div className="lanes">
                  <span>生成模式</span>
                  {LANES.map((l) => (
                    <button
                      key={l.value}
                      className={`lane-btn ${lanes === l.value ? "active" : ""}`}
                      onClick={() => setLanes(l.value)}
                      type="button"
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={generate}
                  disabled={loading || prompt.trim().length < 2}
                >
                  {loading ? "生成中…" : "开始生成"}
                </button>
              </div>

              <div className="chips">
                {EXAMPLES.map((ex) => (
                  <button key={ex} className="chip" onClick={() => setPrompt(ex)} type="button">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {hasResults && (
          <section>
            <div className="section-head">
              <div>
                <h2>{loading ? "正在生成候选" : `生成完成 · ${candidates.length} 个候选`}</h2>
                <p>
                  {lanes > 1
                    ? "赛马模式：不同设计方向并行生成，按「完成度 / 交互性 / 视觉」三维打分择优"
                    : "单路生成，可直接选用或重试"}
                </p>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setCandidates([]);
                  setNotices([]);
                  setLoading(false);
                }}
                type="button"
              >
                改需求重来
              </button>
            </div>

            {notices.length > 0 && (
              <div className="notice">
                <span>⚠</span>
                <span>{notices[0]}</span>
              </div>
            )}

            {loading && (
              <div className="loading-row">
                <span className="spinner" />
                <span>
                  {lanes > 1 ? `${lanes} 路并行生成中，通常需要几十秒…` : "生成中，通常需要几十秒…"}
                </span>
              </div>
            )}

            {!loading && (
              <div className="candidates">
                {candidates.map((c, idx) => (
                  <article key={c.id} className={`candidate ${idx === 0 && candidates.length > 1 ? "best" : ""}`}>
                    <div className="cand-head">
                      <div>
                        <h3 className="cand-title">{c.title}</h3>
                        <div className="cand-meta">
                          {c.model} · 第 {c.lane + 1} 路 · {Math.round(c.latencyMs / 1000)}s
                        </div>
                      </div>
                      <span className={`rank ${idx === 0 && candidates.length > 1 ? "best" : ""}`}>
                        {idx === 0 && candidates.length > 1 ? "综合最高" : `#${idx + 1}`}
                      </span>
                    </div>

                    <div className="frame-wrap">
                      <PreviewFrame html={c.html} title={c.title} />
                    </div>

                    <div className="cand-body">
                      <div className="scores">
                        <div className="score-item">
                          完成度
                          <div className="score-num">{c.score.completeness}</div>
                          <div className="bar">
                            <i style={{ width: `${c.score.completeness}%` }} />
                          </div>
                        </div>
                        <div className="score-item">
                          交互性
                          <div className="score-num">{c.score.interactivity}</div>
                          <div className="bar">
                            <i style={{ width: `${c.score.interactivity}%` }} />
                          </div>
                        </div>
                        <div className="score-item">
                          视觉
                          <div className="score-num">{c.score.visual}</div>
                          <div className="bar">
                            <i style={{ width: `${c.score.visual}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="cand-actions">
                        <button className="btn btn-primary" onClick={() => adopt(c)} disabled={savingId !== null}>
                          {savingId === c.id ? "保存中…" : "选用并保存"}
                        </button>
                        <button className="btn" onClick={() => setCodeView(c)} type="button">
                          查看代码
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {error && <div className="error">{error}</div>}
          </section>
        )}

        {codeView && (
          <section>
            <div className="section-head">
              <div>
                <h2>生成代码 · {codeView.title}</h2>
                <p>单文件 HTML，全部内联，可直接下载运行</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    const blob = new Blob([codeView.html], { type: "text/html;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${codeView.title || "app"}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  下载 HTML
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setCodeView(null)}>
                  收起
                </button>
              </div>
            </div>
            <pre
              style={{
                background: "#0e1117",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 16,
                maxHeight: 420,
                overflow: "auto",
                fontSize: 12,
                lineHeight: 1.6,
                color: "#c9d1e0",
              }}
            >
              {codeView.html}
            </pre>
          </section>
        )}

        <section>
          <div className="section-head">
            <div>
              <h2>我的项目</h2>
              <p>生成结果已持久化，刷新页面或换设备访问依然在</p>
            </div>
            <span className="tag">{projects.length} 个</span>
          </div>

          {projects.length === 0 ? (
            <div className="empty-box">还没有项目，先在上面输入一句话需求生成一个</div>
          ) : (
            <div className="projects">
              {projects.map((p) => (
                <div key={p.id} className="project-row">
                  <div className="project-main">
                    <div className="project-name">
                      {p.title}
                      <span className="tag">{p.versions.length} 个版本</span>
                    </div>
                    <div className="project-meta">
                      {p.prompt} · 更新于 {timeAgo(p.updatedAt)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <a className="btn" href={`/p/${p.id}`}>
                      打开
                    </a>
                    <button className="btn btn-danger" type="button" onClick={() => removeProject(p.id)}>
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
