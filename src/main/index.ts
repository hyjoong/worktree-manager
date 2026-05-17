import { app, BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent, type OpenDialogOptions } from 'electron';
import { join } from 'node:path';
import {
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
import { loadProjects, saveProjects } from './settings/projects';

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;

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

  if (isDev) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL as string);
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

ipcMain.handle(ipcChannels.loadProjects, async () => {
  try {
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

app.whenReady().then(() => {
  createWindow();

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
