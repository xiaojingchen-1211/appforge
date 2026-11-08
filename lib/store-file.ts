import fs from "node:fs/promises";
import path from "node:path";
import type { Project, Version } from "./types";
import type { NewVersionInput, Store } from "./store";

interface Db {
  projects: Project[];
}

export async function createFileStore(): Promise<Store> {
  const dir =
    process.env.DATA_DIR ||
    (process.env.VERCEL ? "/tmp/appforge-data" : path.join(process.cwd(), "data"));
  const file = path.join(dir, "store.json");
  await fs.mkdir(dir, { recursive: true });

  // 串行化写操作，避免并发请求把 JSON 写坏
  let queue: Promise<unknown> = Promise.resolve();

  async function readDb(): Promise<Db> {
    try {
      const raw = await fs.readFile(file, "utf8");
      const parsed = JSON.parse(raw) as Db;
      return { projects: Array.isArray(parsed.projects) ? parsed.projects : [] };
    } catch {
      return { projects: [] };
    }
  }

  async function writeDb(db: Db): Promise<void> {
    await fs.writeFile(file, JSON.stringify(db, null, 2), "utf8");
  }

  function mutate<T>(fn: (db: Db) => Promise<T> | T): Promise<T> {
    const run = queue.then(async () => {
      const db = await readDb();
      const result = await fn(db);
      await writeDb(db);
      return result;
    });
    queue = run.catch(() => undefined);
    return run;
  }

  function sortVersions(v: Version[]): Version[] {
    return [...v].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  return {
    driver: "file",

    async listProjects() {
      const db = await readDb();
      return db.projects
        .map((p) => ({ ...p, versions: sortVersions(p.versions) }))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },

    async getProject(id) {
      const db = await readDb();
      const found = db.projects.find((p) => p.id === id);
      return found ? { ...found, versions: sortVersions(found.versions) } : null;
    },

    async createProject({ title, prompt, html, score, model, lane }) {
      return mutate((db) => {
        const now = new Date().toISOString();
        const projectId = crypto.randomUUID();
        const version: Version = {
          id: crypto.randomUUID(),
          projectId,
          prompt,
          html,
          score,
          model,
          lane,
          kind: "initial",
          parentVersionId: null,
          createdAt: now,
        };
        const project: Project = {
          id: projectId,
          title,
          prompt,
          createdAt: now,
          updatedAt: now,
          selectedVersionId: version.id,
          versions: [version],
        };
        db.projects.unshift(project);
        return { ...project };
      });
    },

    async addVersion(projectId, input: NewVersionInput) {
      return mutate((db) => {
        const project = db.projects.find((p) => p.id === projectId);
        if (!project) return null;
        const now = new Date().toISOString();
        const version: Version = {
          id: crypto.randomUUID(),
          projectId,
          prompt: input.prompt,
          html: input.html,
          score: input.score,
          model: input.model,
          lane: input.lane,
          kind: input.kind,
          parentVersionId: input.parentVersionId,
          createdAt: now,
        };
        project.versions.push(version);
        project.selectedVersionId = version.id;
        project.updatedAt = now;
        return { ...project, versions: sortVersions(project.versions) };
      });
    },

    async selectVersion(projectId, versionId) {
      return mutate((db) => {
        const project = db.projects.find((p) => p.id === projectId);
        if (!project || !project.versions.some((v) => v.id === versionId)) return null;
        project.selectedVersionId = versionId;
        project.updatedAt = new Date().toISOString();
        return { ...project, versions: sortVersions(project.versions) };
      });
    },

    async deleteProject(id) {
      return mutate((db) => {
        const before = db.projects.length;
        db.projects = db.projects.filter((p) => p.id !== id);
        return db.projects.length !== before;
      });
    },
  };
}
