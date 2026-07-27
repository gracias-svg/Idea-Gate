// src/lib/projectRepository.ts
// Sprint 07 (W8) — Project selector shell.
//
// This is NOT a new data model or backend. The engine still has exactly one
// active idea (/api/data, single filesystem project — confirmed in Phase A/A2).
// ProjectRepository is a thin local label registry so the Workspace header can
// show/switch a project *name* — it does not fetch different artifacts per
// project. Wiring real multi-project storage is Mission 14.5 (WOS), explicitly
// future and out of scope here.
//
// "+ New Project" (this file) creates/switches a local name slot only. It is
// deliberately distinct from TopBar's "New Idea", which calls
// runtime.resetWorkspace() and resets the *actual active lifecycle run* on
// disk (src/lib/RuntimeContext.tsx RESET_WORKSPACE). Renaming or switching a
// project here never touches the lifecycle run.
//
// Convention matched from A6: one STORAGE_KEY, one JSON blob, hydrate + persist
// via try/catch (see GlobalStore.tsx, RuntimeContext.tsx). No new persistence
// pattern introduced.

export interface Project {
  id:        string;
  name:      string;
  createdAt: number;
}

export interface ProjectRepository {
  list(): Project[];
  get(id: string): Project | null;
  create(name: string): Project;
  switch(id: string): Project | null;
  getActive(): Project | null;
  rename(id: string, name: string): Project | null;
}

const STORAGE_KEY = 'ig_projects_v1';

interface ProjectStoreShape {
  projects: Project[];
  activeId: string | null;
}

const DEFAULT_SHAPE: ProjectStoreShape = { projects: [], activeId: null };

function load(): ProjectStoreShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ProjectStoreShape;
  } catch { /* corrupt storage — fall back to empty */ }
  return { ...DEFAULT_SHAPE, projects: [] };
}

function persist(shape: ProjectStoreShape): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(shape)); } catch { /* storage full */ }
}

function makeId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class LocalProjectRepository implements ProjectRepository {
  list(): Project[] {
    return load().projects;
  }

  get(id: string): Project | null {
    return load().projects.find(p => p.id === id) ?? null;
  }

  create(name: string): Project {
    const shape = load();
    const project: Project = { id: makeId(), name: name.trim() || 'Untitled Project', createdAt: Date.now() };
    shape.projects = [...shape.projects, project];
    shape.activeId = project.id;
    persist(shape);
    return project;
  }

  switch(id: string): Project | null {
    const shape = load();
    const project = shape.projects.find(p => p.id === id) ?? null;
    if (project) { shape.activeId = id; persist(shape); }
    return project;
  }

  getActive(): Project | null {
    const shape = load();
    if (!shape.activeId) return null;
    return shape.projects.find(p => p.id === shape.activeId) ?? null;
  }

  rename(id: string, name: string): Project | null {
    const shape = load();
    const project = shape.projects.find(p => p.id === id) ?? null;
    if (!project) return null;
    project.name = name.trim() || project.name;
    persist(shape);
    return { ...project };
  }
}

// Ensures a default project exists so the header always has something to show
// on first load — created lazily, never on module import (avoids SSR access
// to localStorage).
export function ensureDefaultProject(repo: ProjectRepository, fallbackName: string): Project {
  const active = repo.getActive();
  if (active) return active;
  const existing = repo.list();
  if (existing.length > 0) return existing[0];
  return repo.create(fallbackName);
}
