import { app, BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from 'electron';
import { join } from 'node:path';
import {
  ipcChannels,
  listWorktreesInputSchema,
  openWorktreeInputSchema,
  removeWorktreeInputSchema,
  type ListWorktreesResult,
  type MutationResult,
  type SelectProjectDirectoryResult,
} from '../shared/ipc';
import { listWorktrees, openWorktree, removeWorktree } from './git/worktree';

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

ipcMain.handle(ipcChannels.listWorktrees, async (_event, input: unknown): Promise<ListWorktreesResult> => {
  const parsed = listWorktreesInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join(', '),
    };
  }

  try {
    return {
      ok: true,
      worktrees: await listWorktrees(parsed.data.projectPath),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list worktrees';
    return {
      ok: false,
      error: message,
    };
  }
});

ipcMain.handle(ipcChannels.openWorktree, async (_event, input: unknown): Promise<MutationResult> => {
  const parsed = openWorktreeInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join(', '),
    };
  }

  try {
    await openWorktree(parsed.data);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to open worktree',
    };
  }
});

ipcMain.handle(ipcChannels.removeWorktree, async (_event, input: unknown): Promise<MutationResult> => {
  const parsed = removeWorktreeInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join(', '),
    };
  }

  try {
    await removeWorktree(parsed.data.projectPath, parsed.data.path);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to remove worktree',
    };
  }
});

ipcMain.handle(ipcChannels.selectProjectDirectory, async (event): Promise<SelectProjectDirectoryResult> => {
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
