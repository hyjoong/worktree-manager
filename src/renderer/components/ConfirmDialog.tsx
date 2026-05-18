import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onOpenChange(open: boolean): void;
  onConfirm(): void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-panel">
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive">
              <AlertTriangle className="size-4" />
            </div>
            <div className="min-w-0">
              <Dialog.Title className="text-sm font-semibold">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 whitespace-pre-line text-xs leading-5 text-muted-foreground">{description}</Dialog.Description>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="button" variant="destructive" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
