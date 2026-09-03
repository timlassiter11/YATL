import { afterEach, describe, expect, test } from 'vitest';

import {
  formatRelativeTime,
  getAnimationPromise,
  toast,
  toastVariantIcon,
} from './common';
import { YatlToastRequest } from '../events/toast';
import { toastStore } from './toast-store';

describe('toast', () => {
  afterEach(() => {
    toastStore.clear();
  });

  test('returns a generated id when none is given', () => {
    const id = toast({ message: 'Hi' });

    expect(id).toBeTruthy();
    expect(toastStore.history[0].id).toBe(id);
  });

  test('returns the given id unchanged, for later updates', () => {
    const id = toast({ id: 'upload', message: 'Uploading' });

    expect(id).toBe('upload');
  });

  test('dispatches a yatl-toast-request event on window with the resolved id', () => {
    let received: YatlToastRequest | undefined;
    const listener = (event: YatlToastRequest) => (received = event);
    window.addEventListener('yatl-toast-request', listener);

    const id = toast({ message: 'Hi' });

    window.removeEventListener('yatl-toast-request', listener);
    expect(received?.data).toMatchObject({ id, message: 'Hi' });
  });
});

describe('toastVariantIcon', () => {
  test('maps danger and success to an icon, and leaves other variants empty', () => {
    expect(toastVariantIcon('danger')).toBe('close');
    expect(toastVariantIcon('success')).toBe('check');
    expect(toastVariantIcon('neutral')).toBe('');
    expect(toastVariantIcon('warning')).toBe('');
    expect(toastVariantIcon()).toBe('');
  });
});

describe('formatRelativeTime', () => {
  test('reports anything under a minute old as "just now"', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 30_000, now)).toBe('just now');
  });

  test('formats minutes, hours, and days ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe('5 minutes ago');
    expect(formatRelativeTime(now - 3 * 60 * 60_000, now)).toBe('3 hours ago');
    expect(formatRelativeTime(now - 2 * 24 * 60 * 60_000, now)).toBe(
      '2 days ago',
    );
  });
});

describe('getAnimationPromise', () => {
  test('resolves via the timeout fallback when no matching animation ever fires', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const start = performance.now();
    // No CSS animation is defined on this element at all, so the only way
    // this can resolve is the timeout fallback.
    await getAnimationPromise(el, 'some-animation-name', 50);
    const elapsed = performance.now() - start;

    // Should resolve close to the timeout, not hang indefinitely.
    expect(elapsed).toBeLessThan(1500);

    el.remove();
  });
});
