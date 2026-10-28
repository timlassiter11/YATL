import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { YatlTableController } from '@timlassiter11/yatl';

import '../../index';
import { YatlToolbarSearchChange } from '../../events';
import { YatlToolbar } from './toolbar';

interface Row {
  id: number;
  name: string;
}

function createController() {
  const controller = new YatlTableController<Row>();
  controller.rowIdCallback = row => row.id;
  controller.columns = [
    { field: 'id' },
    { field: 'name', sortable: true, searchable: true },
  ];
  controller.data = [
    { id: 1, name: 'Bob' },
    { id: 2, name: 'Alice' },
  ];
  return controller;
}

async function renderToolbar(controller: YatlTableController<Row>) {
  document.body.innerHTML = '<yatl-toolbar></yatl-toolbar>';
  const el = document.querySelector<YatlToolbar<Row>>('yatl-toolbar')!;
  el.controller = controller;
  await el.updateComplete;
  return el;
}

describe('YatlToolbar - search/sort priority toggle', () => {
  test('is disabled with neither a sort nor a search active', async () => {
    const controller = createController();
    const el = await renderToolbar(controller);
    const button = el.shadowRoot!.querySelector(
      '[part="search-sort-priority-toggle"]',
    ) as HTMLButtonElement;

    expect(button).not.toBeNull();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  test('stays disabled with only a sort active, no search', async () => {
    const controller = createController();
    const el = await renderToolbar(controller);

    controller.sort('name', 'asc');
    await el.updateComplete;

    const button = el.shadowRoot!.querySelector(
      '[part="search-sort-priority-toggle"]',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  test('stays disabled with only a search active, no sort', async () => {
    const controller = createController();
    const el = await renderToolbar(controller);

    controller.searchQuery = 'bob';
    await el.updateComplete;

    const button = el.shadowRoot!.querySelector(
      '[part="search-sort-priority-toggle"]',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  test('becomes enabled once both a sort and a search are active', async () => {
    const controller = createController();
    const el = await renderToolbar(controller);

    controller.sort('name', 'asc');
    controller.searchQuery = 'bob';
    await el.updateComplete;

    const button = el.shadowRoot!.querySelector(
      '[part="search-sort-priority-toggle"]',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  test('title reflects the action a click would perform, not the current state', async () => {
    const controller = createController();
    const el = await renderToolbar(controller);
    controller.sort('name', 'asc');
    controller.searchQuery = 'bob';
    await el.updateComplete;

    const button = el.shadowRoot!.querySelector(
      '[part="search-sort-priority-toggle"]',
    ) as HTMLButtonElement;

    expect(button.title).toBe('Prioritize sort');
    controller.searchSortPriority = 'sort';
    await el.updateComplete;
    expect(button.title).toBe('Prioritize relevance');
  });

  test('clicking toggles the controller between score and sort priority', async () => {
    const controller = createController();
    const el = await renderToolbar(controller);
    controller.sort('name', 'asc');
    controller.searchQuery = 'bob';
    await el.updateComplete;

    expect(controller.searchSortPriority).toBe('score');

    const buttonEl = el.shadowRoot!.querySelector(
      '[part="search-sort-priority-toggle"]',
    )!;
    await userEvent.click(buttonEl);
    await el.updateComplete;

    expect(controller.searchSortPriority).toBe('sort');
    expect(buttonEl.getAttribute('aria-pressed')).toBe('true');

    await userEvent.click(buttonEl);
    await el.updateComplete;

    expect(controller.searchSortPriority).toBe('score');
    expect(buttonEl.getAttribute('aria-pressed')).toBe('false');
  });

  test('reflects a sort priority change made elsewhere, not just its own clicks', async () => {
    const controller = createController();
    const el = await renderToolbar(controller);
    controller.sort('name', 'asc');
    await el.updateComplete;

    // Changing it directly on the controller (e.g. from restored storage,
    // or another host) should update the toolbar too, since the toolbar is
    // an attached controller host.
    controller.searchSortPriority = 'sort';
    await el.updateComplete;

    const button = el.shadowRoot!.querySelector(
      '[part="search-sort-priority-toggle"]',
    )!;
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  test('hide-search-sort-priority-toggle removes the button entirely', async () => {
    const controller = createController();
    document.body.innerHTML =
      '<yatl-toolbar hide-search-sort-priority-toggle></yatl-toolbar>';
    const el = document.querySelector<YatlToolbar<Row>>('yatl-toolbar')!;
    el.controller = controller;
    await el.updateComplete;

    const button = el.shadowRoot!.querySelector(
      '[part="search-sort-priority-toggle"]',
    );
    expect(button).toBeNull();
  });
});

describe('YatlToolbar - regex search', () => {
  const regexQuery = String.raw`\r/^b`;

  async function setSearch(
    el: YatlToolbar<Row>,
    value: string,
    type: 'input' | 'change',
  ) {
    const input = el.shadowRoot!.querySelector(
      '[part="search"]',
    ) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event(type));
    await el.updateComplete;
  }

  function getIndicator(el: YatlToolbar<Row>) {
    return el.shadowRoot!.querySelector('[part="search-regex-indicator"]');
  }

  const waitForDebounce = () => new Promise(r => setTimeout(r, 20));

  test('shows no indicator for a text query', async () => {
    const el = await renderToolbar(createController());
    await setSearch(el, 'bob', 'input');
    expect(getIndicator(el)).toBeNull();
  });

  test('shows the indicator and searches as a regex query is typed', async () => {
    const controller = createController();
    const el = await renderToolbar(controller);
    el.searchDebounce = 0;

    await setSearch(el, String.raw`\r/^B`, 'input');
    const indicator = getIndicator(el);
    expect(indicator).not.toBeNull();
    expect(indicator!.getAttribute('slot')).toBe('end');

    await waitForDebounce();
    expect(controller.searchQuery).toBe(String.raw`\r/^B`);
    expect(controller.filteredData.map(row => row.id)).toEqual([1]);
  });

  test('searches once the regex query is committed', async () => {
    const controller = createController();
    const el = await renderToolbar(controller);
    const changeEvents: string[] = [];
    el.addEventListener('yatl-toolbar-search-change', event =>
      changeEvents.push((event as YatlToolbarSearchChange).value),
    );

    await setSearch(el, regexQuery, 'input');
    await setSearch(el, regexQuery, 'change');

    expect(controller.searchQuery).toBe(regexQuery);
    expect(controller.filteredData.map(row => row.id)).toEqual([]);
    expect(changeEvents).toHaveLength(1);
    expect(getIndicator(el)).not.toBeNull();

    await setSearch(el, String.raw`\r/^b/i`, 'change');
    expect(controller.filteredData.map(row => row.id)).toEqual([1]);
  });

  test('does not search an invalid regex and marks the indicator invalid', async () => {
    const controller = createController();
    const el = await renderToolbar(controller);
    let changeEvents = 0;
    el.addEventListener('yatl-toolbar-search-change', () => changeEvents++);

    await setSearch(el, String.raw`\r/(b`, 'change');

    expect(controller.searchQuery).toBe('');
    expect(changeEvents).toBe(0);
    const indicator = getIndicator(el)!;
    expect(indicator.classList.contains('invalid')).toBe(true);
    expect(indicator.getAttribute('label')).toMatch(/^Invalid regex/);
  });

  test('keeps the last valid results while an invalid regex is typed', async () => {
    const controller = createController();
    const el = await renderToolbar(controller);
    el.searchDebounce = 0;

    await setSearch(el, String.raw`\r/^B`, 'input');
    await waitForDebounce();
    await setSearch(el, String.raw`\r/^B(`, 'input');
    await waitForDebounce();

    expect(controller.searchQuery).toBe(String.raw`\r/^B`);
    expect(controller.filteredData.map(row => row.id)).toEqual([1]);
    expect(getIndicator(el)!.classList.contains('invalid')).toBe(true);
  });

  test('an invalid regex cancels a pending search', async () => {
    const controller = createController();
    const el = await renderToolbar(controller);
    el.searchDebounce = 10;

    await setSearch(el, String.raw`\r/^B`, 'input');
    await setSearch(el, String.raw`\r/^B(`, 'input');
    await waitForDebounce();

    expect(controller.searchQuery).toBe('');
  });

  test('leaving regex mode goes back to a text search', async () => {
    const controller = createController();
    const el = await renderToolbar(controller);
    el.searchDebounce = 0;

    await setSearch(el, regexQuery, 'input');
    await setSearch(el, 'bob', 'input');
    await waitForDebounce();

    expect(controller.searchQuery).toBe('bob');
    expect(getIndicator(el)).toBeNull();
  });

  test('shows the indicator for a regex query set on the controller', async () => {
    const controller = createController();
    const el = await renderToolbar(controller);

    controller.searchQuery = regexQuery;
    await el.updateComplete;
    expect(getIndicator(el)).not.toBeNull();

    controller.searchQuery = '';
    await el.updateComplete;
    expect(getIndicator(el)).toBeNull();
  });
});
