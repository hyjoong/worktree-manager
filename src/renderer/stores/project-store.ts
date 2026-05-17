import type { RegisteredProject } from '../types/project';

const projectsStorageKey = 'worktree-manager-projects';

export function createRegisteredProject(path: string): RegisteredProject {
  const normalizedPath = path.trim().replace(/\/+$/, '');

  return {
    name: normalizedPath.split('/').filter(Boolean).at(-1) ?? normalizedPath,
    path: normalizedPath,
  };
}

export function upsertRecentProject(projects: RegisteredProject[], project: RegisteredProject) {
  return [project, ...projects.filter((item) => item.path !== project.path)].slice(0, 12);
}

export function loadStoredProjects(): RegisteredProject[] {
  const rawProjects = window.localStorage.getItem(projectsStorageKey);

  if (rawProjects === null) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawProjects);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isRegisteredProject);
  } catch {
    return [];
  }
}

export function saveStoredProjects(projects: RegisteredProject[]) {
  window.localStorage.setItem(projectsStorageKey, JSON.stringify(projects));
}

function isRegisteredProject(value: unknown): value is RegisteredProject {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<RegisteredProject>;
  return typeof candidate.name === 'string' && typeof candidate.path === 'string';
}
