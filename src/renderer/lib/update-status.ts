import type { UpdateStatus } from '../../shared/ipc';

export type AppTabIndicator = 'none' | 'progress' | 'ready' | 'error';

export function getAppTabIndicator(status: UpdateStatus): AppTabIndicator {
  if (status.phase === 'downloaded') {
    return 'ready';
  }

  if (status.phase === 'checking' || status.phase === 'downloading' || status.phase === 'available') {
    return 'progress';
  }

  if (status.phase === 'error') {
    return 'error';
  }

  return 'none';
}

export function getAppTabIndicatorClass(indicator: AppTabIndicator) {
  if (indicator === 'ready') {
    return 'bg-blue-400';
  }

  if (indicator === 'progress') {
    return 'bg-violet-400';
  }

  if (indicator === 'error') {
    return 'bg-destructive';
  }

  return '';
}
