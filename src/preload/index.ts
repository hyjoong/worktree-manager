import { contextBridge, ipcRenderer, webUtils } from 'electron';
import {
  copyTextInputSchema,
  createWorktreeInputSchema,
  ipcChannels,
  listWorktreesInputSchema,
  openWorktreeInputSchema,
  removeWorktreeInputSchema,
  saveProjectsInputSchema,
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
  createWorktree(input) {
    const parsed = createWorktreeInputSchema.parse(input);
    return ipcRenderer.invoke(ipcChannels.createWorktree, parsed);
  },
  selectProjectDirectory() {
    return ipcRenderer.invoke(ipcChannels.selectProjectDirectory);
  },
  validateProject(input) {
    const parsed = validateProjectInputSchema.parse(input);
    return ipcRenderer.invoke(ipcChannels.validateProject, parsed);
  },
  loadProjects() {
    return ipcRenderer.invoke(ipcChannels.loadProjects);
  },
  saveProjects(input) {
    const parsed = saveProjectsInputSchema.parse(input);
    return ipcRenderer.invoke(ipcChannels.saveProjects, parsed);
  },
  copyText(input) {
    const parsed = copyTextInputSchema.parse(input);
    return ipcRenderer.invoke(ipcChannels.copyText, parsed);
  },
  getDroppedFilePath(file) {
    const path = webUtils.getPathForFile(file);
    return path.length > 0 ? path : null;
  },
};

contextBridge.exposeInMainWorld('worktreeApi', worktreeApi);
