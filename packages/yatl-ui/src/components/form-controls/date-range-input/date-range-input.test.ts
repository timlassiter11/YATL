import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';

import '../../../index';
import { YatlDateRangeInput } from './date-range-input';
import { YatlDateRangePicker } from '../../date-range-picker/date-range-picker';

async function renderDateRangeInput(attrs = '') {
  document.body.innerHTML = `<yatl-date-range-input ${attrs}></yatl-date-range-input>`;
  const el = document.querySelector<YatlDateRangeInput>(
    'yatl-date-range-input',
  )!;
  await el.updateComplete;
  return el;
}

function openDropdown(el: YatlDateRangeInput) {
  const trigger = el.shadowRoot!.querySelector('button')!;
  trigger.click();
}

function isOpen(el: YatlDateRangeInput) {
  return el.shadowRoot!.querySelector('yatl-dropdown')!.open;
}

function pickDraftRange(el: YatlDateRangeInput, start: Date, end: Date) {
  const picker = el.shadowRoot!.querySelector(
    'yatl-date-range-picker',
  ) as YatlDateRangePicker;
  picker.startDate = start;
  picker.endDate = end;
  picker.dispatchEvent(new Event('change', { bubbles: true }));
}

function clickButtonByTitle(el: YatlDateRangeInput, title: string) {
  const button = [...el.shadowRoot!.querySelectorAll('yatl-button')].find(
    b => b.getAttribute('title') === title,
  ) as HTMLElement;
  button.click();
}

describe('YatlDateRangeInput - apply/cancel flow', () => {
  test('Apply commits the draft range and emits change', async () => {
    const el = await renderDateRangeInput();
    let changeCount = 0;
    el.addEventListener('change', () => changeCount++);

    openDropdown(el);
    await el.updateComplete;
    pickDraftRange(el, new Date(2024, 0, 1), new Date(2024, 0, 10));
    await el.updateComplete;
    clickButtonByTitle(el, 'Apply');
    await el.updateComplete;

    expect(el.startDate?.getTime()).toBe(new Date(2024, 0, 1).getTime());
    expect(el.endDate?.getTime()).toBe(new Date(2024, 0, 10).getTime());
    expect(isOpen(el)).toBe(false);
    expect(changeCount).toBe(1);
  });

  test('Cancel discards the draft and leaves the committed value untouched', async () => {
    const el = await renderDateRangeInput(
      'start-date="2024-01-01" end-date="2024-01-10"',
    );
    let changeCount = 0;
    el.addEventListener('change', () => changeCount++);

    openDropdown(el);
    await el.updateComplete;
    pickDraftRange(el, new Date(2024, 1, 1), new Date(2024, 1, 10));
    await el.updateComplete;
    clickButtonByTitle(el, 'Cancel');
    await el.updateComplete;

    expect(el.startDate?.getTime()).toBe(new Date(2024, 0, 1).getTime());
    expect(el.endDate?.getTime()).toBe(new Date(2024, 0, 10).getTime());
    expect(isOpen(el)).toBe(false);
    expect(changeCount).toBe(0);
  });

  test('reopening after a cancel starts the draft from the committed value again', async () => {
    const el = await renderDateRangeInput(
      'start-date="2024-01-01" end-date="2024-01-10"',
    );

    openDropdown(el);
    await el.updateComplete;
    pickDraftRange(el, new Date(2024, 1, 1), new Date(2024, 1, 10));
    await el.updateComplete;
    clickButtonByTitle(el, 'Cancel');
    await el.updateComplete;

    openDropdown(el);
    await el.updateComplete;
    const picker = el.shadowRoot!.querySelector(
      'yatl-date-range-picker',
    ) as YatlDateRangePicker;

    expect(picker.startDate?.getTime()).toBe(new Date(2024, 1, 1).getTime());
    expect(picker.endDate?.getTime()).toBe(new Date(2024, 1, 10).getTime());
  });

  test('Clear resets the value and closes without needing Apply', async () => {
    const el = await renderDateRangeInput(
      'start-date="2024-01-01" end-date="2024-01-10"',
    );
    let changeCount = 0;
    el.addEventListener('change', () => changeCount++);

    openDropdown(el);
    await el.updateComplete;
    clickButtonByTitle(el, 'Clear dates');
    await el.updateComplete;

    expect(el.value).toBeUndefined();
    expect(isOpen(el)).toBe(false);
    expect(changeCount).toBe(1);
  });
});

describe('YatlDateRangeInput - validity', () => {
  test('a start date after the end date is invalid', async () => {
    const el = await renderDateRangeInput(
      'start-date="2024-01-20" end-date="2024-01-01"',
    );

    expect(el.checkValidity()).toBe(false);
  });

  test('a range before min is invalid', async () => {
    const el = await renderDateRangeInput(
      'min="2024-01-10" start-date="2024-01-01" end-date="2024-01-05"',
    );

    expect(el.checkValidity()).toBe(false);
  });

  test('a range after max is invalid', async () => {
    const el = await renderDateRangeInput(
      'max="2024-01-10" start-date="2024-01-15" end-date="2024-01-20"',
    );

    expect(el.checkValidity()).toBe(false);
  });

  test('required is invalid with no range selected', async () => {
    const el = await renderDateRangeInput('required');
    expect(el.checkValidity()).toBe(false);
  });
});

describe('YatlDateRangeInput - form reset', () => {
  test('form reset restores the initially-rendered range', async () => {
    document.body.innerHTML = `
      <form>
        <yatl-date-range-input start-date="2024-01-01" end-date="2024-01-10"></yatl-date-range-input>
      </form>
    `;
    const form = document.querySelector('form')!;
    const el = document.querySelector<YatlDateRangeInput>(
      'yatl-date-range-input',
    )!;
    await el.updateComplete;

    openDropdown(el);
    await el.updateComplete;
    pickDraftRange(el, new Date(2024, 5, 1), new Date(2024, 5, 10));
    await el.updateComplete;
    clickButtonByTitle(el, 'Apply');
    expect(el.startDate?.getMonth()).toBe(5);

    form.reset();

    expect(el.startDate?.getTime()).toBe(new Date(2024, 0, 1).getTime());
    expect(el.endDate?.getTime()).toBe(new Date(2024, 0, 10).getTime());
  });
});

function segment(el: YatlDateRangeInput, key: string) {
  return el.shadowRoot!.querySelector<HTMLElement>(
    `[part="segment"][data-key="${key}"]`,
  )!;
}

async function press(el: YatlDateRangeInput, ...keys: string[]) {
  for (const key of keys) {
    const target = el.shadowRoot!.activeElement as HTMLElement;
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, composed: true }),
    );
    await el.updateComplete;
  }
}

async function typeDate(
  el: YatlDateRangeInput,
  prefix: 'start' | 'end',
  month: string,
  day: string,
  year: string,
) {
  segment(el, `${prefix}Month`).focus();
  await press(el, ...month);
  segment(el, `${prefix}Day`).focus();
  await press(el, ...day);
  segment(el, `${prefix}Year`).focus();
  await press(el, ...year);
}

describe('YatlDateRangeInput - typing', () => {
  test('typing both dates sets the range', async () => {
    const el = await renderDateRangeInput();
    await typeDate(el, 'start', '11', '01', '2026');
    await typeDate(el, 'end', '11', '30', '2026');
    expect(el.startDate?.getTime()).toBe(new Date(2026, 10, 1).getTime());
    expect(el.endDate?.getTime()).toBe(new Date(2026, 10, 30).getTime());
    expect(el.checkValidity()).toBe(true);
  });

  test('only a start date is an open range', async () => {
    const el = await renderDateRangeInput();
    await typeDate(el, 'start', '11', '01', '2026');
    expect(el.startDate?.getTime()).toBe(new Date(2026, 10, 1).getTime());
    expect(el.endDate).toBeUndefined();
    expect(el.checkValidity()).toBe(true);
  });

  test('a partly typed end date is incomplete', async () => {
    const el = await renderDateRangeInput();
    await typeDate(el, 'start', '11', '01', '2026');
    segment(el, 'endMonth').focus();
    await press(el, '1', '2');
    expect(el.value).toBeUndefined();
    expect(el.validity.badInput).toBe(true);
  });

  test('setting startDate from code updates the segments', async () => {
    const el = await renderDateRangeInput();
    el.startDate = new Date(2026, 2, 4);
    await el.updateComplete;
    expect(segment(el, 'startMonth').textContent!.trim()).toBe('03');
    expect(segment(el, 'startDay').textContent!.trim()).toBe('04');
    expect(segment(el, 'endMonth').textContent!.trim()).toBe('mm');
  });

  test('a read-only range shows the formatted text', async () => {
    const el = await renderDateRangeInput('start-date="2026-11-01" readonly');
    const input = el.shadowRoot!.querySelector('#input')!;
    expect(input.textContent!.trim()).toMatch(/^After /);
  });
});

describe('YatlDateRangeInput - change from typing', () => {
  test('a typed range fires change once focus leaves, even via the calendar button', async () => {
    document.body.innerHTML = `
      <yatl-date-range-input></yatl-date-range-input>
      <button id="after">after</button>`;
    const el = document.querySelector<YatlDateRangeInput>(
      'yatl-date-range-input',
    )!;
    await el.updateComplete;
    let changes = 0;
    el.addEventListener('change', () => changes++);

    el.shadowRoot!.querySelector<HTMLElement>('[part="segment"]')!.focus();
    await userEvent.keyboard('0101202401102024');
    await el.updateComplete;
    expect(el.startDate?.getTime()).toBe(new Date(2024, 0, 1).getTime());
    expect(el.endDate?.getTime()).toBe(new Date(2024, 0, 10).getTime());
    expect(changes).toBe(0);

    // Tab to the calendar button (still inside), then out
    await userEvent.tab();
    expect(changes).toBe(0);
    document.getElementById('after')!.focus();
    await el.updateComplete;
    expect(changes).toBe(1);
  });
});

describe('YatlDateRangeInput - Enter', () => {
  test('Enter fires change for a typed range, once', async () => {
    const el = await renderDateRangeInput();
    let changes = 0;
    el.addEventListener('change', () => changes++);

    el.shadowRoot!.querySelector<HTMLElement>('[part="segment"]')!.focus();
    await userEvent.keyboard('0101202401102024');
    await userEvent.keyboard('{Enter}');
    expect(changes).toBe(1);

    // Nothing new to commit, so neither Enter nor leaving fires again
    await userEvent.keyboard('{Enter}');
    (document.activeElement as HTMLElement | null)?.blur();
    el.blur();
    await el.updateComplete;
    expect(changes).toBe(1);
  });
});
