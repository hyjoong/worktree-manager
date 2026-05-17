import * as Dialog from '@radix-ui/react-dialog';
import { GitBranchPlus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

type CreateWorktreeDialogProps = {
  open: boolean;
  branch: string;
  path: string;
  isLoading: boolean;
  onOpenChange(open: boolean): void;
  onBranchChange(branch: string): void;
  onPathChange(path: string): void;
  onCreate(): void;
};

export function CreateWorktreeDialog({
  open,
  branch,
  path,
  isLoading,
  onOpenChange,
  onBranchChange,
  onPathChange,
  onCreate,
}: CreateWorktreeDialogProps) {
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
                Create a new branch and worktree path from the current project.
              </Dialog.Description>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <label className="grid gap-1.5 text-xs font-medium">
              Branch name
              <Input value={branch} onChange={(event) => onBranchChange(event.currentTarget.value)} placeholder="feature/new-work" />
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
