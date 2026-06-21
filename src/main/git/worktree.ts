import { execa } from 'execa';
import type { BranchInfo, CommitSummary, CreateWorktreeInput, OpenWorktreeInput, WorktreeInfo, WorktreeStatus } from '../../shared/ipc';
import { getWorktreeRemovalBlocker } from '../../shared/worktree-removal';

type MutableWorktree = {
  path: string;
  branch: string | null;
  head: string | null;
  isDirty: boolean;
  isBare: boolean;
  isDetached: boolean;
  isMain: boolean;
  status: WorktreeStatus;
  lastCommit: CommitSummary | null;
};

export function parseWorktreePorcelain(output: string): WorktreeInfo[] {
  const worktrees: MutableWorktree[] = [];
  let current: MutableWorktree | null = null;

  const pushCurrent = () => {
    if (current !== null) {
      worktrees.push(current);
      current = null;
    }
  };

  for (const line of output.split(/\r?\n/)) {
    if (line.length === 0) {
      pushCurrent();
      continue;
    }

    const [key, ...valueParts] = line.split(' ');
    const value = valueParts.join(' ');

    if (key === 'worktree') {
      pushCurrent();
      current = {
        path: value,
        branch: null,
        head: null,
        isDirty: false,
        isBare: false,
        isDetached: false,
        isMain: worktrees.length === 0,
        status: 'clean',
        lastCommit: null,
      };
      continue;
    }

    if (current === null) {
      continue;
    }

    switch (key) {
      case 'HEAD':
        current.head = value;
        break;
      case 'branch':
        current.branch = value.replace(/^refs\/heads\//, '');
        break;
      case 'dirty':
        current.isDirty = true;
        current.status = 'dirty';
        break;
      case 'bare':
        current.isBare = true;
        current.status = 'bare';
        break;
      case 'detached':
        current.isDetached = true;
        current.status = 'detached';
        break;
      default:
        break;
    }
  }

  pushCurrent();
  return worktrees;
}

export async function listWorktrees(projectPath: string): Promise<WorktreeInfo[]> {
  const { stdout } = await execa('git', ['-C', projectPath, 'worktree', 'list', '--porcelain']);
  const worktrees = parseWorktreePorcelain(stdout);

  return Promise.all(
    worktrees.map(async (worktree) => {
      if (worktree.isBare) {
        return worktree;
      }

      const [isDirty, lastCommit] = await Promise.all([readDirtyStatus(worktree.path), readLastCommit(worktree.path)]);

      return {
        ...worktree,
        isDirty,
        lastCommit,
        status: resolveStatus({ ...worktree, isDirty }),
      };
    }),
  );
}

export async function listBranches(projectPath: string): Promise<BranchInfo[]> {
  const { stdout } = await execa('git', [
    '-C',
    projectPath,
    'branch',
    '--all',
    '--format=%(refname:short)%09%(upstream:short)',
  ]);
  return parseBranchList(stdout);
}

export function parseBranchList(output: string): BranchInfo[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [rawName = '', _upstream = '', kind = ''] = line.split('\t');
      const isRemote = rawName.startsWith('remotes/');
      const remoteName = isRemote ? rawName.replace(/^remotes\//, '') : rawName;

      if (isRemote && /\/HEAD$/.test(remoteName)) {
        return null;
      }

      const [remote] = remoteName.split('/');

      return {
        name: remoteName,
        label: remoteName,
        remote: isRemote ? (remote ?? null) : null,
        isRemote: isRemote || kind === 'remote',
      } satisfies BranchInfo;
    })
    .filter((branch): branch is BranchInfo => branch !== null);
}

export async function validateProjectPath(projectPath: string): Promise<string> {
  const { stdout } = await execa('git', ['-C', projectPath, 'rev-parse', '--show-toplevel']);
  return stdout.trim();
}

export async function openWorktree(input: OpenWorktreeInput): Promise<void> {
  const appName = input.editor === 'cursor' ? 'Cursor' : 'Visual Studio Code';
  await execa('open', ['-a', appName, input.path]);
}

export async function removeWorktree(projectPath: string, worktreePath: string): Promise<void> {
  const worktrees = parseWorktreePorcelain(
    (await execa('git', ['-C', projectPath, 'worktree', 'list', '--porcelain'])).stdout,
  );
  const target = worktrees.find((worktree) => worktree.path === worktreePath);

  if (target === undefined) {
    throw new Error('Worktree was not found.');
  }

  const targetWithDirtyStatus = target.isBare ? target : { ...target, isDirty: await readDirtyStatus(target.path) };
  const blocker = getWorktreeRemovalBlocker(targetWithDirtyStatus);

  if (blocker !== null) {
    throw new Error(blocker);
  }

  await execa('git', ['-C', projectPath, 'worktree', 'remove', worktreePath]);
}

export async function createWorktree(input: CreateWorktreeInput): Promise<void> {
  await execa('git', buildCreateWorktreeArgs(input));
}

export function buildCreateWorktreeArgs(input: CreateWorktreeInput): string[] {
  if (input.mode === 'existing') {
    return ['-C', input.projectPath, 'worktree', 'add', input.path, input.branch];
  }

  return ['-C', input.projectPath, 'worktree', 'add', '-b', input.branch, input.path];
}

async function readDirtyStatus(path: string): Promise<boolean> {
  const { stdout } = await execa('git', ['-C', path, 'status', '--porcelain']);
  return stdout.trim().length > 0;
}

async function readLastCommit(path: string): Promise<CommitSummary | null> {
  try {
    const { stdout } = await execa('git', ['-C', path, 'log', '-1', '--pretty=format:%h%x00%s%x00%cr']);
    const [hash, subject, relativeTime] = stdout.split('\0');

    if (hash === undefined || subject === undefined || relativeTime === undefined) {
      return null;
    }

    return { hash, subject, relativeTime };
  } catch {
    return null;
  }
}

function resolveStatus(worktree: Pick<WorktreeInfo, 'isBare' | 'isDetached' | 'isDirty'>): WorktreeStatus {
  if (worktree.isBare) {
    return 'bare';
  }

  if (worktree.isDirty) {
    return 'dirty';
  }

  if (worktree.isDetached) {
    return 'detached';
  }

  return 'clean';
}
