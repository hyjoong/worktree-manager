import * as Toast from '@radix-ui/react-toast';
import { CheckCircle2, CircleAlert, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToastStore } from '../stores/toast-store';

export function ToastHost() {
  const { toasts, dismiss } = useToastStore();

  return (
    <Toast.Provider swipeDirection="right">
      {toasts.map((toast) => {
        const Icon = toast.tone === 'error' ? CircleAlert : CheckCircle2;

        return (
          <Toast.Root
            key={toast.id}
            className={cn(
              'grid w-80 grid-cols-[16px_1fr_20px] items-start gap-2 rounded-lg border bg-popover p-3 text-popover-foreground shadow-panel',
              toast.tone === 'error' ? 'border-destructive/35' : 'border-border',
            )}
          >
            <Icon className={cn('mt-0.5 size-4', toast.tone === 'error' ? 'text-destructive' : 'text-emerald-500')} />
            <div className="min-w-0">
              <Toast.Title className="text-xs font-semibold">{toast.title}</Toast.Title>
              {toast.description !== undefined ? (
                <Toast.Description className="mt-1 text-xs text-muted-foreground">{toast.description}</Toast.Description>
              ) : null}
            </div>
            <Toast.Close
              className="rounded text-muted-foreground hover:text-foreground"
              onClick={() => dismiss(toast.id)}
              aria-label="Close toast"
            >
              <X className="size-3.5" />
            </Toast.Close>
          </Toast.Root>
        );
      })}
      <Toast.Viewport className="fixed right-3 top-3 z-50 grid gap-2 outline-none" />
    </Toast.Provider>
  );
}
