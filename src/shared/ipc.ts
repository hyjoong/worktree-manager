import { z } from 'zod';

export const ipcChannels = {
  listWorktrees: 'git:list-worktrees',
  openWorktree: 'git:open-worktree',
  removeWorktree: 'git:remove-worktree',
  selectProjectDirectory: 'dialog:select-project-directory',
  validateProject: 'git:validate-project',
} as const;

export const listWorktreesInputSchema = z.object({
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

export const validateProjectInputSchema = z.object({
  projectPath: z.string().trim().min(1, 'Project path is required'),
});

export type ListWorktreesInput = z.infer<typeof listWorktreesInputSchema>;
export type OpenWorktreeInput = z.infer<typeof openWorktreeInputSchema>;
export type RemoveWorktreeInput = z.infer<typeof removeWorktreeInputSchema>;
export type ValidateProjectInput = z.infer<typeof validateProjectInputSchema>;
export type EditorId = OpenWorktreeInput['editor'];

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

export type ListWorktreesResult =
  | {
      ok: true;
      worktrees: WorktreeInfo[];
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

export type WorktreeApi = {
  listWorktrees(input: ListWorktreesInput): Promise<ListWorktreesResult>;
  openWorktree(input: OpenWorktreeInput): Promise<MutationResult>;
  removeWorktree(input: RemoveWorktreeInput): Promise<MutationResult>;
  selectProjectDirectory(): Promise<SelectProjectDirectoryResult>;
  validateProject(input: ValidateProjectInput): Promise<ValidateProjectResult>;
};
