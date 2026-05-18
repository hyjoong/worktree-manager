import type { WorktreeInfo } from './ipc';

export function getWorktreeRemovalBlocker(worktree: Pick<WorktreeInfo, 'isDirty' | 'isMain'>): string | null {
  if (worktree.isMain) {
    return 'The main worktree cannot be removed.';
  }

  if (worktree.isDirty) {
    return 'Commit, stash, or discard changes before removing this worktree.';
  }

  return null;
}
