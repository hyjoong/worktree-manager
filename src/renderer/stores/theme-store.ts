import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

type ThemeState = {
  theme: ThemeMode;
  setTheme(theme: ThemeMode): void;
  toggleTheme(): void;
};

const storageKey = 'worktree-manager-theme';

function readInitialTheme(): ThemeMode {
  const stored = window.localStorage.getItem(storageKey);
  return stored === 'light' ? 'light' : 'dark';
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.classList.toggle('light', theme === 'light');
  window.localStorage.setItem(storageKey, theme);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readInitialTheme(),
  setTheme(theme) {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme() {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    set({ theme: nextTheme });
  },
}));

applyTheme(readInitialTheme());
