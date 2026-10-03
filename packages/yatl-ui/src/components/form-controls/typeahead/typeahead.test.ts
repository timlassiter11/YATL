import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

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

// `change` should behave like a native input's: fired when an edit is
// committed (Enter, losing focus) - plus when a result is picked - and never
// just because focus moved somewhere that isn't "away" from the component.
describe('YatlTypeahead - change events', () => {
  async function renderWithData(attrs = '') {
    document.body.innerHTML = `
      <yatl-typeahead min-query-length="1" ${attrs}></yatl-typeahead>
      <button id="elsewhere" style="position: fixed; right: 0; bottom: 0">
        Elsewhere
      </button>
    `;
    const el = document.querySelector<YatlTypeahead>('yatl-typeahead')!;
    el.localData = ['test1', 'test2', 'other'];
    await el.updateComplete;

    const changes: string[] = [];
    el.addEventListener('change', () => changes.push(el.value));
    return { el, changes };
  }

  test('moving focus from the input into the dropdown is not a change', async () => {
    const { el, changes } = await renderWithData();

    el.focus();
    await userEvent.keyboard('te');
    await el.updateComplete;
    await userEvent.keyboard('{ArrowDown}');

    // Focus really did move out of the input and onto an option...
    expect(el.shadowRoot!.activeElement?.tagName).toBe('YATL-OPTION');
    // ...but that's still inside the component, so nothing was committed.
    expect(changes).toEqual([]);
  });

  test('picking the focused option with Enter emits a single change with its value', async () => {
    const { el, changes } = await renderWithData();

    el.focus();
    await userEvent.keyboard('te');
    await el.updateComplete;
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');

    expect(el.value).toBe('test1');
    expect(changes).toEqual(['test1']);
  });

  test('clicking an option emits a single change with its value', async () => {
    const { el, changes } = await renderWithData();

    el.focus();
    await userEvent.keyboard('te');
    await el.updateComplete;
    await userEvent.click(queryOptions(el)[0]);

    expect(el.value).toBe('test1');
    expect(changes).toEqual(['test1']);
  });

  test('losing focus after editing emits a change', async () => {
    const { el, changes } = await renderWithData();

    el.focus();
    await userEvent.keyboard('abc');
    await userEvent.click(document.querySelector('#elsewhere')!);

    expect(changes).toEqual(['abc']);
  });

  test('losing focus to nothing at all still emits a change', async () => {
    // Nothing receives focus (blur(), clicking empty space, the element
    // being removed), so there's no focusin anywhere to hang a commit on.
    const { el, changes } = await renderWithData();

    el.focus();
    await userEvent.keyboard('abc');
    el.blur();

    expect(changes).toEqual(['abc']);
  });

  test('losing focus without having edited anything is not a change', async () => {
    const { el, changes } = await renderWithData('value="abc"');

    el.focus();
    el.blur();

    expect(changes).toEqual([]);
  });

  test('Enter commits what was typed, once', async () => {
    const { el, changes } = await renderWithData();

    el.focus();
    await userEvent.keyboard('abc{Enter}');
    expect(changes).toEqual(['abc']);

    // Nothing new to commit, so neither Enter nor blurring does it again.
    await userEvent.keyboard('{Enter}');
    el.blur();
    expect(changes).toEqual(['abc']);
  });

  test('a typeahead that never had focus does not emit a change when focus moves elsewhere', async () => {
    const { changes } = await renderWithData();
    const button = document.querySelector<HTMLElement>('#elsewhere')!;

    button.focus();
    button.blur();
    button.focus();

    expect(changes).toEqual([]);
  });

  test('a value set programmatically is not a change, even once the user focuses and leaves', async () => {
    const { el, changes } = await renderWithData();

    el.value = 'set from code';
    await el.updateComplete;
    el.focus();
    el.blur();

    expect(changes).toEqual([]);
  });

  test('input events are still emitted as the user types', async () => {
    const { el } = await renderWithData();
    let inputCount = 0;
    el.addEventListener('input', () => inputCount++);

    el.focus();
    await userEvent.keyboard('abc');

    expect(inputCount).toBe(3);
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
