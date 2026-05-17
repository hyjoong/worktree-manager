import { Code2, GitBranch, GitCommitHorizontal, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import type { EditorId, WorktreeInfo } from '../../shared/ipc';

type WorktreeCardProps = {
  worktree: WorktreeInfo;
  selected: boolean;
  editor: EditorId;
  onSelect(worktree: WorktreeInfo): void;
  onOpen(worktree: WorktreeInfo): void;
  onRemove(worktree: WorktreeInfo): void;
};

export function WorktreeCard({ worktree, selected, editor, onSelect, onOpen, onRemove }: WorktreeCardProps) {
  return (
    <Card
      className={`cursor-default transition-colors ${
        selected ? 'border-blue-500/45 bg-blue-500/10' : 'hover:border-zinc-500/45 hover:bg-accent/45'
      }`}
      onClick={() => onSelect(worktree)}
    >
      <CardHeader className="py-2">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <GitBranch className="size-3.5 shrink-0 text-blue-400" />
            <h3 className="truncate text-sm font-semibold">{formatBranch(worktree)}</h3>
            <Badge variant={badgeVariant(worktree)}>{worktree.status}</Badge>
          </div>
          <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{worktree.path}</div>
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
          >
            <Code2 className="size-3.5" />
            {editor === 'cursor' ? 'Cursor' : 'VS Code'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={worktree.isMain}
            onClick={(event) => {
              event.stopPropagation();
              onRemove(worktree);
            }}
            title={worktree.isMain ? 'Main worktree cannot be removed' : 'Remove worktree'}
          >
            <Trash2 className="size-3.5 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-[110px_1fr_72px] gap-3 py-2 text-xs">
        <Meta label="Dirty" value={worktree.isDirty ? 'Yes' : 'No'} tone={worktree.isDirty ? 'warn' : 'ok'} />
        <div className="min-w-0">
          <div className="mb-1 text-[10px] uppercase text-muted-foreground">Last commit</div>
          <div className="flex min-w-0 items-center gap-1.5">
            <GitCommitHorizontal className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              {worktree.lastCommit !== null
                ? `${worktree.lastCommit.hash} ${worktree.lastCommit.subject}`
                : 'No commit metadata'}
            </span>
          </div>
        </div>
        <div className="min-w-0 text-right">
          <div className="mb-1 text-[10px] uppercase text-muted-foreground">Updated</div>
          <div className="truncate text-[11px] text-muted-foreground">{worktree.lastCommit?.relativeTime ?? '-'}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Meta({ label, value, tone }: { label: string; value: string; tone: 'ok' | 'warn' }) {
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className={tone === 'ok' ? 'text-emerald-500' : 'text-amber-500'}>{value}</div>
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
