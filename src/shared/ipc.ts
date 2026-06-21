import { z } from 'zod';

export const ipcChannels = {
  listWorktrees: 'git:list-worktrees',
  listBranches: 'git:list-branches',
  openWorktree: 'git:open-worktree',
  removeWorktree: 'git:remove-worktree',
  createWorktree: 'git:create-worktree',
  selectProjectDirectory: 'dialog:select-project-directory',
  validateProject: 'git:validate-project',
  loadProjects: 'settings:load-projects',
  saveProjects: 'settings:save-projects',
  copyText: 'clipboard:copy-text',
  checkForUpdates: 'updates:check-for-updates',
  installUpdate: 'updates:install-update',
  updateStatus: 'updates:status',
  getAppInfo: 'app:get-info',
} as const;

export const listWorktreesInputSchema = z.object({
  projectPath: z.string().trim().min(1, 'Project path is required'),
});

export const listBranchesInputSchema = z.object({
  projectPath: z.string().trim().min(1, 'Project path is required'),
});

export const openWorktreeInputSchema = z.object({
  path: z.string().trim().min(1, 'Worktree path is required'),
  editor: z.enum(['cursor', 'vscode']),
});

export const removeWorktreeInputSchema = z.object({
  projectPath: z.string().trim().min(1, 'Project path is required'),
  path: z.string().trim().min(1, 'Worktree path is required'),
});

export const createWorktreeInputSchema = z.object({
  projectPath: z.string().trim().min(1, 'Project path is required'),
  path: z.string().trim().min(1, 'Worktree path is required'),
  mode: z.enum(['new', 'existing']),
  branch: z.string().trim().min(1, 'Branch name is required'),
});

export const validateProjectInputSchema = z.object({
  projectPath: z.string().trim().min(1, 'Project path is required'),
});

export const registeredProjectSchema = z.object({
  name: z.string().trim().min(1),
  path: z.string().trim().min(1),
});

export const saveProjectsInputSchema = z.object({
  projects: z.array(registeredProjectSchema),
});

export const copyTextInputSchema = z.object({
  text: z.string().min(1, 'Text is required'),
});

export type ListWorktreesInput = z.infer<typeof listWorktreesInputSchema>;
export type ListBranchesInput = z.infer<typeof listBranchesInputSchema>;
export type OpenWorktreeInput = z.infer<typeof openWorktreeInputSchema>;
export type RemoveWorktreeInput = z.infer<typeof removeWorktreeInputSchema>;
export type CreateWorktreeInput = z.infer<typeof createWorktreeInputSchema>;
export type CreateWorktreeMode = CreateWorktreeInput['mode'];
export type ValidateProjectInput = z.infer<typeof validateProjectInputSchema>;
export type RegisteredProjectInfo = z.infer<typeof registeredProjectSchema>;
export type SaveProjectsInput = z.infer<typeof saveProjectsInputSchema>;
export type CopyTextInput = z.infer<typeof copyTextInputSchema>;
export type EditorId = OpenWorktreeInput['editor'];
export type UpdatePhase = 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';

export type UpdateStatus = {
  phase: UpdatePhase;
  message: string;
  version?: string;
  percent?: number;
};

export type AppInfo = {
  version: string;
  isPackaged: boolean;
};

export type WorktreeStatus = 'clean' | 'dirty' | 'bare' | 'detached';

export type CommitSummary = {
  hash: string;
  subject: string;
  relativeTime: string;
};

export type WorktreeInfo = {
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

export type BranchInfo = {
  name: string;
  label: string;
  remote: string | null;
  isRemote: boolean;
};

export type ListWorktreesResult =
  | {
      ok: true;
      worktrees: WorktreeInfo[];
    }
  | {
      ok: false;
      error: string;
    };

export type ListBranchesResult =
  | {
      ok: true;
      branches: BranchInfo[];
    }
  | {
      ok: false;
      error: string;
    };

export type MutationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export type SelectProjectDirectoryResult =
  | {
      ok: true;
      path: string | null;
    }
  | {
      ok: false;
      error: string;
    };

export type ValidateProjectResult =
  | {
      ok: true;
      rootPath: string;
    }
  | {
      ok: false;
      error: string;
    };

export type LoadProjectsResult =
  | {
      ok: true;
      projects: RegisteredProjectInfo[];
    }
  | {
      ok: false;
      error: string;
    };

export type AppInfoResult =
  | {
      ok: true;
      app: AppInfo;
    }
  | {
      ok: false;
      error: string;
    };

export type WorktreeApi = {
  listWorktrees(input: ListWorktreesInput): Promise<ListWorktreesResult>;
  listBranches(input: ListBranchesInput): Promise<ListBranchesResult>;
  openWorktree(input: OpenWorktreeInput): Promise<MutationResult>;
  removeWorktree(input: RemoveWorktreeInput): Promise<MutationResult>;
  createWorktree(input: CreateWorktreeInput): Promise<MutationResult>;
  selectProjectDirectory(): Promise<SelectProjectDirectoryResult>;
  validateProject(input: ValidateProjectInput): Promise<ValidateProjectResult>;
  loadProjects(): Promise<LoadProjectsResult>;
  saveProjects(input: SaveProjectsInput): Promise<MutationResult>;
  copyText(input: CopyTextInput): Promise<MutationResult>;
  checkForUpdates(): Promise<MutationResult>;
  installUpdate(): Promise<MutationResult>;
  getAppInfo(): Promise<AppInfoResult>;
  onUpdateStatus(callback: (status: UpdateStatus) => void): () => void;
  getDroppedFilePath(file: File): string | null;
};
