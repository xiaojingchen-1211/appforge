import type { Project, Scores } from "./types";

export interface NewVersionInput {
  prompt: string;
  html: string;
  score: Scores;
  model: string;
  lane: number;
  kind: "initial" | "iteration";
  parentVersionId: string | null;
}

export interface Store {
  driver: "file" | "postgres";
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(input: {
    title: string;
    prompt: string;
    html: string;
    score: Scores;
    model: string;
    lane: number;
  }): Promise<Project>;
  addVersion(projectId: string, input: NewVersionInput): Promise<Project | null>;
  selectVersion(projectId: string, versionId: string): Promise<Project | null>;
  deleteProject(id: string): Promise<boolean>;
}

let cached: Store | null = null;

export async function getStore(): Promise<Store> {
  if (cached) return cached;
  if (process.env.DATABASE_URL) {
    const { createPgStore } = await import("./store-pg");
    cached = await createPgStore(process.env.DATABASE_URL);
  } else {
    const { createFileStore } = await import("./store-file");
    cached = await createFileStore();
  }
  return cached;
}

export const newId = () => crypto.randomUUID();
