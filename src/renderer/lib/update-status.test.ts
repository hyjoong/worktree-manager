import { describe, expect, it } from 'vitest';
import { getAppTabIndicator, getAppTabIndicatorClass } from './update-status';
import type { UpdateStatus } from '../../shared/ipc';

function status(phase: UpdateStatus['phase']): UpdateStatus {
  return { phase, message: phase };
}

describe('update status helpers', () => {
  it('maps update phases to app tab indicators', () => {
    expect(getAppTabIndicator(status('idle'))).toBe('none');
    expect(getAppTabIndicator(status('not-available'))).toBe('none');
    expect(getAppTabIndicator(status('checking'))).toBe('progress');
    expect(getAppTabIndicator(status('available'))).toBe('progress');
    expect(getAppTabIndicator(status('downloading'))).toBe('progress');
    expect(getAppTabIndicator(status('downloaded'))).toBe('ready');
    expect(getAppTabIndicator(status('error'))).toBe('error');
  });

  it('maps app tab indicators to visual classes', () => {
    expect(getAppTabIndicatorClass('none')).toBe('');
    expect(getAppTabIndicatorClass('progress')).toBe('bg-violet-400');
    expect(getAppTabIndicatorClass('ready')).toBe('bg-blue-400');
    expect(getAppTabIndicatorClass('error')).toBe('bg-destructive');
  });
});
