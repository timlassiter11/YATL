import { describe, expect, test } from 'vitest';
import { UnspecifiedRecord, YatlTableController } from '@timlassiter11/yatl';

import '../../../index';
import { YatlSelectFilter } from '../select-filter/select-filter';

function createController() {
  const controller = new YatlTableController<UnspecifiedRecord>();
  controller.rowIdCallback = row => row.id;
  controller.columns = [{ field: 'id' }, { field: 'user.name' }];
  controller.data = [
    { id: 1, user: { name: 'Bob' } },
    { id: 2, user: { name: 'Alice' } },
  ];
  return controller;
}

describe('YatlBaseFilter - dotted field names', () => {
  test('stores the filter as a flat dotted key, not a nested object, matching the Filters<T> contract', async () => {
    const controller = createController();

    document.body.innerHTML =
      '<yatl-select-filter field="user.name"></yatl-select-filter>';
    const filter =
      document.querySelector<YatlSelectFilter>('yatl-select-filter')!;
    filter.controller = controller;
    await filter.updateComplete;

    filter.value = 'Bob';
    await filter.updateComplete;

    expect(controller.filters).toEqual({ 'user.name': 'Bob' });
  });

  test('actually filters rows by a dotted (nested) field', async () => {
    const controller = createController();

    document.body.innerHTML =
      '<yatl-select-filter field="user.name"></yatl-select-filter>';
    const filter =
      document.querySelector<YatlSelectFilter>('yatl-select-filter')!;
    filter.controller = controller;
    await filter.updateComplete;

    filter.value = 'Bob';
    await filter.updateComplete;

    expect(controller.filteredData.map(r => r.id)).toEqual([1]);
  });

  test('clearing all filters externally still resets a dotted-field filter', async () => {
    const controller = createController();

    document.body.innerHTML =
      '<yatl-select-filter field="user.name"></yatl-select-filter>';
    const filter =
      document.querySelector<YatlSelectFilter>('yatl-select-filter')!;
    filter.controller = controller;
    await filter.updateComplete;

    filter.value = 'Bob';
    await filter.updateComplete;
    expect(controller.filteredData.length).toBe(1);

    controller.filters = null;
    await filter.updateComplete;

    expect(filter.value).toBeUndefined();
    expect(controller.filteredData.length).toBe(2);
  });
});
