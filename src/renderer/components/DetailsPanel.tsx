import { Copy, ExternalLink, GitBranch, GitCommitHorizontal } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import type { WorktreeInfo } from '../../shared/ipc';

type DetailsPanelProps = {
  worktree: WorktreeInfo | null;
  onOpen(worktree: WorktreeInfo): void;
};

export function DetailsPanel({ worktree, onOpen }: DetailsPanelProps) {
  if (worktree === null) {
    return (
      <aside className="border-l border-border bg-panel p-2">
        <Card className="h-full">
          <CardContent className="flex h-full items-center justify-center p-6 text-center text-xs text-muted-foreground">
            Select a worktree to inspect details.
          </CardContent>
        </Card>
      </aside>
    );
  }

  return (
    <aside className="min-h-0 border-l border-border bg-panel p-2">
      <Card className="flex h-full min-h-0 flex-col">
        <CardHeader>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <GitBranch className="size-4 text-blue-400" />
              <h2 className="truncate text-sm font-semibold">{worktree.branch ?? 'Detached worktree'}</h2>
            </div>
            <div className="mt-1">
              <Badge variant={worktree.isDirty ? 'dirty' : 'clean'}>{worktree.isDirty ? 'dirty' : 'clean'}</Badge>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpen(worktree)}>
            <ExternalLink className="size-3.5" />
            Open
          </Button>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 space-y-4 overflow-auto text-xs">
          <Detail label="Path" value={worktree.path} mono />
          <Detail label="HEAD" value={worktree.head ?? '-'} mono />
          <Detail label="Branch" value={worktree.branch ?? '-'} />
          <Detail label="Status" value={worktree.status} />

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase text-muted-foreground">
              <GitCommitHorizontal className="size-3.5" />
              Last commit
            </div>
            {worktree.lastCommit !== null ? (
              <div className="rounded-md border border-border bg-background p-2">
                <div className="font-mono text-[11px] text-blue-400">{worktree.lastCommit.hash}</div>
                <div className="mt-1 leading-5">{worktree.lastCommit.subject}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{worktree.lastCommit.relativeTime}</div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border p-3 text-muted-foreground">No commit available</div>
            )}
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => void navigator.clipboard.writeText(worktree.path)}
          >
            <Copy className="size-3.5" />
            Copy path
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">{label}</div>
      <div className={`break-all rounded-md border border-border bg-background p-2 ${mono ? 'font-mono text-[11px]' : ''}`}>{value}</div>
    </div>
  );
}
