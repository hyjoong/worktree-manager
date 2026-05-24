import type { UpdateStatus } from '../../shared/ipc';

type UpdateInfo = {
  version?: string;
};

type DownloadProgress = {
  percent?: number;
};

export type UpdaterLike = {
  autoDownload: boolean;
  autoInstallOnAppQuit: boolean;
  checkForUpdates(): Promise<unknown>;
  quitAndInstall(isSilent?: boolean, isForceRunAfter?: boolean): void;
  on(event: 'checking-for-update', listener: () => void): UpdaterLike;
  on(event: 'update-available', listener: (info: UpdateInfo) => void): UpdaterLike;
  on(event: 'update-not-available', listener: (info: UpdateInfo) => void): UpdaterLike;
  on(event: 'download-progress', listener: (progress: DownloadProgress) => void): UpdaterLike;
  on(event: 'update-downloaded', listener: (info: UpdateInfo) => void): UpdaterLike;
  on(event: 'error', listener: (error: Error) => void): UpdaterLike;
};

type MutationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

type CreateUpdateServiceInput = {
  updater: UpdaterLike;
  isPackaged: boolean;
  broadcast(status: UpdateStatus): void;
};

export function createUpdateService({ updater, isPackaged, broadcast }: CreateUpdateServiceInput) {
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;

  updater.on('checking-for-update', () => {
    broadcast({ phase: 'checking', message: 'Checking for updates...' });
  });

  updater.on('update-available', (info) => {
    broadcast({
      phase: 'available',
      message: `Update ${formatVersion(info)} is available. Downloading...`,
      version: info.version,
    });
  });

  updater.on('update-not-available', (info) => {
    broadcast({
      phase: 'not-available',
      message: `Version ${formatVersion(info)} is up to date.`,
      version: info.version,
    });
  });

  updater.on('download-progress', (progress) => {
    const percent = Math.round(progress.percent ?? 0);
    broadcast({
      phase: 'downloading',
      message: `Downloading update ${percent}%`,
      percent,
    });
  });

  updater.on('update-downloaded', (info) => {
    broadcast({
      phase: 'downloaded',
      message: `Update ${formatVersion(info)} is ready to install.`,
      version: info.version,
    });
  });

  updater.on('error', (error) => {
    broadcast({
      phase: 'error',
      message: formatUpdateError(error),
    });
  });

  return {
    async checkForUpdates(): Promise<MutationResult> {
      if (!isPackaged) {
        const error = 'Auto updates are only available in the packaged app.';
        broadcast({ phase: 'idle', message: error });
        return { ok: false, error };
      }

      await updater.checkForUpdates();
      return { ok: true };
    },

    async installUpdate(): Promise<MutationResult> {
      if (!isPackaged) {
        const error = 'Auto updates are only available in the packaged app.';
        broadcast({ phase: 'error', message: error });
        return { ok: false, error };
      }

      updater.quitAndInstall(false, true);
      return { ok: true };
    },
  };
}

function formatVersion(info: UpdateInfo) {
  return info.version ?? 'latest';
}

function formatUpdateError(error: Error) {
  if (error.message.includes('releases.atom') && error.message.includes('authentication token')) {
    return 'Update check failed because the GitHub release feed is private. Make the release source public or configure a private update provider.';
  }

  return error.message.split('\n')[0] ?? 'Update check failed.';
}
