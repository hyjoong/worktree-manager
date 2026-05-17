import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { app } from 'electron';
import { z } from 'zod';
import { registeredProjectSchema, type RegisteredProjectInfo } from '../../shared/ipc';

const projectsFileName = 'projects.json';
const projectsFileSchema = z.array(registeredProjectSchema);

export async function loadProjects(): Promise<RegisteredProjectInfo[]> {
  try {
    const content = await readFile(getProjectsFilePath(), 'utf8');
    return projectsFileSchema.parse(JSON.parse(content));
  } catch (error) {
    if (isMissingFileError(error)) {
      return [];
    }

    throw error;
  }
}

export async function saveProjects(projects: RegisteredProjectInfo[]): Promise<void> {
  const filePath = getProjectsFilePath();
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(projectsFileSchema.parse(projects), null, 2), 'utf8');
}

function getProjectsFilePath() {
  return join(app.getPath('userData'), projectsFileName);
}

function isMissingFileError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}
