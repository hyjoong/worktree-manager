import { describe, expect, it } from 'vitest';
import type { RegisteredProject } from '../types/project';
import { selectInitialProject } from './project-selection';

const projects: RegisteredProject[] = [
  { name: 'front', path: '/Users/me/Desktop/front' },
  { name: 'main', path: '/Users/me/Desktop/main' },
];

describe('selectInitialProject', () => {
  it('returns null when there are no registered projects', () => {
    expect(selectInitialProject([], null)).toBeNull();
  });

  it('selects the first registered project when there is no active project', () => {
    expect(selectInitialProject(projects, null)).toEqual(projects[0]);
  });

  it('keeps the active project when it is still registered', () => {
    expect(selectInitialProject(projects, '/Users/me/Desktop/main')).toEqual(projects[1]);
  });
});
