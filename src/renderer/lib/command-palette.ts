import type { RegisteredProject } from '../types/project';
import type { EditorId, WorktreeInfo } from '../../shared/ipc';

export type CommandKind = 'project' | 'worktree' | 'action';

export type CommandAction =
  | 'select-project'
  | 'open-worktree'
  | 'remove-worktree'
  | 'refresh-worktrees'
  | 'create-worktree';

export type CommandItem = {
  id: string;
  kind: CommandKind;
  action: CommandAction;
  title: string;
  subtitle: string;
  keywords: string[];
  targetPath?: string;
  disabled?: boolean;
  danger?: boolean;
  isRecent?: boolean;
};

type BuildCommandItemsInput = {
  projects: RegisteredProject[];
  worktrees: WorktreeInfo[];
  activeProject: RegisteredProject | null;
  selectedWorktree: WorktreeInfo | null;
  editor: EditorId;
  recentCommandIds: string[];
};

const RECENT_COMMAND_LIMIT = 6;

export function buildCommandItems({
  projects,
  worktrees,
  activeProject,
  selectedWorktree,
  recentCommandIds,
}: BuildCommandItemsInput): CommandItem[] {
  const recentIds = new Set(recentCommandIds);

  const items: CommandItem[] = [
    {
      id: 'action.refresh',
      kind: 'action',
      action: 'refresh-worktrees',
      title: 'Refresh Worktrees',
      subtitle: activeProject === null ? 'Select a project first' : activeProject.name,
      keywords: ['reload', 'sync', 'git', 'worktree'],
      disabled: activeProject === null,
    },
    {
      id: 'action.create-worktree',
      kind: 'action',
      action: 'create-worktree',
      title: 'Create Worktree',
      subtitle: activeProject === null ? 'Select a project first' : `From ${activeProject.name}`,
      keywords: ['new', 'branch', 'git', 'add'],
      disabled: activeProject === null,
    },
  ];

  if (selectedWorktree !== null) {
    items.push(
      {
        id: 'action.open-selected:cursor',
        kind: 'action',
        action: 'open-worktree',
        title: 'Open Selected in Cursor',
        subtitle: selectedWorktree.path,
        keywords: ['editor', 'cursor', 'vscode', selectedWorktree.branch ?? 'detached'],
        targetPath: selectedWorktree.path,
      },
      {
        id: 'action.remove-selected',
        kind: 'action',
        action: 'remove-worktree',
        title: 'Remove Selected Worktree',
        subtitle: selectedWorktree.path,
        keywords: ['delete', 'remove', 'git'],
        targetPath: selectedWorktree.path,
        disabled: selectedWorktree.isMain,
        danger: true,
      },
    );
  }

  for (const project of projects) {
    items.push({
      id: `project:${project.path}`,
      kind: 'project',
      action: 'select-project',
      title: project.name,
      subtitle: project.path,
      keywords: ['project', 'repository', 'repo', project.path],
      targetPath: project.path,
    });
  }

  for (const worktree of worktrees) {
    const branch = worktree.branch ?? (worktree.isDetached ? 'detached' : 'no branch');
    items.push(
      {
        id: `worktree.open:${worktree.path}`,
        kind: 'worktree',
        action: 'open-worktree',
        title: branch,
        subtitle: worktree.path,
        keywords: ['open', 'cursor', 'worktree', worktree.status, worktree.path],
        targetPath: worktree.path,
      },
      {
        id: `worktree.remove:${worktree.path}`,
        kind: 'worktree',
        action: 'remove-worktree',
        title: `Remove ${branch}`,
        subtitle: worktree.path,
        keywords: ['delete', 'remove', 'worktree', branch],
        targetPath: worktree.path,
        disabled: worktree.isMain,
        danger: true,
      },
    );
  }

  return items.map((item) => ({ ...item, isRecent: recentIds.has(item.id) }));
}

export function filterCommandItems(items: CommandItem[], query: string): CommandItem[] {
  const normalizedQuery = normalize(query);

  return items
    .map((item, index) => ({
      item,
      index,
      score: normalizedQuery.length === 0 ? baseScore(item) : scoreCommandItem(item, normalizedQuery),
    }))
    .filter((entry) => entry.score > Number.NEGATIVE_INFINITY)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}

export function updateRecentCommandIds(current: string[], commandId: string): string[] {
  return [commandId, ...current.filter((id) => id !== commandId)].slice(0, RECENT_COMMAND_LIMIT);
}

function scoreCommandItem(item: CommandItem, query: string) {
  const searchable = normalize([item.title, item.subtitle, ...item.keywords].join(' '));
  const fuzzyScore = scoreFuzzyMatch(searchable, query);

  if (fuzzyScore === null) {
    return Number.NEGATIVE_INFINITY;
  }

  return fuzzyScore + baseScore(item);
}

function baseScore(item: CommandItem) {
  let score = 0;

  if (item.isRecent === true) {
    score += 20;
  }

  if (item.kind === 'action') {
    score += 6;
  }

  if (item.kind === 'project') {
    score += 3;
  }

  if (item.disabled === true) {
    score -= 80;
  }

  return score;
}

function scoreFuzzyMatch(text: string, query: string) {
  let searchIndex = 0;
  let score = 0;
  let lastMatchIndex = -1;

  for (const character of query) {
    const matchIndex = text.indexOf(character, searchIndex);

    if (matchIndex === -1) {
      return null;
    }

    score += matchIndex === searchIndex ? 8 : 2;

    if (lastMatchIndex + 1 === matchIndex) {
      score += 8;
    }

    if (matchIndex === 0 || text[matchIndex - 1] === ' ' || text[matchIndex - 1] === '-' || text[matchIndex - 1] === '/') {
      score += 5;
    }

    lastMatchIndex = matchIndex;
    searchIndex = matchIndex + 1;
  }

  return score - text.length * 0.01;
}

function normalize(value: string) {
  return value.toLowerCase().trim();
}
