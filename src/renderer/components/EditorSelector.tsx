import { Code2, SquareCode } from 'lucide-react';
import { Button } from './ui/button';
import type { EditorId } from '../../shared/ipc';

type EditorSelectorProps = {
  editor: EditorId;
  onChange(editor: EditorId): void;
};

export function EditorSelector({ editor, onChange }: EditorSelectorProps) {
  return (
    <div className="flex rounded-md border border-border bg-card p-0.5">
      <Button
        type="button"
        variant={editor === 'cursor' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 border-transparent px-2 text-[11px]"
        onClick={() => onChange('cursor')}
      >
        <Code2 className="size-3.5" />
        Cursor
      </Button>
      <Button
        type="button"
        variant={editor === 'vscode' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 border-transparent px-2 text-[11px]"
        onClick={() => onChange('vscode')}
      >
        <SquareCode className="size-3.5" />
        VS Code
      </Button>
    </div>
  );
}
