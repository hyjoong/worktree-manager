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

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target.isContentEditable;
}

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

      // Let bare-key shortcuts (e.g. j/k/n/Enter) fall through to text fields the
      // user is typing into. Modifier-based shortcuts (⌘K) still fire everywhere.
      const usesModifier = (shortcut.meta ?? false) || (shortcut.ctrl ?? false) || (shortcut.alt ?? false);

      if (!usesModifier && isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      shortcut.handler(event);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
