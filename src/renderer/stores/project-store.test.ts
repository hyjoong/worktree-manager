import { describe, expect, it } from 'vitest';
import { createRegisteredProject, upsertRecentProject } from './project-store';

describe('project-store helpers', () => {
  it('creates a readable project name from a selected path', () => {
    expect(createRegisteredProject('/Users/me/Projects/worktree-manager')).toEqual({
      name: 'worktree-manager',
      path: '/Users/me/Projects/worktree-manager',
    });
  });

  it('deduplicates projects and moves the newest registration to the front', () => {
    const existing = [
      { name: 'alpha', path: '/repo/alpha' },
      { name: 'beta', path: '/repo/beta' },
    ];

    expect(upsertRecentProject(existing, { name: 'beta', path: '/repo/beta' })).toEqual([
      { name: 'beta', path: '/repo/beta' },
      { name: 'alpha', path: '/repo/alpha' },
    ]);
  });
});
