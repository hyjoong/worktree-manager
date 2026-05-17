import { describe, expect, it } from 'vitest';
import { buildCommandItems, filterCommandItems, updateRecentCommandIds } from './command-palette';
import type { RegisteredProject } from '../types/project';
import type { WorktreeInfo } from '../../shared/ipc';

const projects: RegisteredProject[] = [
  { name: 'teacher-gguge-front', path: '/Users/me/Desktop/teacher-gguge-front' },
  { name: 'teacher-gguge-main', path: '/Users/me/Desktop/teacher-gguge-main' },
];

const worktrees: WorktreeInfo[] = [
  {
    path: '/Users/me/Desktop/teacher-gguge-front',
    branch: 'main',
    head: 'abc123',
    isDirty: false,
    isBare: false,
    isDetached: false,
    isMain: true,
    status: 'clean',
    lastCommit: null,
  },
  {
    path: '/Users/me/Desktop/teacher-gguge-front-login',
    branch: 'feature/login',
    head: 'def456',
    isDirty: true,
    isBare: false,
    isDetached: false,
    isMain: false,
    status: 'dirty',
    lastCommit: null,
  },
];

describe('command palette helpers', () => {
  it('builds project, worktree, and action commands from app state', () => {
    const items = buildCommandItems({
      projects,
      worktrees,
      activeProject: projects[0] ?? null,
      selectedWorktree: worktrees[1] ?? null,
      editor: 'cursor',
      recentCommandIds: ['action.refresh'],
    });

    expect(items.map((item) => item.id)).toContain('project:/Users/me/Desktop/teacher-gguge-main');
    expect(items.map((item) => item.id)).toContain('worktree.open:/Users/me/Desktop/teacher-gguge-front-login');
    expect(items.map((item) => item.id)).toContain('action.create-worktree');
    expect(items.find((item) => item.id === 'action.refresh')?.isRecent).toBe(true);
  });

  it('fuzzy filters command items by non-contiguous query characters', () => {
    const items = buildCommandItems({
      projects,
      worktrees,
      activeProject: projects[0] ?? null,
      selectedWorktree: worktrees[1] ?? null,
      editor: 'cursor',
      recentCommandIds: [],
    });

    const results = filterCommandItems(items, 'tgm');

    expect(results[0]?.id).toBe('project:/Users/me/Desktop/teacher-gguge-main');
  });

  it('keeps recent command ids unique and newest first', () => {
    expect(updateRecentCommandIds(['action.refresh', 'action.create-worktree'], 'action.refresh')).toEqual([
      'action.refresh',
      'action.create-worktree',
    ]);

    expect(updateRecentCommandIds(['action.refresh'], 'worktree.open:/repo-feature')).toEqual([
      'worktree.open:/repo-feature',
      'action.refresh',
    ]);
  });
});
