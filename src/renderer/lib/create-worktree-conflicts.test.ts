import { describe, expect, it } from 'vitest';
import { getCreateWorktreeBlocker } from './create-worktree-conflicts';
import type { WorktreeInfo } from '../../shared/ipc';

const baseWorktree: WorktreeInfo = {
  path: '/repo',
  branch: 'main',
  head: '1111111',
  isDirty: false,
  isBare: false,
  isDetached: false,
  isMain: true,
  status: 'clean',
  lastCommit: null,
};

describe('getCreateWorktreeBlocker', () => {
  it('blocks when the selected path already belongs to a worktree', () => {
    expect(
      getCreateWorktreeBlocker({
        branch: 'feature/new',
        path: '/repo-feature',
        worktrees: [{ ...baseWorktree, path: '/repo-feature', branch: 'feature/old', isMain: false }],
      }),
    ).toBe('A worktree already exists at this path.');
  });

  it('blocks when the branch is already checked out in another non-bare worktree', () => {
    expect(
      getCreateWorktreeBlocker({
        branch: 'feature/old',
        path: '/repo-feature-new',
        worktrees: [{ ...baseWorktree, path: '/repo-feature-old', branch: 'feature/old', isMain: false }],
      }),
    ).toBe('This branch is already checked out in another worktree.');
  });

  it('ignores blank branch and path values while the form is incomplete', () => {
    expect(getCreateWorktreeBlocker({ branch: '', path: '', worktrees: [baseWorktree] })).toBeNull();
  });
});
