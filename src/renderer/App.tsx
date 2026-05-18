import { DragEvent, useEffect, useMemo, useState } from 'react';
import { CircleAlert, GitBranch, GitBranchPlus, RefreshCw, Search } from 'lucide-react';
import { CommandPalette } from './components/CommandPalette';
import { ConfirmDialog } from './components/ConfirmDialog';
import { CreateWorktreeDialog } from './components/CreateWorktreeDialog';
import { DetailsPanel } from './components/DetailsPanel';
import { EditorSelector } from './components/EditorSelector';
import { LogConsole } from './components/LogConsole';
import { Sidebar } from './components/Sidebar';
import { ThemeToggle } from './components/ThemeToggle';
import { ToastHost } from './components/ToastHost';
import { WorktreeCard } from './components/WorktreeCard';
import { WorktreeSkeleton } from './components/WorktreeSkeleton';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { useAppLog } from './hooks/use-app-log';
import { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts';
import { useWorktreeApi } from './hooks/use-worktree-api';
import { buildCommandItems, updateRecentCommandIds, type CommandItem } from './lib/command-palette';
import { useEditorStore } from './stores/editor-store';
import { createRegisteredProject, upsertRecentProject } from './stores/project-store';
import { useToastStore } from './stores/toast-store';
import type { RegisteredProject } from './types/project';
import type { EditorId, WorktreeInfo } from '../shared/ipc';
import { getWorktreeRemovalBlocker } from '../shared/worktree-removal';

export function App() {
  const [projects, setProjects] = useState<RegisteredProject[]>([]);
  const [activeProject, setActiveProject] = useState<RegisteredProject | null>(null);
  const [worktrees, setWorktrees] = useState<WorktreeInfo[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<WorktreeInfo | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [recentCommandIds, setRecentCommandIds] = useState<string[]>([]);
  const [newBranch, setNewBranch] = useState('');
  const [newWorktreePath, setNewWorktreePath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { logs, appendLog, clearLogs } = useAppLog();
  const [isLoading, setIsLoading] = useState(false);
  const [isDraggingProject, setIsDraggingProject] = useState(false);
  const { editor, setEditor } = useEditorStore();
  const toast = useToastStore((state) => state.push);
  const { readWorktreeApi } = useWorktreeApi({
    setError,
    appendLog,
  });

  const selectedWorktree = useMemo(
    () => worktrees.find((worktree) => worktree.path === selectedPath) ?? worktrees[0] ?? null,
    [selectedPath, worktrees],
  );
  const commandItems = useMemo(
    () =>
      buildCommandItems({
        projects,
        worktrees,
        activeProject,
        selectedWorktree,
        editor,
        recentCommandIds,
      }),
    [activeProject, editor, projects, recentCommandIds, selectedWorktree, worktrees],
  );

  useKeyboardShortcuts([
    {
      key: 'k',
      meta: true,
      handler: () => setIsCommandOpen((open) => !open),
    },
  ]);

  useEffect(() => {
    const api = readWorktreeApi();

    if (api === null) {
      return;
    }

    void (async () => {
      appendLog('$ load registered projects');
      const result = await api.loadProjects();

      if (result.ok) {
        setProjects(result.projects);
        appendLog(`loaded ${result.projects.length} registered projects`);
      } else {
        setError(result.error);
        appendLog(`error: ${result.error}`);
        toast({ tone: 'error', title: 'Failed to load projects', description: result.error });
      }
    })();
  }, []);

  function persistProjects(nextProjects: RegisteredProject[]) {
    const api = readWorktreeApi();

    if (api === null) {
      return;
    }

    void api.saveProjects({ projects: nextProjects }).then((result) => {
      if (!result.ok) {
        setError(result.error);
        appendLog(`error: ${result.error}`);
        toast({ tone: 'error', title: 'Failed to save projects', description: result.error });
      }
    });
  }

  async function loadWorktrees(project: RegisteredProject, options: { registerProject?: boolean } = {}) {
    setIsLoading(true);
    setError(null);
    appendLog(`$ git -C ${project.path} worktree list --porcelain`);

    const api = readWorktreeApi();

    if (api === null) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await api.listWorktrees({ projectPath: project.path });

      if (result.ok) {
        setActiveProject(project);
        setWorktrees(result.worktrees);
        setSelectedPath(result.worktrees[0]?.path ?? null);
        if (options.registerProject === true) {
          setProjects((current) => {
            const nextProjects = upsertRecentProject(current, project);
            persistProjects(nextProjects);
            return nextProjects;
          });
        }
        appendLog(`listed ${result.worktrees.length} worktrees`);
      } else {
        setWorktrees([]);
        setSelectedPath(null);
        setError(result.error);
        appendLog(`error: ${result.error}`);
        toast({ tone: 'error', title: 'Failed to list worktrees', description: result.error });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list worktrees';
      setWorktrees([]);
      setSelectedPath(null);
      setError(message);
      appendLog(`error: ${message}`);
      toast({ tone: 'error', title: 'Failed to list worktrees', description: message });
    } finally {
      setIsLoading(false);
    }
  }

  async function registerProjectPath(path: string) {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    appendLog(`$ git -C ${path} rev-parse --show-toplevel`);
    const api = readWorktreeApi();

    if (api === null) {
      setIsLoading(false);
      return;
    }

    try {
      const validation = await api.validateProject({ projectPath: path });

      if (!validation.ok) {
        setError(validation.error);
        appendLog(`error: ${validation.error}`);
        toast({ tone: 'error', title: 'Invalid Git project', description: validation.error });
        return;
      }

      const project = createRegisteredProject(validation.rootPath);
      setIsLoading(false);
      await loadWorktrees(project, { registerProject: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to validate project';
      setError(message);
      appendLog(`error: ${message}`);
      toast({ tone: 'error', title: 'Failed to validate project', description: message });
    } finally {
      setIsLoading(false);
    }
  }

  function extractDroppedPath(event: DragEvent<HTMLElement>) {
    const file = event.dataTransfer.files.item(0);

    if (file === null) {
      return null;
    }

    const api = readWorktreeApi();
    return api === null ? null : api.getDroppedFilePath(file);
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDraggingProject(true);
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDraggingProject(false);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDraggingProject(false);

    const path = extractDroppedPath(event);

    if (path === null) {
      setError('Drop a local project folder from Finder.');
      toast({ tone: 'error', title: 'Could not read dropped folder', description: 'Drop a folder from Finder into the app.' });
      return;
    }

    void registerProjectPath(path);
  }

  async function browseProjectDirectory() {
    appendLog('$ open native project folder picker');
    const api = readWorktreeApi();

    if (api === null) {
      return;
    }

    try {
      const result = await api.selectProjectDirectory();

      if (!result.ok) {
        setError(result.error);
        appendLog(`error: ${result.error}`);
        toast({ tone: 'error', title: 'Failed to open folder picker', description: result.error });
        return;
      }

      if (result.path !== null) {
        await registerProjectPath(result.path);
      } else {
        appendLog('folder picker canceled');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open folder picker';
      setError(message);
      appendLog(`error: ${message}`);
      toast({ tone: 'error', title: 'Failed to open folder picker', description: message });
    }
  }

  async function openInEditor(worktree: WorktreeInfo, targetEditor: EditorId = editor) {
    appendLog(`$ open -a ${targetEditor === 'cursor' ? 'Cursor' : 'Visual Studio Code'} ${worktree.path}`);
    const api = readWorktreeApi();

    if (api === null) {
      return;
    }

    const result = await api.openWorktree({ path: worktree.path, editor: targetEditor });

    if (result.ok) {
      toast({ tone: 'success', title: `Opened in ${targetEditor === 'cursor' ? 'Cursor' : 'VS Code'}`, description: worktree.path });
    } else {
      appendLog(`error: ${result.error}`);
      toast({ tone: 'error', title: `Failed to open ${targetEditor === 'cursor' ? 'Cursor' : 'VS Code'}`, description: result.error });
    }
  }

  async function copyWorktreePath(worktree: WorktreeInfo) {
    appendLog(`$ copy path ${worktree.path}`);
    const api = readWorktreeApi();

    if (api === null) {
      return;
    }

    const result = await api.copyText({ text: worktree.path });

    if (result.ok) {
      toast({ tone: 'success', title: 'Copied path', description: worktree.path });
    } else {
      appendLog(`error: ${result.error}`);
      toast({ tone: 'error', title: 'Failed to copy path', description: result.error });
    }
  }

  async function removePendingWorktree() {
    if (pendingRemove === null || activeProject === null) {
      return;
    }

    const target = pendingRemove;
    const blocker = getWorktreeRemovalBlocker(target);

    if (blocker !== null) {
      setPendingRemove(null);
      toast({ tone: 'error', title: 'Cannot remove worktree', description: blocker });
      return;
    }

    setPendingRemove(null);
    appendLog(`$ git -C ${activeProject.path} worktree remove ${target.path}`);
    const api = readWorktreeApi();

    if (api === null) {
      return;
    }

    const result = await api.removeWorktree({ projectPath: activeProject.path, path: target.path });

    if (result.ok) {
      toast({ tone: 'success', title: 'Worktree removed', description: target.path });
      await loadWorktrees(activeProject);
    } else {
      appendLog(`error: ${result.error}`);
      toast({ tone: 'error', title: 'Failed to remove worktree', description: result.error });
    }
  }

  async function createNewWorktree() {
    if (activeProject === null) {
      return;
    }

    const branch = newBranch.trim();
    const path = newWorktreePath.trim();

    if (branch.length === 0 || path.length === 0) {
      setError('Branch name and worktree path are required.');
      return;
    }

    appendLog(`$ git -C ${activeProject.path} worktree add -b ${branch} ${path}`);
    const api = readWorktreeApi();

    if (api === null) {
      return;
    }

    setIsLoading(true);
    const result = await api.createWorktree({ projectPath: activeProject.path, branch, path });
    setIsLoading(false);

    if (result.ok) {
      setIsCreateOpen(false);
      setNewBranch('');
      setNewWorktreePath('');
      toast({ tone: 'success', title: 'Worktree created', description: branch });
      await loadWorktrees(activeProject);
    } else {
      setError(result.error);
      appendLog(`error: ${result.error}`);
      toast({ tone: 'error', title: 'Failed to create worktree', description: result.error });
    }
  }

  function executeCommand(item: CommandItem) {
    if (item.disabled === true) {
      return;
    }

    setRecentCommandIds((current) => updateRecentCommandIds(current, item.id));
    setIsCommandOpen(false);

    if (item.action === 'refresh-worktrees') {
      if (activeProject !== null) {
        void loadWorktrees(activeProject);
      }
      return;
    }

    if (item.action === 'create-worktree') {
      setIsCreateOpen(true);
      return;
    }

    if (item.action === 'select-project') {
      const project = projects.find((candidate) => candidate.path === item.targetPath);

      if (project !== undefined) {
        void loadWorktrees(project);
      }
      return;
    }

    if (item.action === 'open-worktree') {
      const worktree = worktrees.find((candidate) => candidate.path === item.targetPath);

      if (worktree !== undefined) {
        void openInEditor(worktree, 'cursor');
      }
      return;
    }

    if (item.action === 'remove-worktree') {
      const worktree = worktrees.find((candidate) => candidate.path === item.targetPath);

      if (worktree !== undefined) {
        const blocker = getWorktreeRemovalBlocker(worktree);

        if (blocker !== null) {
          toast({ tone: 'error', title: 'Cannot remove worktree', description: blocker });
          return;
        }

        setPendingRemove(worktree);
      }
    }
  }

  return (
    <main className="grid h-screen min-h-[640px] grid-cols-[260px_minmax(480px,1fr)_320px] grid-rows-[1fr_137px] overflow-hidden bg-background text-foreground">
      <Sidebar
        projects={projects}
        activeProject={activeProject}
        isLoading={isLoading}
        onBrowse={() => void browseProjectDirectory()}
        onSelect={(project) => void loadWorktrees(project)}
        onRefresh={() => {
          if (activeProject !== null) {
            void loadWorktrees(activeProject);
          }
        }}
        isDraggingProject={isDraggingProject}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />

      <section className="min-h-0 bg-workspace" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        <header className="flex h-10 items-center justify-between border-b border-border/80 bg-background/95 px-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-card">
              <GitBranch className="size-3.5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5">
                <h1 className="truncate text-[13px] font-semibold leading-4">{activeProject?.name ?? 'No project selected'}</h1>
                <span className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] leading-3 text-muted-foreground">
                  {worktrees.length}
                </span>
              </div>
              <div className="truncate font-mono text-[10px] leading-3 text-muted-foreground/75">
                {activeProject?.path ?? 'Register a local Git repository from the sidebar.'}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <div className="flex items-center rounded-md border border-border bg-card p-0.5">
              <Button
                type="button"
                variant="ghost"
                className="h-7 border-transparent px-2 text-[11px] hover:bg-accent"
                onClick={() => setIsCommandOpen(true)}
                title="Open command palette"
              >
                <Search className="size-3.5" />
                <span className="font-mono text-[10px] text-muted-foreground">⌘K</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 border-transparent hover:bg-accent"
                disabled={activeProject === null || isLoading}
                onClick={() => {
                  if (activeProject !== null) {
                    void loadWorktrees(activeProject);
                  }
                }}
                title="Refresh worktrees"
              >
                <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-7 border-transparent px-2 text-[11px] hover:bg-accent"
                disabled={activeProject === null || isLoading}
                onClick={() => setIsCreateOpen(true)}
              >
                <GitBranchPlus className="size-3.5" />
                New
              </Button>
            </div>
            <EditorSelector editor={editor} onChange={setEditor} />
            <ThemeToggle />
          </div>
        </header>

        <div className="h-[calc(100%-2.5rem)] overflow-auto p-1.5">
          {error !== null ? (
            <Card className="mb-2 border-destructive/35 bg-destructive/10">
              <CardContent className="flex items-start gap-2 p-3 text-xs text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </CardContent>
            </Card>
          ) : null}

          {isLoading ? <WorktreeSkeleton /> : null}

          {!isLoading && activeProject === null ? (
            <EmptyState
              title="Add a project folder"
              description="Click Add Project in the sidebar or drag a Git repository folder here."
              isDragging={isDraggingProject}
              onBrowse={() => void browseProjectDirectory()}
            />
          ) : null}

          {!isLoading && activeProject !== null && worktrees.length === 0 ? (
            <EmptyState title="No worktrees" description="Git did not report any worktrees for this project." />
          ) : null}

          {!isLoading && worktrees.length > 0 ? (
            <div className="space-y-1.5">
              {worktrees.map((worktree) => (
                <WorktreeCard
                  key={`${worktree.path}:${worktree.head ?? 'no-head'}`}
                  worktree={worktree}
                  selected={selectedWorktree?.path === worktree.path}
                  editor={editor}
                  onSelect={(nextWorktree) => setSelectedPath(nextWorktree.path)}
                  onOpen={(nextWorktree) => void openInEditor(nextWorktree)}
                  onRemove={setPendingRemove}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <DetailsPanel
        worktree={selectedWorktree}
        onOpen={(worktree) => void openInEditor(worktree)}
        onCopyPath={(worktree) => void copyWorktreePath(worktree)}
        editor={editor}
      />
      <div className="col-span-3">
        <LogConsole logs={logs} onClear={clearLogs} />
      </div>

      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRemove(null);
          }
        }}
        title="Remove worktree?"
        description={formatRemoveWorktreeDescription(pendingRemove)}
        confirmLabel="Remove"
        onConfirm={() => void removePendingWorktree()}
      />
      <CreateWorktreeDialog
        open={isCreateOpen}
        branch={newBranch}
        path={newWorktreePath}
        isLoading={isLoading}
        onOpenChange={setIsCreateOpen}
        onBranchChange={setNewBranch}
        onPathChange={setNewWorktreePath}
        onCreate={() => void createNewWorktree()}
      />
      <CommandPalette open={isCommandOpen} items={commandItems} onOpenChange={setIsCommandOpen} onExecute={executeCommand} />
      <ToastHost />
    </main>
  );
}

function formatRemoveWorktreeDescription(worktree: WorktreeInfo | null) {
  if (worktree === null) {
    return 'This will run git worktree remove for the selected worktree.';
  }

  return [
    `Branch: ${worktree.branch ?? (worktree.isDetached ? 'detached HEAD' : '-')}`,
    `Status: ${worktree.status}`,
    `Path: ${worktree.path}`,
    '',
    'This removes the worktree folder from disk. Only clean non-main worktrees can be removed.',
  ].join('\n');
}

function EmptyState({
  title,
  description,
  isDragging = false,
  onBrowse,
}: {
  title: string;
  description: string;
  isDragging?: boolean;
  onBrowse?: () => void;
}) {
  return (
    <Card className={`flex min-h-[320px] items-center justify-center border-dashed ${isDragging ? 'border-blue-500/60 bg-blue-500/10' : ''}`}>
      <CardContent className="text-center">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{description}</div>
        {onBrowse !== undefined ? (
          <Button type="button" className="mt-4" onClick={onBrowse}>
            Add Project
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
