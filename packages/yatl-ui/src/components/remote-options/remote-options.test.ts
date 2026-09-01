import { describe, expect, test, vi } from 'vitest';

import '../../index';
import { YatlRemoteOptions } from './remote-options';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function optionValues(el: YatlRemoteOptions) {
  return [...el.querySelectorAll('yatl-option')].map(o =>
    o.getAttribute('value'),
  );
}

async function renderRemoteOptions() {
  document.body.innerHTML =
    '<yatl-remote-options no-cache></yatl-remote-options>';
  const el = document.querySelector<YatlRemoteOptions>('yatl-remote-options')!;
  await el.updateComplete;
  return el;
}

describe('YatlRemoteOptions - fetchOptions staleness', () => {
  test('a slow fetch for an old uri does not overwrite options from a newer uri', async () => {
    const el = await renderRemoteOptions();

    const responses = new Map<string, ReturnType<typeof deferred<string[]>>>([
      ['uri-a', deferred<string[]>()],
      ['uri-b', deferred<string[]>()],
    ]);
    el.fetchClient = uri => responses.get(uri)!.promise;

    el.uri = 'uri-a';
    await el.updateComplete;

    el.uri = 'uri-b';
    await el.updateComplete;

    // The newer request (uri-b) resolves first...
    responses.get('uri-b')!.resolve(['fresh']);
    await vi.waitFor(() => expect(optionValues(el)).toEqual(['fresh']));

    // ...then the older, now-stale request (uri-a) resolves later.
    responses.get('uri-a')!.resolve(['stale']);
    // Give the stale request's continuation a chance to run if it were
    // going to (incorrectly) overwrite the options.
    await new Promise(r => setTimeout(r, 20));

    expect(optionValues(el)).toEqual(['fresh']);
  });

  test('a failed fetch only clears the cache entry for the uri that actually failed, not whatever uri the element has moved on to', async () => {
    const responses = new Map<string, ReturnType<typeof deferred<string[]>>>([
      ['uri-fail', deferred<string[]>()],
      ['uri-ok', deferred<string[]>()],
    ]);
    const sharedFetchClient = (uri: string) => responses.get(uri)!.promise;

    // el2 stays pinned to uri-ok for the whole test, so uri-ok's ref count
    // never drops to 0 - the only way it can leave promiseCache is via an
    // explicit (and, if buggy, wrongly-targeted) delete.
    document.body.innerHTML =
      '<yatl-remote-options id="el1"></yatl-remote-options>' +
      '<yatl-remote-options id="el2"></yatl-remote-options>';
    const el1 = document.querySelector<YatlRemoteOptions>('#el1')!;
    const el2 = document.querySelector<YatlRemoteOptions>('#el2')!;
    el1.fetchClient = sharedFetchClient;
    el2.fetchClient = sharedFetchClient;
    await el1.updateComplete;
    await el2.updateComplete;

    // el2 starts (and caches) the uri-ok request.
    el2.uri = 'uri-ok';
    await el2.updateComplete;

    // el1 starts a uri-fail request...
    el1.uri = 'uri-fail';
    await el1.updateComplete;
    // ...then moves on to uri-ok (cache hit, shares el2's in-flight
    // promise) before the uri-fail request has settled.
    el1.uri = 'uri-ok';
    await el1.updateComplete;

    // The stale uri-fail request now rejects. By this point `this.uri` on
    // el1 is 'uri-ok', not 'uri-fail'.
    responses.get('uri-fail')!.reject(new Error('network error'));
    await new Promise(r => setTimeout(r, 20));

    responses.get('uri-ok')!.resolve(['ok']);
    await vi.waitFor(() => expect(optionValues(el2)).toEqual(['ok']));

    // A fresh element requesting uri-ok should hit the cache (uri-ok's ref
    // count never dropped to 0, since el2 still holds it) rather than
    // refetch - proving the failed uri-fail request didn't delete uri-ok's
    // still-needed cache entry.
    let fetchCount = 0;
    document.body.insertAdjacentHTML(
      'beforeend',
      '<yatl-remote-options id="el3"></yatl-remote-options>',
    );
    const el3 = document.querySelector<YatlRemoteOptions>('#el3')!;
    el3.fetchClient = uri => {
      fetchCount++;
      return responses.get(uri)!.promise;
    };
    el3.uri = 'uri-ok';
    await el3.updateComplete;
    await vi.waitFor(() => expect(optionValues(el3)).toEqual(['ok']));

    expect(fetchCount).toBe(0);
  });
});
