import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlDatePicker } from './date-picker';
import { YatlDateGrid } from '../date-grid/date-grid';
import { YatlDateSelected } from '../../events';

async function renderPicker() {
  document.body.innerHTML = '<yatl-date-picker></yatl-date-picker>';
  const el = document.querySelector<YatlDatePicker>('yatl-date-picker')!;
  await el.updateComplete;
  return el;
}

describe('YatlDatePicker', () => {
  test('selecting a date in the grid sets date and fires change', async () => {
    const el = await renderPicker();
    let changeCount = 0;
    el.addEventListener('change', () => changeCount++);

    const grid = el.shadowRoot!.querySelector('yatl-date-grid') as YatlDateGrid;
    const picked = new Date(2024, 0, 15);
    grid.dispatchEvent(new YatlDateSelected(picked));

    expect(el.date?.getTime()).toBe(picked.getTime());
    expect(changeCount).toBe(1);
  });
});
