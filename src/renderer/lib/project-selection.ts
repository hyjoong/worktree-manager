import type { RegisteredProject } from '../types/project';

export function selectInitialProject(projects: RegisteredProject[], activeProjectPath: string | null) {
  if (projects.length === 0) {
    return null;
  }

  if (activeProjectPath !== null) {
    return projects.find((project) => project.path === activeProjectPath) ?? projects[0];
  }

  return projects[0];
}
