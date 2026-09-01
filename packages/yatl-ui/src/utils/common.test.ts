import { describe, expect, test } from 'vitest';

import { getAnimationPromise } from './common';

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
