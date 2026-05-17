import { contextBridge, ipcRenderer, webUtils } from 'electron';
import {
  ipcChannels,
  listWorktreesInputSchema,
  openWorktreeInputSchema,
  removeWorktreeInputSchema,
  validateProjectInputSchema,
  type WorktreeApi,
} from '../shared/ipc';

const worktreeApi: WorktreeApi = {
  listWorktrees(input) {
    const parsed = listWorktreesInputSchema.parse(input);
    return ipcRenderer.invoke(ipcChannels.listWorktrees, parsed);
  },
  openWorktree(input) {
    const parsed = openWorktreeInputSchema.parse(input);
    return ipcRenderer.invoke(ipcChannels.openWorktree, parsed);
  },
  removeWorktree(input) {
    const parsed = removeWorktreeInputSchema.parse(input);
    return ipcRenderer.invoke(ipcChannels.removeWorktree, parsed);
  },
  selectProjectDirectory() {
    return ipcRenderer.invoke(ipcChannels.selectProjectDirectory);
  },
  validateProject(input) {
    const parsed = validateProjectInputSchema.parse(input);
    return ipcRenderer.invoke(ipcChannels.validateProject, parsed);
  },
  getDroppedFilePath(file) {
    const path = webUtils.getPathForFile(file);
    return path.length > 0 ? path : null;
  },
};

contextBridge.exposeInMainWorld('worktreeApi', worktreeApi);
