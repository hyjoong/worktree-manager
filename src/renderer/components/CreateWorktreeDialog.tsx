import * as Dialog from '@radix-ui/react-dialog';
import { Check, ChevronDown, ChevronRight, GitBranchPlus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { BranchInfo, CreateWorktreeMode, WorktreeInfo } from '../../shared/ipc';
import { getCreateWorktreeBlocker } from '../lib/create-worktree-conflicts';
import { suggestWorktreePathOptions, type WorktreePathSuggestion } from '../lib/worktree-path';
import { Button } from './ui/button';
import { Input } from './ui/input';

type CreateWorktreeDialogProps = {
  open: boolean;
  mode: CreateWorktreeMode;
  projectPath: string;
  branch: string;
  branches: BranchInfo[];
  isBranchLoading: boolean;
  worktrees: WorktreeInfo[];
  path: string;
  isLoading: boolean;
  onOpenChange(open: boolean): void;
  onModeChange(mode: CreateWorktreeMode): void;
  onBranchChange(branch: string): void;
  onPathChange(path: string): void;
  onPathSuggestionSelect(path: string): void;
  onCreate(): void;
  onCreateAndOpen(): void;
};

export function CreateWorktreeDialog({
  open,
  mode,
  projectPath,
  branch,
  branches,
  isBranchLoading,
  worktrees,
  path,
  isLoading,
  onOpenChange,
  onModeChange,
  onBranchChange,
  onPathChange,
  onPathSuggestionSelect,
  onCreate,
  onCreateAndOpen,
}: CreateWorktreeDialogProps) {
  const [isCustomPathOpen, setIsCustomPathOpen] = useState(false);
  const [branchQuery, setBranchQuery] = useState('');
  const isNewBranchMode = mode === 'new';
  const createBlocker = getCreateWorktreeBlocker({ branch, path, worktrees });
  const isCreateDisabled = isLoading || branch.trim().length === 0 || path.trim().length === 0 || createBlocker !== null;
  const pathSuggestions = useMemo(() => suggestWorktreePathOptions(projectPath, branch), [branch, projectPath]);
  const filteredBranches = useMemo(() => {
    const normalizedQuery = branchQuery.trim().toLowerCase();

    if (normalizedQuery.length === 0) {
      return branches.slice(0, 8);
    }

    return branches.filter((candidate) => candidate.label.toLowerCase().includes(normalizedQuery)).slice(0, 8);
  }, [branchQuery, branches]);

  useEffect(() => {
    if (!open) {
      setIsCustomPathOpen(false);
      setBranchQuery('');
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
              {isNewBranchMode ? (
                <Input
                  value={branch}
                  onChange={(event) => onBranchChange(event.currentTarget.value)}
                  placeholder="feature/new-work"
                />
              ) : (
                <BranchPicker
                  branches={filteredBranches}
                  branch={branch}
                  query={branchQuery}
                  isLoading={isBranchLoading}
                  onQueryChange={setBranchQuery}
                  onBranchSelect={onBranchChange}
                />
              )}
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

            {createBlocker !== null ? (
              <div className="rounded-md border border-amber-400/35 bg-amber-400/10 px-2.5 py-2 text-[11px] font-medium leading-5 text-amber-300">
                {createBlocker}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="button" variant="secondary" disabled={isCreateDisabled} onClick={onCreateAndOpen}>
              Create & Open
            </Button>
            <Button type="button" disabled={isCreateDisabled} onClick={onCreate}>
              Create
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function BranchPicker({
  branches,
  branch,
  query,
  isLoading,
  onQueryChange,
  onBranchSelect,
}: {
  branches: BranchInfo[];
  branch: string;
  query: string;
  isLoading: boolean;
  onQueryChange(query: string): void;
  onBranchSelect(branch: string): void;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
        <Input
          className="pl-7"
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          placeholder="Search local and remote branches"
        />
      </div>
      <div className="max-h-36 overflow-auto rounded-md border border-border bg-card p-1">
        {isLoading ? (
          <div className="px-2 py-3 text-[11px] font-normal text-muted-foreground">Loading branches...</div>
        ) : branches.length === 0 ? (
          <div className="px-2 py-3 text-[11px] font-normal text-muted-foreground">No matching branches</div>
        ) : (
          branches.map((candidate) => (
            <button
              key={`${candidate.isRemote ? 'remote' : 'local'}:${candidate.name}`}
              type="button"
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition ${
                branch === candidate.name ? 'bg-blue-500/12 text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
              onClick={() => onBranchSelect(candidate.name)}
            >
              <span
                className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                  branch === candidate.name ? 'border-blue-400 bg-blue-500 text-white' : 'border-border bg-background text-transparent'
                }`}
              >
                <Check className="size-3" />
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] font-normal">{candidate.label}</span>
              {candidate.isRemote ? (
                <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[9px] font-medium uppercase text-muted-foreground">
                  remote
                </span>
              ) : null}
            </button>
          ))
        )}
      </div>
    </div>
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
