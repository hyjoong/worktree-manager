import { create } from 'zustand';
import type { EditorId } from '../../shared/ipc';

type EditorState = {
  editor: EditorId;
  setEditor(editor: EditorId): void;
};

const storageKey = 'worktree-manager-editor';

function readInitialEditor(): EditorId {
  const stored = window.localStorage.getItem(storageKey);
  return stored === 'vscode' ? 'vscode' : 'cursor';
}

export const useEditorStore = create<EditorState>((set) => ({
  editor: readInitialEditor(),
  setEditor(editor) {
    window.localStorage.setItem(storageKey, editor);
    set({ editor });
  },
}));
