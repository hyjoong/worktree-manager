import { describe, expect, it } from 'vitest';
import { getWorktreeRemovalBlocker } from './worktree-removal';
import type { WorktreeInfo } from './ipc';

const cleanFeatureWorktree: WorktreeInfo = {
  path: '/repo-feature',
  branch: 'feature/a',
  head: 'abc123',
  isDirty: false,
  isBare: false,
  isDetached: false,
  isMain: false,
  status: 'clean',
  lastCommit: null,
};

describe('getWorktreeRemovalBlocker', () => {
  it('blocks main worktrees from removal', () => {
    expect(getWorktreeRemovalBlocker({ ...cleanFeatureWorktree, isMain: true })).toBe('The main worktree cannot be removed.');
  });

  it('blocks dirty worktrees from removal', () => {
    expect(getWorktreeRemovalBlocker({ ...cleanFeatureWorktree, isDirty: true })).toBe(
      'Commit, stash, or discard changes before removing this worktree.',
    );
  });

  it('allows clean non-main worktrees to be removed', () => {
    expect(getWorktreeRemovalBlocker(cleanFeatureWorktree)).toBeNull();
  });
});
