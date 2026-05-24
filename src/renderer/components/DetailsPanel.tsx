import { Copy, Download, ExternalLink, GitBranch, GitCommitHorizontal, Info, RefreshCw } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import type { AppInfo, EditorId, UpdateStatus, WorktreeInfo } from '../../shared/ipc';

type DetailsPanelProps = {
  worktree: WorktreeInfo | null;
  editor: EditorId;
  view: 'worktree' | 'app';
  appInfo: AppInfo | null;
  updateStatus: UpdateStatus;
  isUpdateActionDisabled: boolean;
  onViewChange(view: 'worktree' | 'app'): void;
  onOpen(worktree: WorktreeInfo): void;
  onCopyPath(worktree: WorktreeInfo): void;
  onUpdateAction(): void;
};

export function DetailsPanel({
  worktree,
  editor,
  view,
  appInfo,
  updateStatus,
  isUpdateActionDisabled,
  onViewChange,
  onOpen,
  onCopyPath,
  onUpdateAction,
}: DetailsPanelProps) {
  if (view === 'app') {
    return (
      <PanelShell view={view} onViewChange={onViewChange}>
        <AppInfoPanel
          appInfo={appInfo}
          updateStatus={updateStatus}
          isUpdateActionDisabled={isUpdateActionDisabled}
          onUpdateAction={onUpdateAction}
        />
      </PanelShell>
    );
  }

  if (worktree === null) {
    return (
      <PanelShell view={view} onViewChange={onViewChange}>
        <Card className="min-h-0 flex-1">
          <CardContent className="flex h-full items-center justify-center p-6 text-center text-xs text-muted-foreground">
            Select a worktree to inspect details.
          </CardContent>
        </Card>
      </PanelShell>
    );
  }

  return (
    <PanelShell view={view} onViewChange={onViewChange}>
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
            {editor === 'cursor' ? 'Cursor' : 'VS Code'}
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
            onClick={() => onCopyPath(worktree)}
          >
            <Copy className="size-3.5" />
            Copy path
          </Button>
        </CardContent>
      </Card>
    </PanelShell>
  );
}

function PanelShell({
  view,
  children,
  onViewChange,
}: {
  view: 'worktree' | 'app';
  children: React.ReactNode;
  onViewChange(view: 'worktree' | 'app'): void;
}) {
  return (
    <aside className="flex min-h-0 flex-col gap-2 border-l border-border bg-panel p-2">
      <div className="flex rounded-md border border-border bg-card p-0.5">
        <PanelTab active={view === 'worktree'} onClick={() => onViewChange('worktree')}>
          Worktree
        </PanelTab>
        <PanelTab active={view === 'app'} onClick={() => onViewChange('app')}>
          App
        </PanelTab>
      </div>
      {children}
    </aside>
  );
}

function PanelTab({ active, children, onClick }: { active: boolean; children: string; onClick(): void }) {
  return (
    <button
      type="button"
      className={`h-7 flex-1 rounded px-2 text-xs font-medium transition ${
        active ? 'border border-border bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function AppInfoPanel({
  appInfo,
  updateStatus,
  isUpdateActionDisabled,
  onUpdateAction,
}: {
  appInfo: AppInfo | null;
  updateStatus: UpdateStatus;
  isUpdateActionDisabled: boolean;
  onUpdateAction(): void;
}) {
  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardHeader>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Info className="size-4 text-blue-400" />
            <h2 className="truncate text-sm font-semibold">Worktree Manager</h2>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Version and update status</div>
        </div>
        <Badge variant={updateStatus.phase === 'error' ? 'dirty' : 'clean'}>{formatUpdateBadge(updateStatus, appInfo)}</Badge>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-4 overflow-auto text-xs">
        <Detail label="Current version" value={appInfo?.version ?? '-'} mono />
        <Detail label="Build mode" value={appInfo?.isPackaged === true ? 'Packaged app' : 'Development app'} />

        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">Update status</div>
          <div className="rounded-md border border-border bg-background p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{formatUpdateTitle(updateStatus)}</span>
              {updateStatus.percent !== undefined ? <span className="font-mono text-[11px] text-muted-foreground">{updateStatus.percent}%</span> : null}
            </div>
            <div className="mt-1 leading-5 text-muted-foreground">{formatUpdateMessage(updateStatus, appInfo)}</div>
            {updateStatus.version !== undefined ? <div className="mt-1 font-mono text-[11px] text-blue-400">latest {updateStatus.version}</div> : null}
          </div>
        </div>

        <div className="rounded-md border border-border bg-background p-2 leading-5 text-muted-foreground">
          {appInfo?.isPackaged === true
            ? '업데이트가 있으면 앱이 GitHub Releases의 ZIP을 내려받고, 재시작 시 새 버전을 적용합니다.'
            : '개발 환경에서는 자동 업데이트를 실행하지 않습니다. 배포된 앱에서만 업데이트 확인이 가능합니다.'}
        </div>

        <Button type="button" variant="secondary" className="w-full" disabled={isUpdateActionDisabled} onClick={onUpdateAction}>
          {updateStatus.phase === 'checking' || updateStatus.phase === 'downloading' ? (
            <RefreshCw className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          {updateStatus.phase === 'downloaded' ? 'Restart and install' : 'Check for updates'}
        </Button>
      </CardContent>
    </Card>
  );
}

function formatUpdateBadge(status: UpdateStatus, appInfo: AppInfo | null) {
  if (appInfo?.isPackaged === false) {
    return 'dev';
  }

  if (status.phase === 'downloaded') {
    return 'ready';
  }

  if (status.phase === 'downloading') {
    return 'downloading';
  }

  if (status.phase === 'error') {
    return 'error';
  }

  return 'updates';
}

function formatUpdateTitle(status: UpdateStatus) {
  if (status.phase === 'idle') {
    return 'Ready to check';
  }

  return status.phase.replaceAll('-', ' ');
}

function formatUpdateMessage(status: UpdateStatus, appInfo: AppInfo | null) {
  if (appInfo?.isPackaged === false && status.phase === 'idle') {
    return 'Development app에서는 업데이트 확인을 건너뜁니다. DMG로 설치한 packaged app에서 확인하세요.';
  }

  return status.message;
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">{label}</div>
      <div className={`break-all rounded-md border border-border bg-background p-2 ${mono ? 'font-mono text-[11px]' : ''}`}>{value}</div>
    </div>
  );
}
