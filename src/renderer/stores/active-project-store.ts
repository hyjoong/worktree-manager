import { create } from 'zustand';

export type ActiveProjectStorage = Pick<Storage, 'getItem' | 'setItem'>;

const storageKey = 'worktree-manager-active-project';

type ActiveProjectState = {
  activeProjectPath: string | null;
  setActiveProjectPath(path: string): void;
};

export function readStoredActiveProjectPath(storage: ActiveProjectStorage | null): string | null {
  const stored = storage?.getItem(storageKey)?.trim() ?? '';
  return stored.length > 0 ? stored : null;
}

export function writeStoredActiveProjectPath(storage: ActiveProjectStorage | null, path: string): void {
  storage?.setItem(storageKey, path);
}

function readInitialActiveProjectPath(): string | null {
  return readStoredActiveProjectPath(getLocalStorage());
}

export const useActiveProjectStore = create<ActiveProjectState>((set) => ({
  activeProjectPath: readInitialActiveProjectPath(),
  setActiveProjectPath(path) {
    writeStoredActiveProjectPath(getLocalStorage(), path);
    set({ activeProjectPath: path });
  },
}));

function getLocalStorage(): ActiveProjectStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}
