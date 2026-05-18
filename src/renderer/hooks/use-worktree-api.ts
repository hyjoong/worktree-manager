import { useToastStore } from '../stores/toast-store';

type UseWorktreeApiOptions = {
  setError(message: string): void;
  appendLog(message: string): void;
};

export function useWorktreeApi({ setError, appendLog }: UseWorktreeApiOptions) {
  const toast = useToastStore((state) => state.push);

  function readWorktreeApi() {
    if (window.worktreeApi === undefined) {
      const message =
        'Electron preload API is not available. Use the Electron app window launched by pnpm dev, not the browser at 127.0.0.1.';
      setError(message);
      appendLog(`error: ${message}`);
      toast({ tone: 'error', title: 'Electron API unavailable', description: message });
      return null;
    }

    return window.worktreeApi;
  }

  return { readWorktreeApi };
}
