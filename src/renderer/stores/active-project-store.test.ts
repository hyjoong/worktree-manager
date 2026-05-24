import { describe, expect, it } from 'vitest';
import { readStoredActiveProjectPath, writeStoredActiveProjectPath, type ActiveProjectStorage } from './active-project-store';

function createStorage(initial: Record<string, string> = {}): ActiveProjectStorage {
  const values = new Map(Object.entries(initial));

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

describe('active-project-store helpers', () => {
  it('reads null when there is no saved active project', () => {
    expect(readStoredActiveProjectPath(createStorage())).toBeNull();
  });

  it('trims a saved active project path', () => {
    expect(readStoredActiveProjectPath(createStorage({ 'worktree-manager-active-project': ' /repo ' }))).toBe('/repo');
  });

  it('writes the active project path', () => {
    const storage = createStorage();

    writeStoredActiveProjectPath(storage, '/repo');

    expect(readStoredActiveProjectPath(storage)).toBe('/repo');
  });
});
