import { describe, expect, it } from 'vitest';
import { assertAllowedIpcSender, isAllowedRendererUrl } from './security';

describe('Electron renderer URL security', () => {
  it('allows packaged renderer files and localhost dev server URLs', () => {
    expect(isAllowedRendererUrl('file:///Applications/Worktree%20Manager.app/Contents/Resources/app/dist/renderer/index.html')).toBe(
      true,
    );
    expect(isAllowedRendererUrl('http://127.0.0.1:5173/')).toBe(true);
    expect(isAllowedRendererUrl('http://127.0.0.1:5173/src/renderer/main.tsx')).toBe(true);
  });

  it('rejects remote, non-loopback, and malformed renderer URLs', () => {
    expect(isAllowedRendererUrl('https://example.com')).toBe(false);
    expect(isAllowedRendererUrl('http://localhost:5173/')).toBe(false);
    expect(isAllowedRendererUrl('http://192.168.0.2:5173/')).toBe(false);
    expect(isAllowedRendererUrl('not a url')).toBe(false);
  });
});

describe('IPC sender security', () => {
  it('accepts IPC calls from the packaged renderer', () => {
    expect(() =>
      assertAllowedIpcSender({
        getURL: () => 'file:///Applications/Worktree%20Manager.app/Contents/Resources/app/dist/renderer/index.html',
      }),
    ).not.toThrow();
  });

  it('rejects IPC calls from unexpected origins', () => {
    expect(() =>
      assertAllowedIpcSender({
        getURL: () => 'https://example.com',
      }),
    ).toThrow('Blocked IPC call from unexpected renderer URL');
  });
});
