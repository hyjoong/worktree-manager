import type { WorktreeApi } from '../../shared/ipc';

declare global {
  interface Window {
    worktreeApi: WorktreeApi;
  }
}

export {};
