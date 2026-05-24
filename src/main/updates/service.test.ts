import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { createUpdateService, type UpdaterLike } from './service';

class MockUpdater extends EventEmitter implements UpdaterLike {
  autoDownload = false;
  autoInstallOnAppQuit = false;
  checkForUpdates = vi.fn(async () => undefined);
  quitAndInstall = vi.fn();
}

describe('createUpdateService', () => {
  it('maps updater events to renderer-safe update statuses', () => {
    const updater = new MockUpdater();
    const broadcast = vi.fn();

    createUpdateService({ updater, isPackaged: true, broadcast });

    updater.emit('checking-for-update');
    updater.emit('update-available', { version: '0.2.0' });
    updater.emit('download-progress', { percent: 42.4 });
    updater.emit('update-downloaded', { version: '0.2.0' });

    expect(broadcast).toHaveBeenNthCalledWith(1, { phase: 'checking', message: 'Checking for updates...' });
    expect(broadcast).toHaveBeenNthCalledWith(2, {
      phase: 'available',
      message: 'Update 0.2.0 is available. Downloading...',
      version: '0.2.0',
    });
    expect(broadcast).toHaveBeenNthCalledWith(3, {
      phase: 'downloading',
      message: 'Downloading update 42%',
      percent: 42,
    });
    expect(broadcast).toHaveBeenNthCalledWith(4, {
      phase: 'downloaded',
      message: 'Update 0.2.0 is ready to install.',
      version: '0.2.0',
    });
  });

  it('reports an informational status instead of an error in the development app', async () => {
    const updater = new MockUpdater();
    const broadcast = vi.fn();
    const service = createUpdateService({ updater, isPackaged: false, broadcast });

    const result = await service.checkForUpdates();

    expect(result).toEqual({
      ok: false,
      error: 'Auto updates are only available in the packaged app.',
    });
    expect(updater.checkForUpdates).not.toHaveBeenCalled();
    expect(broadcast).toHaveBeenCalledWith({
      phase: 'idle',
      message: 'Auto updates are only available in the packaged app.',
    });
  });

  it('shows a concise message when GitHub private releases cannot be read', () => {
    const updater = new MockUpdater();
    const broadcast = vi.fn();

    createUpdateService({ updater, isPackaged: true, broadcast });

    updater.emit(
      'error',
      new Error(
        '404 "method: GET url: https://github.com/hyjoong/worktree-manager/releases.atom\\n\\nPlease double check that your authentication token is correct."',
      ),
    );

    expect(broadcast).toHaveBeenCalledWith({
      phase: 'error',
      message: 'Update check failed because the GitHub release feed is private. Make the release source public or configure a private update provider.',
    });
  });

  it('installs a downloaded update through the updater', async () => {
    const updater = new MockUpdater();
    const service = createUpdateService({ updater, isPackaged: true, broadcast: vi.fn() });

    const result = await service.installUpdate();

    expect(result).toEqual({ ok: true });
    expect(updater.quitAndInstall).toHaveBeenCalledWith(false, true);
  });
});
