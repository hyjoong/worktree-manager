import * as Dialog from '@radix-ui/react-dialog';
import { KeyboardEvent, useEffect, useMemo, useState } from 'react';
import {
  Command,
  FolderGit2,
  GitBranch,
  GitBranchPlus,
  MousePointer2,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { filterCommandItems, type CommandItem } from '../lib/command-palette';
import { cn } from '../lib/utils';
import { Input } from './ui/input';

type CommandPaletteProps = {
  open: boolean;
  items: CommandItem[];
  onOpenChange(open: boolean): void;
  onExecute(item: CommandItem): void;
};

export function CommandPalette({ open, items, onOpenChange, onExecute }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const filteredItems = useMemo(() => filterCommandItems(items, query), [items, query]);
  const visibleRecentItems = useMemo(() => filteredItems.filter((item) => item.isRecent === true).slice(0, 4), [filteredItems]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (selectedIndex > filteredItems.length - 1) {
      setSelectedIndex(Math.max(filteredItems.length - 1, 0));
    }
  }, [filteredItems.length, selectedIndex]);

  function executeItem(item: CommandItem) {
    if (item.disabled === true) {
      return;
    }

    onExecute(item);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((current) => Math.min(current + 1, filteredItems.length - 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const selectedItem = filteredItems[selectedIndex];

      if (selectedItem !== undefined) {
        executeItem(selectedItem);
      }
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/65 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-[15vh] z-50 w-[min(640px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-panel"
          onKeyDown={handleKeyDown}
        >
          <Dialog.Title className="sr-only">Command Palette</Dialog.Title>
          <div className="flex h-11 items-center gap-2 border-b border-border/80 px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              className="h-10 border-transparent bg-transparent px-0 text-[13px] focus:border-transparent focus:ring-0"
              placeholder="Search projects, worktrees, and actions..."
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
            <div className="flex items-center gap-1 rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              <Command className="size-3" /> K
            </div>
          </div>

          {query.trim().length === 0 && visibleRecentItems.length > 0 ? (
            <div className="border-b border-border/70 px-2 py-1.5">
              <div className="mb-1 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Recent</div>
              <div className="flex flex-wrap gap-1">
                {visibleRecentItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="max-w-[190px] truncate rounded-md border border-border bg-card px-2 py-1 text-left text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-45"
                    disabled={item.disabled === true}
                    onClick={() => executeItem(item)}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="max-h-[420px] overflow-y-auto p-1.5">
            {filteredItems.length === 0 ? (
              <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">No commands found</div>
            ) : (
              <div className="space-y-1">
                {filteredItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={item.disabled === true}
                    className={cn(
                      'group flex w-full items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                      selectedIndex === index ? 'border-border bg-accent text-accent-foreground' : 'hover:bg-accent/70',
                    )}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => executeItem(item)}
                  >
                    <div
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground',
                        item.danger === true ? 'text-destructive' : '',
                        item.kind === 'project' ? 'text-blue-400' : '',
                      )}
                    >
                      <CommandIcon item={item} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={cn('truncate text-xs font-medium', item.danger === true ? 'text-destructive' : '')}>
                          {item.title}
                        </span>
                        {item.isRecent === true ? (
                          <span className="rounded border border-border bg-card px-1 py-0.5 text-[9px] uppercase leading-none text-muted-foreground">
                            recent
                          </span>
                        ) : null}
                      </div>
                      <div className="truncate font-mono text-[10px] leading-4 text-muted-foreground">{item.subtitle}</div>
                    </div>
                    <span className="hidden rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground group-hover:inline">
                      Enter
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CommandIcon({ item }: { item: CommandItem }) {
  if (item.action === 'refresh-worktrees') {
    return <RefreshCw className="size-3.5" />;
  }

  if (item.action === 'create-worktree') {
    return <GitBranchPlus className="size-3.5" />;
  }

  if (item.action === 'remove-worktree') {
    return <Trash2 className="size-3.5" />;
  }

  if (item.kind === 'project') {
    return <FolderGit2 className="size-3.5" />;
  }

  if (item.action === 'open-worktree') {
    return <MousePointer2 className="size-3.5" />;
  }

  return <GitBranch className="size-3.5" />;
}
