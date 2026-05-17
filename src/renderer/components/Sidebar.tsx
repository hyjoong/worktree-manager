import type { DragEvent } from 'react';
import { FolderGit2, FolderOpen, Plus, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import type { RegisteredProject } from '../types/project';

type SidebarProps = {
  projectPath: string;
  projects: RegisteredProject[];
  activeProject: RegisteredProject | null;
  isLoading: boolean;
  onProjectPathChange(path: string): void;
  onRegister(): void;
  onBrowse(): void;
  onSelect(project: RegisteredProject): void;
  onRefresh(): void;
  isDraggingProject: boolean;
  onDragOver(event: DragEvent<HTMLElement>): void;
  onDragLeave(event: DragEvent<HTMLElement>): void;
  onDrop(event: DragEvent<HTMLElement>): void;
};

export function Sidebar({
  projectPath,
  projects,
  activeProject,
  isLoading,
  onProjectPathChange,
  onRegister,
  onBrowse,
  onSelect,
  onRefresh,
  isDraggingProject,
  onDragOver,
  onDragLeave,
  onDrop,
}: SidebarProps) {
  return (
    <aside
      className="flex min-h-0 flex-col border-r border-border bg-sidebar px-2 py-2"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="mb-2 flex items-center gap-2 px-1">
        <div className="flex size-7 items-center justify-center rounded-md border border-border bg-card">
          <FolderGit2 className="size-4 text-blue-400" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold">Worktree Manager</div>
          <div className="text-[11px] text-muted-foreground">Local Git projects</div>
        </div>
      </div>

      <Card className={`mb-2 p-2 ${isDraggingProject ? 'border-blue-500/60 bg-blue-500/10' : ''}`}>
        <Button type="button" className="mb-2 w-full justify-start" onClick={onBrowse} disabled={isLoading}>
          <FolderOpen className="size-4" />
          Add Project
        </Button>
        <div className="mb-2 rounded-md border border-dashed border-border px-2 py-3 text-center text-[11px] text-muted-foreground">
          {isDraggingProject ? 'Drop to register Git project' : 'Drop a project folder here'}
        </div>
        <div className="mb-2 text-[11px] font-medium text-muted-foreground">Manual path</div>
        <div className="flex gap-1.5">
          <Input
            value={projectPath}
            onChange={(event) => onProjectPathChange(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onRegister();
              }
            }}
            placeholder="/Users/me/repo"
            spellCheck={false}
          />
          <Button type="button" size="icon" onClick={onRegister} disabled={isLoading || projectPath.trim().length === 0}>
            <Plus className="size-4" />
          </Button>
        </div>
      </Card>

      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold uppercase text-muted-foreground">Projects</span>
        <Button type="button" variant="ghost" size="icon" onClick={onRefresh} disabled={activeProject === null || isLoading}>
          <RefreshCw className="size-3.5" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-auto">
        {projects.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-2 py-4 text-center text-xs text-muted-foreground">
            No projects registered
          </div>
        ) : (
          projects.map((project) => (
            <button
              key={project.path}
              type="button"
              onClick={() => onSelect(project)}
              className={`w-full rounded-md border px-2 py-2 text-left text-xs transition-colors ${
                activeProject?.path === project.path
                  ? 'border-blue-500/40 bg-blue-500/10 text-foreground'
                  : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <span className="block truncate font-medium">{project.name}</span>
              <span className="mt-0.5 block truncate font-mono text-[10px] opacity-70">{project.path}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
