import { describe, expect, it } from 'vitest';
import { suggestWorktreePath } from './worktree-path';

describe('suggestWorktreePath', () => {
  it('suggests a sibling worktree path based on the active project and branch', () => {
    expect(suggestWorktreePath('/Users/me/Desktop/teacher-gguge-front', 'feature/login')).toBe(
      '/Users/me/Desktop/teacher-gguge-front-feature-login',
    );
  });

  it('sanitizes whitespace and branch separators for filesystem-friendly paths', () => {
    expect(suggestWorktreePath('/Users/me/Desktop/app', 'fix/user api')).toBe('/Users/me/Desktop/app-fix-user-api');
  });

  it('returns an empty path when the branch has no usable characters', () => {
    expect(suggestWorktreePath('/Users/me/Desktop/app', ' / ')).toBe('');
  });
});
