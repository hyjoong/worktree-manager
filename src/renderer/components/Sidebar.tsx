import type { DragEvent } from 'react';
import { useMemo, useState } from 'react';
import { FolderGit2, FolderOpen, RefreshCw, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import type { RegisteredProject } from '../types/project';

type SidebarProps = {
  projects: RegisteredProject[];
  activeProject: RegisteredProject | null;
  isLoading: boolean;
  onBrowse(): void;
  onSelect(project: RegisteredProject): void;
  onRefresh(): void;
  isDraggingProject: boolean;
  onDragOver(event: DragEvent<HTMLElement>): void;
  onDragLeave(event: DragEvent<HTMLElement>): void;
  onDrop(event: DragEvent<HTMLElement>): void;
};

export function Sidebar({
  projects,
  activeProject,
  isLoading,
  onBrowse,
  onSelect,
  onRefresh,
  isDraggingProject,
  onDragOver,
  onDragLeave,
  onDrop,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredProjects = useMemo(() => {
    if (normalizedQuery.length === 0) {
      return projects;
    }

    return projects.filter((project) => {
      return project.name.toLowerCase().includes(normalizedQuery) || project.path.toLowerCase().includes(normalizedQuery);
    });
  }, [normalizedQuery, projects]);

  return (
    <aside
      className="flex min-h-0 flex-col border-r border-border bg-sidebar px-2 py-2"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="mb-2 flex items-center gap-2 px-1">
        <div className="flex size-7 items-center justify-center rounded-md border border-border bg-card shadow-none">
          <FolderGit2 className="size-3.5 text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold">Worktree Manager</div>
          <div className="text-[11px] text-muted-foreground">Local Git projects</div>
        </div>
        <span className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {projects.length}
        </span>
      </div>

      <div className={`mb-2 rounded-lg border border-border bg-card p-1.5 ${isDraggingProject ? 'border-blue-500/60 bg-blue-500/10' : ''}`}>
        <div className="flex items-center gap-1.5">
          <Button type="button" className="h-7 flex-1 justify-start" onClick={onBrowse} disabled={isLoading}>
            <FolderOpen className="size-3.5" />
            Add Project
          </Button>
        </div>
        <div className="mt-1.5 rounded border border-dashed border-border/80 px-2 py-1 text-center text-[10.5px] text-muted-foreground/80">
          {isDraggingProject ? 'Drop to register' : 'Drop folder here'}
        </div>
      </div>

      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
        <Input
          className="h-7 pl-7"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          placeholder="Search projects"
        />
      </div>

      <div className="mb-1 flex items-center justify-between px-1">
        <SectionHeader label="Recent" count={filteredProjects.length} />
        <Button type="button" variant="ghost" size="icon" onClick={onRefresh} disabled={activeProject === null || isLoading}>
          <RefreshCw className="size-3.5" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-auto">
        {projects.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-2 py-4 text-center text-xs text-muted-foreground">
            No projects registered
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-2 py-4 text-center text-xs text-muted-foreground">
            No matching projects
          </div>
        ) : (
          filteredProjects.map((project) => (
            <ProjectRow
              key={project.path}
              project={project}
              active={activeProject?.path === project.path}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      <span>{label}</span>
      <span className="font-mono text-[10px] text-muted-foreground/70">{count}</span>
    </div>
  );
}

function ProjectRow({
  project,
  active,
  onSelect,
}: {
  project: RegisteredProject;
  active: boolean;
  onSelect(project: RegisteredProject): void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(project)}
      className={`group flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-[background-color,border-color,color] duration-150 ${
        active
          ? 'border-blue-500/45 bg-blue-500/10 text-foreground shadow-[inset_2px_0_0_rgb(96_165_250)]'
          : 'border-transparent text-muted-foreground hover:border-border hover:bg-accent/45 hover:text-foreground'
      }`}
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded border border-border bg-background text-muted-foreground group-hover:text-foreground">
        <FolderGit2 className="size-3" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-medium leading-4">{project.name}</span>
        <span className="block truncate font-mono text-[10px] leading-3 opacity-65">{project.path}</span>
      </span>
    </button>
  );
}
