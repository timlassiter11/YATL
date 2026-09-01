import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { YatlTableController } from '@timlassiter11/yatl';

import '../../index';
import { YatlToolbar } from './toolbar';

interface Row {
  id: number;
  name: string;
}

function createController() {
  const controller = new YatlTableController<Row>();
  controller.rowIdCallback = row => row.id;
  controller.columns = [{ field: 'id' }, { field: 'name', sortable: true }];
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
