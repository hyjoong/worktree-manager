import * as Dialog from '@radix-ui/react-dialog';
import { GitBranchPlus } from 'lucide-react';
import type { CreateWorktreeMode } from '../../shared/ipc';
import { Button } from './ui/button';
import { Input } from './ui/input';

type CreateWorktreeDialogProps = {
  open: boolean;
  mode: CreateWorktreeMode;
  branch: string;
  path: string;
  isLoading: boolean;
  onOpenChange(open: boolean): void;
  onModeChange(mode: CreateWorktreeMode): void;
  onBranchChange(branch: string): void;
  onPathChange(path: string): void;
  onCreate(): void;
};

export function CreateWorktreeDialog({
  open,
  mode,
  branch,
  path,
  isLoading,
  onOpenChange,
  onModeChange,
  onBranchChange,
  onPathChange,
  onCreate,
}: CreateWorktreeDialogProps) {
  const isNewBranchMode = mode === 'new';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-panel">
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-blue-400">
              <GitBranchPlus className="size-4" />
            </div>
            <div className="min-w-0">
              <Dialog.Title className="text-sm font-semibold">Create worktree</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs leading-5 text-muted-foreground">
                {isNewBranchMode
                  ? 'Create a new branch and worktree path from the current project.'
                  : 'Checkout an existing branch into a new worktree path.'}
              </Dialog.Description>
            </div>
          </div>

          <div className="mt-4 flex rounded-md border border-border bg-card p-0.5">
            <ModeButton active={isNewBranchMode} onClick={() => onModeChange('new')}>
              New branch
            </ModeButton>
            <ModeButton active={!isNewBranchMode} onClick={() => onModeChange('existing')}>
              Existing branch
            </ModeButton>
          </div>

          <div className="mt-3 grid gap-3">
            <label className="grid gap-1.5 text-xs font-medium">
              {isNewBranchMode ? 'New branch name' : 'Existing branch name'}
              <Input
                value={branch}
                onChange={(event) => onBranchChange(event.currentTarget.value)}
                placeholder={isNewBranchMode ? 'feature/new-work' : 'feature/existing-work'}
              />
            </label>
            <label className="grid gap-1.5 text-xs font-medium">
              Worktree path
              <Input value={path} onChange={(event) => onPathChange(event.currentTarget.value)} placeholder="/Users/me/repo-feature" />
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="button" disabled={isLoading || branch.trim().length === 0 || path.trim().length === 0} onClick={onCreate}>
              Create
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ModeButton({ active, children, onClick }: { active: boolean; children: string; onClick(): void }) {
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
