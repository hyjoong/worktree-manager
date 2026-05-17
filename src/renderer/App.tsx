import { DragEvent, useMemo, useState } from 'react';
import { CircleAlert, GitBranch, RefreshCw } from 'lucide-react';
import { ConfirmDialog } from './components/ConfirmDialog';
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
import { useEditorStore } from './stores/editor-store';
import { createRegisteredProject, loadStoredProjects, saveStoredProjects, upsertRecentProject } from './stores/project-store';
import { useToastStore } from './stores/toast-store';
import type { RegisteredProject } from './types/project';
import type { EditorId, WorktreeInfo } from '../shared/ipc';

export function App() {
  const [projectPath, setProjectPath] = useState('');
  const [projects, setProjects] = useState<RegisteredProject[]>(() => loadStoredProjects());
  const [activeProject, setActiveProject] = useState<RegisteredProject | null>(null);
  const [worktrees, setWorktrees] = useState<WorktreeInfo[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<WorktreeInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDraggingProject, setIsDraggingProject] = useState(false);
  const { editor, setEditor } = useEditorStore();
  const toast = useToastStore((state) => state.push);

  const selectedWorktree = useMemo(
    () => worktrees.find((worktree) => worktree.path === selectedPath) ?? worktrees[0] ?? null,
    [selectedPath, worktrees],
  );

  function appendLog(message: string) {
    const time = new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
    setLogs((current) => [`[${time}] ${message}`, ...current].slice(0, 80));
  }

  async function loadWorktrees(project: RegisteredProject, options: { registerProject?: boolean } = {}) {
    setIsLoading(true);
    setError(null);
    appendLog(`$ git -C ${project.path} worktree list --porcelain`);

    const result = await window.worktreeApi.listWorktrees({ projectPath: project.path });

    if (result.ok) {
      setActiveProject(project);
      setWorktrees(result.worktrees);
      setSelectedPath(result.worktrees[0]?.path ?? null);
      if (options.registerProject === true) {
        setProjects((current) => {
          const nextProjects = upsertRecentProject(current, project);
          saveStoredProjects(nextProjects);
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

    setIsLoading(false);
  }

  function registerProject() {
    const path = projectPath.trim();

    if (path.length === 0) {
      setError('Project path is required');
      return;
    }

    void registerProjectPath(path);
  }

  async function registerProjectPath(path: string) {
    if (isLoading) {
      return;
    }

    appendLog(`$ git -C ${path} rev-parse --show-toplevel`);
    const validation = await window.worktreeApi.validateProject({ projectPath: path });

    if (!validation.ok) {
      setError(validation.error);
      appendLog(`error: ${validation.error}`);
      toast({ tone: 'error', title: 'Invalid Git project', description: validation.error });
      return;
    }

    const project = createRegisteredProject(validation.rootPath);
    await loadWorktrees(project, { registerProject: true });
    setProjectPath('');
  }

  function extractDroppedPath(event: DragEvent<HTMLElement>) {
    const file = event.dataTransfer.files.item(0);

    if (file === null) {
      return null;
    }

    return window.worktreeApi.getDroppedFilePath(file);
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

    setProjectPath(path);
    void registerProjectPath(path);
  }

  async function browseProjectDirectory() {
    const result = await window.worktreeApi.selectProjectDirectory();

    if (!result.ok) {
      setError(result.error);
      toast({ tone: 'error', title: 'Failed to open folder picker', description: result.error });
      return;
    }

    if (result.path !== null) {
      setProjectPath(result.path);
      await registerProjectPath(result.path);
    }
  }

  async function openInEditor(worktree: WorktreeInfo, targetEditor: EditorId = editor) {
    appendLog(`$ open -a ${targetEditor === 'cursor' ? 'Cursor' : 'Visual Studio Code'} ${worktree.path}`);
    const result = await window.worktreeApi.openWorktree({ path: worktree.path, editor: targetEditor });

    if (result.ok) {
      toast({ tone: 'success', title: `Opened in ${targetEditor === 'cursor' ? 'Cursor' : 'VS Code'}`, description: worktree.path });
    } else {
      appendLog(`error: ${result.error}`);
      toast({ tone: 'error', title: `Failed to open ${targetEditor === 'cursor' ? 'Cursor' : 'VS Code'}`, description: result.error });
    }
  }

  async function removePendingWorktree() {
    if (pendingRemove === null || activeProject === null) {
      return;
    }

    const target = pendingRemove;
    setPendingRemove(null);
    appendLog(`$ git -C ${activeProject.path} worktree remove ${target.path}`);
    const result = await window.worktreeApi.removeWorktree({ projectPath: activeProject.path, path: target.path });

    if (result.ok) {
      toast({ tone: 'success', title: 'Worktree removed', description: target.path });
      await loadWorktrees(activeProject);
    } else {
      appendLog(`error: ${result.error}`);
      toast({ tone: 'error', title: 'Failed to remove worktree', description: result.error });
    }
  }

  return (
    <main className="grid h-screen min-h-[640px] grid-cols-[260px_minmax(480px,1fr)_320px] grid-rows-[1fr_137px] overflow-hidden bg-background text-foreground">
      <Sidebar
        projectPath={projectPath}
        projects={projects}
        activeProject={activeProject}
        isLoading={isLoading}
        onProjectPathChange={setProjectPath}
        onRegister={registerProject}
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
        <header className="flex h-12 items-center justify-between border-b border-border px-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <GitBranch className="size-4 text-blue-400" />
              <h1 className="truncate text-sm font-semibold">{activeProject?.name ?? 'No project selected'}</h1>
              {worktrees.length > 0 ? <span className="text-xs text-muted-foreground">{worktrees.length} worktrees</span> : null}
            </div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
              {activeProject?.path ?? 'Register a local Git repository from the sidebar.'}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={activeProject === null || isLoading}
              onClick={() => {
                if (activeProject !== null) {
                  void loadWorktrees(activeProject);
                }
              }}
              title="Refresh worktrees"
            >
              <RefreshCw className="size-4" />
            </Button>
            <EditorSelector editor={editor} onChange={setEditor} />
            <ThemeToggle />
          </div>
        </header>

        <div className="h-[calc(100%-3rem)] overflow-auto p-2">
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
            <div className="space-y-2">
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

      <DetailsPanel worktree={selectedWorktree} onOpen={(worktree) => void openInEditor(worktree)} editor={editor} />
      <div className="col-span-3">
        <LogConsole logs={logs} />
      </div>

      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRemove(null);
          }
        }}
        title="Remove worktree?"
        description={`This will run git worktree remove for ${pendingRemove?.path ?? 'the selected worktree'}. Uncommitted changes can make Git reject the operation.`}
        confirmLabel="Remove"
        onConfirm={() => void removePendingWorktree()}
      />
      <ToastHost />
    </main>
  );
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
