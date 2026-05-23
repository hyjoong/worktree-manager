import { app, BrowserWindow, clipboard, dialog, ipcMain, type IpcMainInvokeEvent, type OpenDialogOptions } from 'electron';
import { autoUpdater } from 'electron-updater';
import { join } from 'node:path';
import {
  copyTextInputSchema,
  createWorktreeInputSchema,
  ipcChannels,
  listWorktreesInputSchema,
  openWorktreeInputSchema,
  removeWorktreeInputSchema,
  saveProjectsInputSchema,
  validateProjectInputSchema,
  type SelectProjectDirectoryResult,
} from '../shared/ipc';
import { createWorktree, listWorktrees, openWorktree, removeWorktree, validateProjectPath } from './git/worktree';
import { handleValidatedIpc } from './ipc/handle';
import { assertAllowedIpcSender, isAllowedRendererUrl } from './security';
import { loadProjects, saveProjects } from './settings/projects';
import { createUpdateService } from './updates/service';

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;
const updateService = createUpdateService({
  updater: autoUpdater,
  isPackaged: app.isPackaged,
  broadcast(status) {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(ipcChannels.updateStatus, status);
    }
  },
});

function createWindow() {
  const window = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 860,
    minHeight: 560,
    title: 'Worktree Manager',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedRendererUrl(url)) {
      event.preventDefault();
    }
  });

  window.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  if (isDev) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL as string;

    if (!isAllowedRendererUrl(devServerUrl)) {
      throw new Error(`Refusing to load unexpected renderer URL: ${devServerUrl}`);
    }

    void window.loadURL(devServerUrl);
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

handleValidatedIpc(ipcChannels.listWorktrees, listWorktreesInputSchema, async (input) => {
  return {
    ok: true,
    worktrees: await listWorktrees(input.projectPath),
  };
});

handleValidatedIpc(ipcChannels.openWorktree, openWorktreeInputSchema, async (input) => {
  await openWorktree(input);
  return { ok: true };
});

handleValidatedIpc(ipcChannels.removeWorktree, removeWorktreeInputSchema, async (input) => {
  await removeWorktree(input.projectPath, input.path);
  return { ok: true };
});

handleValidatedIpc(ipcChannels.createWorktree, createWorktreeInputSchema, async (input) => {
  await createWorktree(input);
  return { ok: true };
});

ipcMain.handle(ipcChannels.selectProjectDirectory, async (event: IpcMainInvokeEvent): Promise<SelectProjectDirectoryResult> => {
  try {
    assertAllowedIpcSender(event.sender);
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: OpenDialogOptions = {
      title: 'Select a Git project',
      buttonLabel: 'Register Project',
      properties: ['openDirectory'],
    };
    const result =
      parentWindow === null
        ? await dialog.showOpenDialog(dialogOptions)
        : await dialog.showOpenDialog(parentWindow, dialogOptions);

    return {
      ok: true,
      path: result.canceled ? null : (result.filePaths[0] ?? null),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to select project directory',
    };
  }
});

handleValidatedIpc(ipcChannels.validateProject, validateProjectInputSchema, async (input) => {
  return {
    ok: true,
    rootPath: await validateProjectPath(input.projectPath),
  };
});

ipcMain.handle(ipcChannels.loadProjects, async (event: IpcMainInvokeEvent) => {
  try {
    assertAllowedIpcSender(event.sender);
    return {
      ok: true,
      projects: await loadProjects(),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to load projects',
    };
  }
});

handleValidatedIpc(ipcChannels.saveProjects, saveProjectsInputSchema, async (input) => {
  await saveProjects(input.projects);
  return { ok: true };
});

handleValidatedIpc(ipcChannels.copyText, copyTextInputSchema, async (input) => {
  clipboard.writeText(input.text);
  return { ok: true };
});

ipcMain.handle(ipcChannels.checkForUpdates, async (event: IpcMainInvokeEvent) => {
  try {
    assertAllowedIpcSender(event.sender);
    return await updateService.checkForUpdates();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to check for updates',
    };
  }
});

ipcMain.handle(ipcChannels.installUpdate, async (event: IpcMainInvokeEvent) => {
  try {
    assertAllowedIpcSender(event.sender);
    return await updateService.installUpdate();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to install update',
    };
  }
});

app.whenReady().then(() => {
  createWindow();

  if (app.isPackaged) {
    setTimeout(() => {
      void updateService.checkForUpdates();
    }, 3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
