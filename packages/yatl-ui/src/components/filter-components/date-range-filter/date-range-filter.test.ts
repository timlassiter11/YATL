import { describe, expect, test } from 'vitest';
import { UnspecifiedRecord, YatlTableController } from '@timlassiter11/yatl';

import '../../../index';
import { YatlDateRangeFilter } from './date-range-filter';
import { YatlDateRangeInput } from '../../form-controls/date-range-input/date-range-input';

function createController() {
  const controller = new YatlTableController<UnspecifiedRecord>();
  controller.rowIdCallback = row => row.id;
  controller.columns = [{ field: 'id' }, { field: 'date' }];
  controller.data = [
    { id: 1, date: new Date(2024, 0, 1) },
    { id: 2, date: new Date(2024, 0, 15) },
    { id: 3, date: new Date(2024, 1, 1) },
  ];
  return controller;
}

async function renderFilter(
  controller: YatlTableController<UnspecifiedRecord>,
  attrs = '',
) {
  document.body.innerHTML = `<yatl-date-range-filter field="date" ${attrs}></yatl-date-range-filter>`;
  const el = document.querySelector<YatlDateRangeFilter>(
    'yatl-date-range-filter',
  )!;
  el.controller = controller;
  await el.updateComplete;
  return el;
}

function input(el: YatlDateRangeFilter) {
  return el.shadowRoot!.querySelector(
    'yatl-date-range-input',
  ) as YatlDateRangeInput;
}

describe('YatlDateRangeFilter', () => {
  test('applies the initial start-date/end-date attributes as an active filter', async () => {
    const controller = createController();
    await renderFilter(
      controller,
      'start-date="2024-01-01" end-date="2024-01-31"',
    );

    expect(controller.filters?.date).toBeTypeOf('function');
    expect(controller.filteredData.map(r => r.id)).toEqual([1, 2]);
  });

  test('applying only an initial start-date still filters', async () => {
    const controller = createController();
    await renderFilter(controller, 'start-date="2024-01-15"');

    expect(controller.filteredData.map(r => r.id)).toEqual([2, 3]);
  });

  test('changing dates through the input still applies the filter', async () => {
    const controller = createController();
    const el = await renderFilter(controller);

    el.startDate = new Date(2024, 0, 1);
    el.endDate = new Date(2024, 0, 31);
    await el.updateComplete;

    // Simulate the change event the underlying input would fire.
    const input = el.shadowRoot!.querySelector('yatl-date-range-input')!;
    input.dispatchEvent(new Event('change'));
    await el.updateComplete;

    expect(controller.filters?.date).toBeTypeOf('function');
    expect(controller.filteredData.map(r => r.id)).toEqual([1, 2]);
  });
});

describe('YatlDateRangeFilter - min/max from field data', () => {
  test('min/max reflect the actual range of the field', async () => {
    const controller = createController();
    const el = await renderFilter(controller);

    expect(input(el).min).toEqual(new Date(2024, 0, 1));
    expect(input(el).max).toEqual(new Date(2024, 1, 1));
  });

  test('min/max reflect other active filters while no value is set', async () => {
    const controller = createController();
    const el = await renderFilter(controller);

    controller.filters = { ...controller.filters, id: (v: number) => v !== 3 };
    await el.updateComplete;

    // Row 3 (2024-02-01) is filtered out by the other filter, so the max
    // narrows to the remaining rows.
    expect(input(el).min).toEqual(new Date(2024, 0, 1));
    expect(input(el).max).toEqual(new Date(2024, 0, 15));
  });

  test('min/max freeze once a start/end date is picked', async () => {
    const controller = createController();
    const el = await renderFilter(controller, 'start-date="2024-01-15"');

    const frozenMin = input(el).min;
    const frozenMax = input(el).max;
    expect(frozenMin).toEqual(new Date(2024, 0, 1));
    expect(frozenMax).toEqual(new Date(2024, 1, 1));

    // A different filter narrowing filteredData afterwards should not
    // shrink the already-frozen bounds out from under the user.
    controller.filters = { ...controller.filters, id: (v: number) => v !== 3 };
    await el.updateComplete;

    expect(input(el).min).toEqual(frozenMin);
    expect(input(el).max).toEqual(frozenMax);
  });

  test('does not throw and leaves min/max unset without a controller', async () => {
    document.body.innerHTML = '<yatl-date-range-filter field="date">';
    const el = document.querySelector<YatlDateRangeFilter>(
      'yatl-date-range-filter',
    )!;
    await el.updateComplete;

    expect(input(el).min).toBeUndefined();
    expect(input(el).max).toBeUndefined();
  });
});
