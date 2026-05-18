import { describe, expect, it } from 'vitest';
import { buildCreateWorktreeArgs, parseWorktreePorcelain } from './worktree';

describe('parseWorktreePorcelain', () => {
  it('parses worktree path, branch, and clean status from porcelain output', () => {
    const output = [
      'worktree /repo',
      'HEAD 1111111111111111111111111111111111111111',
      'branch refs/heads/main',
      '',
      'worktree /repo-feature',
      'HEAD 2222222222222222222222222222222222222222',
      'branch refs/heads/feature/a',
      '',
    ].join('\n');

    expect(parseWorktreePorcelain(output)).toEqual([
      {
        path: '/repo',
        branch: 'main',
        head: '1111111111111111111111111111111111111111',
        isDirty: false,
        isBare: false,
        isDetached: false,
        status: 'clean',
        lastCommit: null,
        isMain: true,
      },
      {
        path: '/repo-feature',
        branch: 'feature/a',
        head: '2222222222222222222222222222222222222222',
        isDirty: false,
        isBare: false,
        isDetached: false,
        status: 'clean',
        lastCommit: null,
        isMain: false,
      },
    ]);
  });

  it('marks worktrees as dirty when porcelain contains dirty metadata', () => {
    const output = [
      'worktree /repo-dirty',
      'HEAD 3333333333333333333333333333333333333333',
      'branch refs/heads/dirty',
      'dirty',
      '',
    ].join('\n');

    expect(parseWorktreePorcelain(output)[0]?.isDirty).toBe(true);
  });

  it('supports detached and bare worktrees without a branch', () => {
    const output = [
      'worktree /repo-detached',
      'HEAD 4444444444444444444444444444444444444444',
      'detached',
      '',
      'worktree /repo-bare',
      'bare',
      '',
    ].join('\n');

    expect(parseWorktreePorcelain(output)).toEqual([
      {
        path: '/repo-detached',
        branch: null,
        head: '4444444444444444444444444444444444444444',
        isDirty: false,
        isBare: false,
        isDetached: true,
        status: 'detached',
        lastCommit: null,
        isMain: true,
      },
      {
        path: '/repo-bare',
        branch: null,
        head: null,
        isDirty: false,
        isBare: true,
        isDetached: false,
        status: 'bare',
        lastCommit: null,
        isMain: false,
      },
    ]);
  });
});

describe('buildCreateWorktreeArgs', () => {
  it('builds args for creating a new branch and worktree', () => {
    expect(
      buildCreateWorktreeArgs({
        projectPath: '/repo',
        mode: 'new',
        branch: 'feature/a',
        path: '/repo-feature-a',
      }),
    ).toEqual(['-C', '/repo', 'worktree', 'add', '-b', 'feature/a', '/repo-feature-a']);
  });

  it('builds args for checking out an existing branch into a worktree', () => {
    expect(
      buildCreateWorktreeArgs({
        projectPath: '/repo',
        mode: 'existing',
        branch: 'feature/a',
        path: '/repo-feature-a',
      }),
    ).toEqual(['-C', '/repo', 'worktree', 'add', '/repo-feature-a', 'feature/a']);
  });
});
