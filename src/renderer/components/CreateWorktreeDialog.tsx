import * as Dialog from '@radix-ui/react-dialog';
import { Check, ChevronDown, ChevronRight, GitBranchPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { CreateWorktreeMode } from '../../shared/ipc';
import { suggestWorktreePathOptions, type WorktreePathSuggestion } from '../lib/worktree-path';
import { Button } from './ui/button';
import { Input } from './ui/input';

type CreateWorktreeDialogProps = {
  open: boolean;
  mode: CreateWorktreeMode;
  projectPath: string;
  branch: string;
  path: string;
  isLoading: boolean;
  onOpenChange(open: boolean): void;
  onModeChange(mode: CreateWorktreeMode): void;
  onBranchChange(branch: string): void;
  onPathChange(path: string): void;
  onPathSuggestionSelect(path: string): void;
  onCreate(): void;
};

export function CreateWorktreeDialog({
  open,
  mode,
  projectPath,
  branch,
  path,
  isLoading,
  onOpenChange,
  onModeChange,
  onBranchChange,
  onPathChange,
  onPathSuggestionSelect,
  onCreate,
}: CreateWorktreeDialogProps) {
  const [isCustomPathOpen, setIsCustomPathOpen] = useState(false);
  const isNewBranchMode = mode === 'new';
  const pathSuggestions = useMemo(() => suggestWorktreePathOptions(projectPath, branch), [branch, projectPath]);

  useEffect(() => {
    if (!open) {
      setIsCustomPathOpen(false);
    }
  }, [open]);

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

            <div className="grid gap-1.5 text-xs font-medium">
              Worktree path
              {pathSuggestions.length > 0 ? (
                <div className="grid gap-1.5">
                  {pathSuggestions.map((suggestion) => (
                    <PathSuggestionButton
                      key={suggestion.id}
                      suggestion={suggestion}
                      selected={path === suggestion.path}
                      onSelect={() => onPathSuggestionSelect(suggestion.path)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border px-2.5 py-2 text-[11px] font-normal leading-5 text-muted-foreground">
                  Type a branch name to preview path suggestions.
                </div>
              )}

              <button
                type="button"
                className="mt-1 flex h-7 items-center gap-1 text-left text-[11px] font-medium text-muted-foreground transition hover:text-foreground"
                onClick={() => setIsCustomPathOpen((current) => !current)}
              >
                {isCustomPathOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                Custom path
              </button>

              {isCustomPathOpen ? (
                <Input
                  value={path}
                  onChange={(event) => onPathChange(event.currentTarget.value)}
                  placeholder="/Users/me/repo-feature"
                />
              ) : null}
            </div>
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

function PathSuggestionButton({
  suggestion,
  selected,
  onSelect,
}: {
  suggestion: WorktreePathSuggestion;
  selected: boolean;
  onSelect(): void;
}) {
  return (
    <button
      type="button"
      className={`flex min-h-12 items-start gap-2 rounded-md border px-2.5 py-2 text-left transition ${
        selected ? 'border-blue-400/60 bg-blue-500/10' : 'border-border bg-card hover:border-zinc-500/60 hover:bg-accent/45'
      }`}
      onClick={onSelect}
    >
      <span
        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border ${
          selected ? 'border-blue-400 bg-blue-500 text-white' : 'border-border bg-background text-transparent'
        }`}
      >
        <Check className="size-3" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold leading-4">{suggestion.label}</span>
        <span className="block truncate font-mono text-[10.5px] font-normal leading-4 text-muted-foreground">{suggestion.path}</span>
      </span>
    </button>
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
