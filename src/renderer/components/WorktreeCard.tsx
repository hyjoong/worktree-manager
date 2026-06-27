import { Code2, GitBranch, GitCommitHorizontal, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import type { EditorId, WorktreeInfo } from '../../shared/ipc';
import { getWorktreeRemovalBlocker } from '../../shared/worktree-removal';

type WorktreeCardProps = {
  worktree: WorktreeInfo;
  selected: boolean;
  editor: EditorId;
  onSelect(worktree: WorktreeInfo): void;
  onOpen(worktree: WorktreeInfo): void;
  onRemove(worktree: WorktreeInfo): void;
};

export function WorktreeCard({ worktree, selected, editor, onSelect, onOpen, onRemove }: WorktreeCardProps) {
  const removalBlocker = getWorktreeRemovalBlocker(worktree);

  return (
    <Card
      data-worktree-path={worktree.path}
      className={`group relative cursor-default overflow-hidden shadow-none transition-[background-color,border-color,box-shadow,transform] duration-150 ${
        selected
          ? 'border-blue-500/55 bg-blue-500/[0.075] shadow-[inset_3px_0_0_rgb(96_165_250)]'
          : 'hover:border-zinc-500/55 hover:bg-accent/35 hover:shadow-[inset_3px_0_0_rgb(113_113_122_/_0.28)]'
      }`}
      onClick={() => onSelect(worktree)}
      onDoubleClick={() => onOpen(worktree)}
    >
      <CardHeader className="px-2.5 py-2">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <GitBranch className={`size-3.5 shrink-0 ${selected ? 'text-blue-300' : 'text-blue-400/80'}`} />
            <h3 className="truncate text-[13px] font-semibold leading-5 tracking-normal">{formatBranch(worktree)}</h3>
            {worktree.isMain ? (
              <Badge variant="default" className="shrink-0 border-blue-400/35 bg-blue-500/12 text-blue-300">
                main
              </Badge>
            ) : null}
            <Badge variant={badgeVariant(worktree)}>{worktree.status}</Badge>
          </div>
          <div className="mt-0.5 truncate font-mono text-[10.5px] leading-4 text-muted-foreground">{worktree.path}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(worktree);
            }}
            title={`Open in ${editor === 'cursor' ? 'Cursor' : 'VS Code'} (Enter)`}
          >
            <Code2 className="size-3.5" />
            {editor === 'cursor' ? 'Cursor' : 'VS Code'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={removalBlocker !== null}
            onClick={(event) => {
              event.stopPropagation();
              onRemove(worktree);
            }}
            title={removalBlocker ?? 'Remove worktree'}
          >
            <Trash2 className="size-3.5 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-[82px_1fr_74px] gap-2.5 px-2.5 py-1.5 text-xs">
        <Meta label="Dirty" value={worktree.isDirty ? 'Yes' : 'No'} tone={worktree.isDirty ? 'warn' : 'ok'} />
        <div className="min-w-0">
          <div className="mb-0.5 text-[9.5px] font-medium uppercase text-muted-foreground/80">Last commit</div>
          <div className="flex min-w-0 items-center gap-1">
            <GitCommitHorizontal className="size-3.5 shrink-0 text-muted-foreground/70" />
            <span className="truncate font-mono text-[10.5px] text-muted-foreground">
              {worktree.lastCommit !== null
                ? `${worktree.lastCommit.hash} ${worktree.lastCommit.subject}`
                : 'No commit metadata'}
            </span>
          </div>
        </div>
        <div className="min-w-0 text-right">
          <div className="mb-0.5 text-[9.5px] font-medium uppercase text-muted-foreground/80">Updated</div>
          <div className="truncate text-[10.5px] text-muted-foreground">{worktree.lastCommit?.relativeTime ?? '-'}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Meta({ label, value, tone }: { label: string; value: string; tone: 'ok' | 'warn' }) {
  return (
    <div>
      <div className="mb-0.5 text-[9.5px] font-medium uppercase text-muted-foreground/80">{label}</div>
      <div className={tone === 'ok' ? 'text-[10.5px] text-muted-foreground' : 'text-[11px] font-semibold text-amber-400'}>{value}</div>
    </div>
  );
}

function formatBranch(worktree: WorktreeInfo) {
  return worktree.branch ?? (worktree.isBare ? 'bare worktree' : worktree.isDetached ? 'detached HEAD' : 'unknown');
}

function badgeVariant(worktree: WorktreeInfo): 'default' | 'clean' | 'dirty' | 'detached' {
  if (worktree.status === 'dirty') {
    return 'dirty';
  }

  if (worktree.status === 'detached') {
    return 'detached';
  }

  if (worktree.status === 'bare') {
    return 'default';
  }

  return 'clean';
}
