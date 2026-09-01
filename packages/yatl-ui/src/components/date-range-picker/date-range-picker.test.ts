import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlDateRangePicker } from './date-range-picker';
import { YatlDateGrid } from '../date-grid/date-grid';
import { YatlDateSelected } from '../../events';

async function renderPicker() {
  document.body.innerHTML = '<yatl-date-range-picker></yatl-date-range-picker>';
  const el = document.querySelector<YatlDateRangePicker>(
    'yatl-date-range-picker',
  )!;
  await el.updateComplete;
  return el;
}

function pickDate(el: YatlDateRangePicker, date: Date) {
  const grid = el.shadowRoot!.querySelector('yatl-date-grid') as YatlDateGrid;
  grid.dispatchEvent(new YatlDateSelected(date));
}

function clickModeButton(el: YatlDateRangePicker, label: 'Start' | 'End') {
  const button = [...el.shadowRoot!.querySelectorAll('yatl-button')].find(
    b => b.textContent?.trim() === label,
  ) as HTMLElement;
  button.click();
}

describe('YatlDateRangePicker - two-click range selection', () => {
  test('the first click sets startDate and switches to end mode', async () => {
    const el = await renderPicker();
    const a = new Date(2024, 0, 1);

    pickDate(el, a);
    await el.updateComplete;

    expect(el.startDate?.getTime()).toBe(a.getTime());
    expect(el.endDate).toBeUndefined();
  });

  test('the second click sets endDate and a subsequent click starts a new range', async () => {
    const el = await renderPicker();
    const a = new Date(2024, 0, 1);
    const b = new Date(2024, 0, 10);
    const c = new Date(2024, 0, 20);

    pickDate(el, a);
    await el.updateComplete;
    pickDate(el, b);
    await el.updateComplete;

    expect(el.startDate?.getTime()).toBe(a.getTime());
    expect(el.endDate?.getTime()).toBe(b.getTime());

    // A third click should start a fresh range, not extend the old one.
    pickDate(el, c);
    await el.updateComplete;

    expect(el.startDate?.getTime()).toBe(c.getTime());
    expect(el.endDate).toBeUndefined();
  });

  test('picking an end date before the start date swaps them', async () => {
    const el = await renderPicker();
    const later = new Date(2024, 0, 20);
    const earlier = new Date(2024, 0, 5);

    pickDate(el, later);
    await el.updateComplete;
    pickDate(el, earlier);
    await el.updateComplete;

    expect(el.startDate?.getTime()).toBe(earlier.getTime());
    expect(el.endDate?.getTime()).toBe(later.getTime());
  });

  test('clicking the same start date again clears it', async () => {
    const el = await renderPicker();
    const a = new Date(2024, 0, 1);

    pickDate(el, a);
    await el.updateComplete;
    expect(el.startDate).toBeDefined();

    clickModeButton(el, 'Start');
    await el.updateComplete;
    pickDate(el, a);
    await el.updateComplete;

    expect(el.startDate).toBeUndefined();
  });

  test('clicking the same end date again clears it', async () => {
    const el = await renderPicker();
    const a = new Date(2024, 0, 1);
    const b = new Date(2024, 0, 10);

    pickDate(el, a);
    await el.updateComplete;
    pickDate(el, b);
    await el.updateComplete;
    expect(el.endDate).toBeDefined();

    pickDate(el, b);
    await el.updateComplete;

    expect(el.endDate).toBeUndefined();
  });

  test('fires change on every selection', async () => {
    const el = await renderPicker();
    let changeCount = 0;
    el.addEventListener('change', () => changeCount++);

    pickDate(el, new Date(2024, 0, 1));
    await el.updateComplete;
    pickDate(el, new Date(2024, 0, 10));
    await el.updateComplete;

    expect(changeCount).toBe(2);
  });
});

describe('YatlDateRangePicker - manual mode switching', () => {
  test('picking a new start date always clears the end date, even via the mode buttons', async () => {
    const el = await renderPicker();
    const a = new Date(2024, 0, 1);
    const b = new Date(2024, 0, 10);
    const c = new Date(2024, 0, 5);

    pickDate(el, a);
    await el.updateComplete;
    pickDate(el, b);
    await el.updateComplete;
    expect(el.startDate?.getTime()).toBe(a.getTime());
    expect(el.endDate?.getTime()).toBe(b.getTime());

    // A full range is already picked (mode auto-reset to 'start'), so
    // this is already start mode - picking a new start date starts a
    // fresh range, clearing the old end date.
    clickModeButton(el, 'Start');
    await el.updateComplete;
    pickDate(el, c);
    await el.updateComplete;

    expect(el.startDate?.getTime()).toBe(c.getTime());
    expect(el.endDate).toBeUndefined();
  });

  test('the End button lets the user adjust just the end date without touching start', async () => {
    const el = await renderPicker();
    const a = new Date(2024, 0, 1);
    const b = new Date(2024, 0, 10);
    const d = new Date(2024, 0, 15);

    pickDate(el, a);
    await el.updateComplete;
    pickDate(el, b);
    await el.updateComplete;
    expect(el.startDate?.getTime()).toBe(a.getTime());
    expect(el.endDate?.getTime()).toBe(b.getTime());

    // Mode auto-reset to 'start' after a full range - switch back to
    // 'end' to adjust just the end date.
    clickModeButton(el, 'End');
    await el.updateComplete;
    pickDate(el, d);
    await el.updateComplete;

    expect(el.startDate?.getTime()).toBe(a.getTime());
    expect(el.endDate?.getTime()).toBe(d.getTime());
  });
});
