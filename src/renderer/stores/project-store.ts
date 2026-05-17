import type { RegisteredProject } from '../types/project';

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
