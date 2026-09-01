import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlTableView } from './table-view';

interface Row {
  id: number;
  name: string;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

async function renderTableView() {
  document.body.innerHTML = '<yatl-table-view></yatl-table-view>';
  const el = document.querySelector<YatlTableView<Row>>('yatl-table-view')!;
  el.columns = [{ field: 'id' }, { field: 'name' }];
  el.data = [{ id: 1, name: 'initial' }];
  await el.updateComplete;
  return el;
}

describe('YatlTableView - reloadData', () => {
  test('a slow reload that resolves after a newer one does not overwrite fresher data', async () => {
    const el = await renderTableView();

    const first = deferred<Row[]>();
    const second = deferred<Row[]>();
    const calls: (typeof first)[] = [first, second];
    let callIndex = 0;
    el.fetchTask = () => calls[callIndex++].promise;

    // Simulate rapid double-clicking the (silent, never-disabled) reload
    // button: kick off two overlapping reloads before either resolves.
    const reload1 = el.reloadData('reload', true);
    const reload2 = el.reloadData('reload', true);

    // The second (newer) request resolves first...
    second.resolve([{ id: 2, name: 'fresh' }]);
    await reload2;
    // ...then the first (older, now-stale) request resolves later.
    first.resolve([{ id: 1, name: 'stale' }]);
    await reload1;

    expect(el.data.map(r => r.name)).toEqual(['fresh']);
  });

  test('a stale non-silent reload finishing does not clear loading while a newer one is still in flight', async () => {
    const el = await renderTableView();

    const first = deferred<Row[]>();
    const second = deferred<Row[]>();
    const calls: (typeof first)[] = [first, second];
    let callIndex = 0;
    el.fetchTask = () => calls[callIndex++].promise;

    const reload1 = el.reloadData('reload', false);
    const reload2 = el.reloadData('reload', false);

    // The older request resolves first, but the newer one is still
    // in flight - loading should stay true.
    first.resolve([{ id: 1, name: 'stale' }]);
    await reload1;
    expect(el.loading).toBe(true);

    second.resolve([{ id: 2, name: 'fresh' }]);
    await reload2;
    expect(el.loading).toBe(false);
  });
});

describe('YatlTableView - sidebar layout', () => {
  test('slotted sidebar content does not scroll on its own - only the sidebar as a whole does', async () => {
    // yatl-card defaults to height: 100%, which without an override here
    // would mean 100% of the sidebar itself, squeezing the card into less
    // space than its own content needs and forcing it to scroll
    // internally on top of the sidebar's own scrollbar.
    document.body.innerHTML = `
      <yatl-table-view style="display: block; height: 300px;">
        <div slot="sidebar-start" style="min-height: 150px;">other sidebar content</div>
        <yatl-card slot="sidebar-end">
          <div style="min-height: 900px;">tall content</div>
        </yatl-card>
      </yatl-table-view>
    `;
    const el = document.querySelector<YatlTableView<Row>>('yatl-table-view')!;
    el.columns = [{ field: 'id' }, { field: 'name' }];
    el.data = [{ id: 1, name: 'initial' }];
    await el.updateComplete;

    const card = el.querySelector('yatl-card[slot="sidebar-end"]')!;
    await (card as unknown as { updateComplete: Promise<unknown> })
      .updateComplete;

    const sidebar = el.shadowRoot!.querySelector(
      '[part="sidebar"]',
    ) as HTMLElement;
    const cardBody = card.shadowRoot!.querySelector(
      '[part="body"]',
    ) as HTMLElement;

    // The sidebar as a whole is expected to overflow and scroll...
    expect(sidebar.scrollHeight).toBeGreaterThan(sidebar.clientHeight);
    // ...but the card's own body should size to its content, not scroll.
    expect(cardBody.scrollHeight).toBe(cardBody.clientHeight);
  });
});
