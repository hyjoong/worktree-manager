import type { WorktreeInfo } from '../../shared/ipc';

type WorktreeListProps = {
  worktrees: WorktreeInfo[];
  isLoading: boolean;
  hasProject: boolean;
};

export function WorktreeList({ worktrees, isLoading, hasProject }: WorktreeListProps) {
  if (isLoading) {
    return <section className="empty-state">Loading worktrees...</section>;
  }

  if (!hasProject) {
    return <section className="empty-state">Enter a local Git project path to inspect its worktrees.</section>;
  }

  if (worktrees.length === 0) {
    return <section className="empty-state">No worktrees were reported for this project.</section>;
  }

  return (
    <section className="worktree-section" aria-label="Worktrees">
      <div className="table-header">
        <span>Path</span>
        <span>Branch</span>
        <span>Status</span>
      </div>
      <div className="worktree-list">
        {worktrees.map((worktree) => (
          <article className="worktree-row" key={`${worktree.path}:${worktree.branch ?? worktree.head ?? 'unknown'}`}>
            <span className="path-cell" title={worktree.path}>
              {worktree.path}
            </span>
            <span className="branch-cell">{formatBranch(worktree)}</span>
            <span className={worktree.isDirty ? 'dirty-badge' : 'clean-badge'}>
              {worktree.isDirty ? 'Dirty' : 'Clean'}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatBranch(worktree: WorktreeInfo) {
  if (worktree.branch !== null) {
    return worktree.branch;
  }

  if (worktree.isBare) {
    return 'bare';
  }

  if (worktree.isDetached) {
    return 'detached';
  }

  return '-';
}
