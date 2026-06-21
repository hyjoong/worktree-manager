import { describe, expect, it } from 'vitest';
import { suggestWorktreePath, suggestWorktreePathOptions } from './worktree-path';

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

describe('suggestWorktreePathOptions', () => {
  it('returns project-prefixed and short sibling path options', () => {
    expect(suggestWorktreePathOptions('/Users/me/Desktop/react-virtual-scroll', 'feature/dsds')).toEqual([
      {
        id: 'project-prefixed',
        label: 'Project prefix',
        path: '/Users/me/Desktop/react-virtual-scroll-feature-dsds',
      },
      {
        id: 'branch-only',
        label: 'Short name',
        path: '/Users/me/Desktop/feature-dsds',
      },
    ]);
  });

  it('deduplicates path options when project path has no parent directory', () => {
    expect(suggestWorktreePathOptions('repo', 'repo')).toEqual([
      {
        id: 'project-prefixed',
        label: 'Project prefix',
        path: 'repo-repo',
      },
      {
        id: 'branch-only',
        label: 'Short name',
        path: 'repo',
      },
    ]);
  });

  it('returns no options when branch has no usable characters', () => {
    expect(suggestWorktreePathOptions('/Users/me/Desktop/app', ' / ')).toEqual([]);
  });
});
