import type { WorktreeInfo } from '../../shared/ipc';

export function getCreateWorktreeBlocker({
  branch,
  path,
  worktrees,
}: {
  branch: string;
  path: string;
  worktrees: WorktreeInfo[];
}): string | null {
  const normalizedPath = path.trim();
  const normalizedBranch = branch.trim();

  if (normalizedPath.length > 0 && worktrees.some((worktree) => worktree.path === normalizedPath)) {
    return 'A worktree already exists at this path.';
  }

  if (
    normalizedBranch.length > 0 &&
    worktrees.some((worktree) => !worktree.isBare && worktree.branch === normalizedBranch)
  ) {
    return 'This branch is already checked out in another worktree.';
  }

  return null;
}
