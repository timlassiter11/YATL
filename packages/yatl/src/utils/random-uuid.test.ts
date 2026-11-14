import { afterEach, describe, expect, test, vi } from 'vitest';

import { randomUUID } from './random-uuid';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** A `crypto` as a page served over plain HTTP sees it: no randomUUID. */
function stubInsecureCrypto() {
  const real = globalThis.crypto;
  vi.stubGlobal('crypto', {
    getRandomValues: real.getRandomValues.bind(real),
  });
}

describe('randomUUID', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('uses crypto.randomUUID when it exists', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(
      '00000000-0000-4000-8000-000000000000',
    );

    expect(randomUUID()).toBe('00000000-0000-4000-8000-000000000000');
  });

  test('makes a version 4 UUID without crypto.randomUUID (plain HTTP)', () => {
    stubInsecureCrypto();

    expect(randomUUID()).toMatch(UUID_V4);
  });

  test('makes a different id each time without crypto.randomUUID', () => {
    stubInsecureCrypto();

    const ids = new Set(Array.from({ length: 100 }, () => randomUUID()));

    expect(ids.size).toBe(100);
  });
});
