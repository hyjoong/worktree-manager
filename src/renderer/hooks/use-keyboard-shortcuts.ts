import { useEffect } from 'react';

export type KeyboardShortcut = {
  key: string;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  ctrl?: boolean;
  enabled?: boolean;
  handler(event: KeyboardEvent): void;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const shortcut = shortcuts.find((candidate) => {
        if (candidate.enabled === false) {
          return false;
        }

        return (
          event.key.toLowerCase() === candidate.key.toLowerCase() &&
          event.metaKey === (candidate.meta ?? false) &&
          event.shiftKey === (candidate.shift ?? false) &&
          event.altKey === (candidate.alt ?? false) &&
          event.ctrlKey === (candidate.ctrl ?? false)
        );
      });

      if (shortcut === undefined) {
        return;
      }

      event.preventDefault();
      shortcut.handler(event);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
