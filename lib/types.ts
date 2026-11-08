export interface Scores {
  completeness: number;
  interactivity: number;
  visual: number;
  total: number;
}

export interface Candidate {
  id: string;
  title: string;
  summary: string;
  html: string;
  score: Scores;
  model: string;
  lane: number;
  latencyMs: number;
}

export interface Version {
  id: string;
  projectId: string;
  prompt: string;
  html: string;
  score: Scores;
  model: string;
  lane: number;
  kind: "initial" | "iteration";
  parentVersionId: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
  selectedVersionId: string;
  versions: Version[];
}
