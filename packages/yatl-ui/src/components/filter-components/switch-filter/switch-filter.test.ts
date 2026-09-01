import { describe, expect, test } from 'vitest';
import { UnspecifiedRecord, YatlTableController } from '@timlassiter11/yatl';

import '../../../index';
import { YatlSwitchFilter } from './switch-filter';

function createController() {
  const controller = new YatlTableController<UnspecifiedRecord>();
  controller.rowIdCallback = row => row.id;
  controller.columns = [{ field: 'id' }, { field: 'status' }];
  controller.data = [
    { id: 1, status: 'active' },
    { id: 2, status: 'inactive' },
  ];
  return controller;
}

async function renderFilter(
  controller: YatlTableController<UnspecifiedRecord>,
) {
  document.body.innerHTML =
    '<yatl-switch-filter field="status"></yatl-switch-filter>';
  const el = document.querySelector<YatlSwitchFilter>('yatl-switch-filter')!;
  el.controller = controller;
  await el.updateComplete;
  return el;
}

describe('YatlSwitchFilter', () => {
  test('externally clearing filters actually clears an unchecked switch with an offValue', async () => {
    const controller = createController();
    const el = await renderFilter(controller);

    el.onValue = 'active';
    el.offValue = 'inactive';
    await el.updateComplete;

    // Unchecked by default, so offValue is currently applied.
    expect(controller.filters?.status).toBe('inactive');

    // Simulate the table-view "Clear Filters" button.
    controller.filters = null;
    await el.updateComplete;

    expect(
      (controller.filters as Record<string, unknown> | null)?.status,
    ).toBeUndefined();
    expect(el.value).toBeUndefined();
  });

  test('externally clearing filters actually clears a checked-by-default switch', async () => {
    const controller = createController();
    document.body.innerHTML =
      '<yatl-switch-filter field="status" checked></yatl-switch-filter>';
    const el = document.querySelector<YatlSwitchFilter>('yatl-switch-filter')!;
    el.onValue = 'active';
    el.offValue = 'inactive';
    el.controller = controller;
    await el.updateComplete;

    expect(controller.filters?.status).toBe('active');

    controller.filters = null;
    await el.updateComplete;

    expect(
      (controller.filters as Record<string, unknown> | null)?.status,
    ).toBeUndefined();
    expect(el.value).toBeUndefined();
  });
});
