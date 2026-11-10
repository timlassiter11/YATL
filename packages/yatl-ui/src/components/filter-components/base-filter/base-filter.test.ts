import { describe, expect, test } from 'vitest';
import { UnspecifiedRecord, YatlTableController } from '@timlassiter11/yatl';

import '../../../index';
import type { YatlSelect } from '../../form-controls/select/select';
import type { YatlOption } from '../../option/option';
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

function renderedOptionValues(filter: YatlSelectFilter) {
  return [
    ...filter.shadowRoot!.querySelectorAll<YatlOption>('yatl-option'),
  ].map(option => option.value);
}

describe('YatlBaseFilter - value attribute', () => {
  test('a value attribute applies the filter once the controller attaches', async () => {
    const controller = createController();

    document.body.innerHTML =
      '<yatl-select-filter field="user.name" value="Bob"></yatl-select-filter>';
    const filter =
      document.querySelector<YatlSelectFilter>('yatl-select-filter')!;
    expect(filter.value).toBe('Bob');

    filter.controller = controller;
    await filter.updateComplete;

    expect(controller.filters).toEqual({ 'user.name': 'Bob' });
    expect(controller.filteredData.map(r => r.id)).toEqual([1]);
  });

  test('a JSON array value attribute is read as an array', async () => {
    document.body.innerHTML =
      '<yatl-select-filter multi field="user.name" value=\'["Bob","Alice"]\'></yatl-select-filter>';
    const filter =
      document.querySelector<YatlSelectFilter>('yatl-select-filter')!;
    expect(filter.value).toEqual(['Bob', 'Alice']);
  });

  test('a number-like value attribute stays a string', async () => {
    document.body.innerHTML =
      '<yatl-select-filter field="id" value="90"></yatl-select-filter>';
    const filter =
      document.querySelector<YatlSelectFilter>('yatl-select-filter')!;
    expect(filter.value).toBe('90');
  });
});

describe('YatlBaseFilter - options', () => {
  test('picking an option keeps the other options', async () => {
    const controller = createController();

    document.body.innerHTML =
      '<yatl-select-filter field="user.name"></yatl-select-filter>';
    const filter =
      document.querySelector<YatlSelectFilter>('yatl-select-filter')!;
    filter.controller = controller;
    await filter.updateComplete;

    filter.value = 'Bob';
    await filter.updateComplete;

    expect(renderedOptionValues(filter)).toEqual(['Alice', 'Bob']);
  });

  test('a value set before the data loads still gets every option', async () => {
    const controller = new YatlTableController<UnspecifiedRecord>();
    controller.rowIdCallback = row => row.id;
    controller.columns = [{ field: 'id' }, { field: 'user.name' }];

    document.body.innerHTML =
      '<yatl-select-filter field="user.name" value="Bob"></yatl-select-filter>';
    const filter =
      document.querySelector<YatlSelectFilter>('yatl-select-filter')!;
    filter.controller = controller;
    await filter.updateComplete;
    expect(renderedOptionValues(filter)).toEqual([]);

    controller.data = [
      { id: 1, user: { name: 'Bob' } },
      { id: 2, user: { name: 'Alice' } },
    ];
    await filter.updateComplete;

    expect(renderedOptionValues(filter)).toEqual(['Alice', 'Bob']);
    expect(controller.filteredData.map(r => r.id)).toEqual([1]);
  });

  test('setting value shows it in the select', async () => {
    const controller = createController();

    document.body.innerHTML =
      '<yatl-select-filter field="user.name"></yatl-select-filter>';
    const filter =
      document.querySelector<YatlSelectFilter>('yatl-select-filter')!;
    filter.controller = controller;
    await filter.updateComplete;

    filter.value = 'Alice';
    await filter.updateComplete;
    const select = filter.shadowRoot!.querySelector<YatlSelect>('yatl-select')!;
    await select.updateComplete;

    expect(select.value).toBe('Alice');
  });
});
