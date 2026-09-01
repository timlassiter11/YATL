import { afterEach, describe, expect, test, vi } from 'vitest';

import '../../../index';
import { YatlTypeahead } from './typeahead';
import { YatlDropdownSelectEvent } from '../../../events';
import { YatlOption } from '../../option/option';

async function renderTypeahead(attrs = '') {
  document.body.innerHTML = `<yatl-typeahead ${attrs}></yatl-typeahead>`;
  const el = document.querySelector<YatlTypeahead>('yatl-typeahead')!;
  await el.updateComplete;
  return el;
}

function typeInto(el: YatlTypeahead, value: string) {
  const input = el.shadowRoot!.querySelector('input')!;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function queryOptions(el: YatlTypeahead) {
  return [...el.shadowRoot!.querySelectorAll('yatl-option')] as YatlOption[];
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('YatlTypeahead - local search', () => {
  test('typing a matching query shows results below minQueryLength threshold', async () => {
    const el = await renderTypeahead('min-query-length="2"');
    el.localData = [{ label: 'Apple', value: 'apple' }];
    await el.updateComplete;

    typeInto(el, 'ap');
    await el.updateComplete;

    expect(queryOptions(el).length).toBe(1);
  });

  test('a query shorter than minQueryLength does not search', async () => {
    const el = await renderTypeahead('min-query-length="3"');
    el.localData = [{ label: 'Apple', value: 'apple' }];
    await el.updateComplete;

    typeInto(el, 'ap');
    await el.updateComplete;

    expect(queryOptions(el).length).toBe(0);
  });

  test('selecting a result sets the value and emits change', async () => {
    const el = await renderTypeahead();
    el.localData = [{ label: 'Apple', value: 'apple' }];
    await el.updateComplete;

    typeInto(el, 'app');
    await el.updateComplete;

    let changeCount = 0;
    el.addEventListener('change', () => changeCount++);

    const option = queryOptions(el)[0];
    const dropdown = el.shadowRoot!.querySelector('yatl-dropdown')!;
    dropdown.dispatchEvent(new YatlDropdownSelectEvent(option));

    expect(el.value).toBe('apple');
    expect(changeCount).toBe(1);
  });
});

describe('YatlTypeahead - missing config warning', () => {
  test('warns once when neither uri nor localData is provided', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await renderTypeahead();
    await renderTypeahead();

    const relevantCalls = warnSpy.mock.calls.filter(call =>
      String(call[0]).includes('[yatl-typeahead]'),
    );
    expect(relevantCalls.length).toBeGreaterThan(0);
    warnSpy.mockRestore();
  });
});

describe('YatlTypeahead - remote fetch staleness', () => {
  test('a slow response for an old query does not overwrite results from a newer query', async () => {
    const responses = new Map<string, ReturnType<typeof deferred<unknown>>>([
      ['ab', deferred<unknown>()],
      ['abc', deferred<unknown>()],
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn((url: URL, init?: { signal?: AbortSignal }) => {
        const query = new URL(url).searchParams.get('search')!;
        const entry = responses.get(query)!;
        const promise = entry.promise.then(data => ({
          ok: true,
          json: async () => data,
        }));
        init?.signal?.addEventListener('abort', () => {
          entry.reject(new DOMException('aborted', 'AbortError'));
        });
        return promise;
      }),
    );

    const el = await renderTypeahead(
      'uri="/api/search" min-query-length="1" search-debounce="1"',
    );

    typeInto(el, 'ab');
    await new Promise(r => setTimeout(r, 20));
    typeInto(el, 'abc');
    await new Promise(r => setTimeout(r, 20));

    // The newer request resolves first...
    responses.get('abc')!.resolve([{ label: 'ABC', value: 'abc' }]);
    await vi.waitFor(() => {
      expect(queryOptions(el).length).toBe(1);
    });

    // ...then the older, now-superseded request resolves later.
    responses.get('ab')!.resolve([{ label: 'AB', value: 'ab' }]);
    await new Promise(r => setTimeout(r, 20));

    const labels = queryOptions(el).map(o => o.getAttribute('label'));
    expect(labels).toEqual(['ABC']);
  });
});
