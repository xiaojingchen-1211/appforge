import { Pool } from "pg";
import type { Project, Scores, Version } from "./types";
import type { NewVersionInput, Store } from "./store";

interface ProjectRow {
  id: string;
  title: string;
  prompt: string;
  created_at: Date | string;
  updated_at: Date | string;
  selected_version_id: string;
}

interface VersionRow {
  id: string;
  project_id: string;
  prompt: string;
  html: string;
  score: Scores;
  model: string;
  lane: number;
  kind: "initial" | "iteration";
  parent_version_id: string | null;
  created_at: Date | string;
}

const iso = (v: Date | string) => (v instanceof Date ? v.toISOString() : new Date(v).toISOString());

function toVersion(row: VersionRow): Version {
  return {
    id: row.id,
    projectId: row.project_id,
    prompt: row.prompt,
    html: row.html,
    score: row.score,
    model: row.model,
    lane: row.lane,
    kind: row.kind,
    parentVersionId: row.parent_version_id,
    createdAt: iso(row.created_at),
  };
}

function toProject(row: ProjectRow, versions: Version[]): Project {
  return {
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    selectedVersionId: row.selected_version_id,
    versions: [...versions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  };
}

export async function createPgStore(connectionString: string): Promise<Store> {
  const local = /localhost|127\.0\.0\.1/.test(connectionString);
  const pool = new Pool({
    connectionString,
    max: 3,
    ssl: local ? undefined : { rejectUnauthorized: false },
  });

  let schemaReady: Promise<void> | null = null;
  function ensureSchema(): Promise<void> {
    if (!schemaReady) {
      schemaReady = (async () => {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS projects (
            id text PRIMARY KEY,
            title text NOT NULL,
            prompt text NOT NULL,
            created_at timestamptz NOT NULL,
            updated_at timestamptz NOT NULL,
            selected_version_id text NOT NULL
          );
          CREATE TABLE IF NOT EXISTS versions (
            id text PRIMARY KEY,
            project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            prompt text NOT NULL,
            html text NOT NULL,
            score jsonb NOT NULL,
            model text NOT NULL,
            lane integer NOT NULL,
            kind text NOT NULL,
            parent_version_id text,
            created_at timestamptz NOT NULL
          );
          CREATE INDEX IF NOT EXISTS versions_project_idx ON versions(project_id);
        `);
      })().catch((e) => {
        schemaReady = null;
        throw e;
      });
    }
    return schemaReady;
  }

  async function loadProject(id: string): Promise<Project | null> {
    const p = await pool.query<ProjectRow>("SELECT * FROM projects WHERE id = $1", [id]);
    if (!p.rows.length) return null;
    const v = await pool.query<VersionRow>(
      "SELECT * FROM versions WHERE project_id = $1 ORDER BY created_at DESC",
      [id],
    );
    return toProject(p.rows[0], v.rows.map(toVersion));
  }

  return {
    driver: "postgres",

    async listProjects() {
      await ensureSchema();
      const p = await pool.query<ProjectRow>("SELECT * FROM projects ORDER BY updated_at DESC LIMIT 100");
      if (!p.rows.length) return [];
      const ids = p.rows.map((r) => r.id);
      const v = await pool.query<VersionRow>(
        "SELECT * FROM versions WHERE project_id = ANY($1::text[]) ORDER BY created_at DESC",
        [ids],
      );
      const grouped = new Map<string, Version[]>();
      for (const row of v.rows) {
        const list = grouped.get(row.project_id) ?? [];
        list.push(toVersion(row));
        grouped.set(row.project_id, list);
      }
      return p.rows.map((row) => toProject(row, grouped.get(row.id) ?? []));
    },

    async getProject(id) {
      await ensureSchema();
      return loadProject(id);
    },

    async createProject({ title, prompt, html, score, model, lane }) {
      await ensureSchema();
      const now = new Date().toISOString();
      const projectId = crypto.randomUUID();
      const versionId = crypto.randomUUID();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          "INSERT INTO projects (id, title, prompt, created_at, updated_at, selected_version_id) VALUES ($1,$2,$3,$4,$4,$5)",
          [projectId, title, prompt, now, versionId],
        );
        await client.query(
          `INSERT INTO versions (id, project_id, prompt, html, score, model, lane, kind, parent_version_id, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            versionId,
            projectId,
            prompt,
            html,
            JSON.stringify(score),
            model,
            lane,
            "initial",
            null,
            now,
          ],
        );
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
      const project = await loadProject(projectId);
      if (!project) throw new Error("项目创建失败");
      return project;
    },

    async addVersion(projectId, input: NewVersionInput) {
      await ensureSchema();
      const now = new Date().toISOString();
      const versionId = crypto.randomUUID();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          `INSERT INTO versions (id, project_id, prompt, html, score, model, lane, kind, parent_version_id, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            versionId,
            projectId,
            input.prompt,
            input.html,
            JSON.stringify(input.score),
            input.model,
            input.lane,
            input.kind,
            input.parentVersionId,
            now,
          ],
        );
        const updated = await client.query(
          "UPDATE projects SET selected_version_id = $1, updated_at = $2 WHERE id = $3",
          [versionId, now, projectId],
        );
        await client.query("COMMIT");
        if (!updated.rowCount) return null;
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
      return loadProject(projectId);
    },

    async selectVersion(projectId, versionId) {
      await ensureSchema();
      const now = new Date().toISOString();
      const res = await pool.query(
        "UPDATE projects SET selected_version_id = $1, updated_at = $2 WHERE id = $3 AND EXISTS (SELECT 1 FROM versions WHERE id = $1 AND project_id = $3)",
        [versionId, now, projectId],
      );
      if (!res.rowCount) return null;
      return loadProject(projectId);
    },

    async deleteProject(id) {
      await ensureSchema();
      const res = await pool.query("DELETE FROM projects WHERE id = $1", [id]);
      return (res.rowCount ?? 0) > 0;
    },
  };
}
