import { describe, expect, test } from 'vitest';

import '../../../index';
import { YatlDateInput } from './date-input';
import { YatlDatePicker } from '../../date-picker/date-picker';

async function renderDateInput(attrs = '') {
  document.body.innerHTML = `<yatl-date-input ${attrs}></yatl-date-input>`;
  const el = document.querySelector<YatlDateInput>('yatl-date-input')!;
  await el.updateComplete;
  return el;
}

function selectDate(el: YatlDateInput, date: Date) {
  const picker = el.shadowRoot!.querySelector(
    'yatl-date-picker',
  ) as YatlDatePicker;
  picker.date = date;
  picker.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('YatlDateInput', () => {
  test('picking a date sets value, closes the dropdown, and emits change', async () => {
    const el = await renderDateInput();
    let changeCount = 0;
    el.addEventListener('change', () => changeCount++);

    const picked = new Date(2024, 0, 15);
    selectDate(el, picked);

    expect(el.value?.getTime()).toBe(picked.getTime());
    expect(changeCount).toBe(1);
  });

  test('formValue is a YYYY-MM-DD string', async () => {
    const el = await renderDateInput();
    selectDate(el, new Date(2024, 0, 15));

    expect(el.formValue).toBe('2024-01-15');
  });

  test('the clear button resets value to undefined', async () => {
    const el = await renderDateInput('clearable');
    selectDate(el, new Date(2024, 0, 15));
    expect(el.value).toBeDefined();
    await el.updateComplete;

    const clearButton = el.shadowRoot!.querySelector(
      '[part="clear-button"]',
    ) as HTMLElement;
    clearButton.click();

    expect(el.value).toBeUndefined();
    expect(el.formValue).toBeNull();
  });

  test('there is no clear button unless clearable', async () => {
    const el = await renderDateInput();
    expect(el.shadowRoot!.querySelector('[part="clear-button"]')).toBeNull();
  });

  test('a date before min is invalid', async () => {
    const el = await renderDateInput('min="2024-01-10"');
    selectDate(el, new Date(2024, 0, 5));

    expect(el.checkValidity()).toBe(false);
  });

  test('a date after max is invalid', async () => {
    const el = await renderDateInput('max="2024-01-10"');
    selectDate(el, new Date(2024, 0, 20));

    expect(el.checkValidity()).toBe(false);
  });

  test('a date within min/max is valid', async () => {
    const el = await renderDateInput('min="2024-01-01" max="2024-01-31"');
    selectDate(el, new Date(2024, 0, 15));

    expect(el.checkValidity()).toBe(true);
  });

  test('required is invalid when no date is selected', async () => {
    const el = await renderDateInput('required');
    expect(el.checkValidity()).toBe(false);

    selectDate(el, new Date(2024, 0, 15));
    expect(el.checkValidity()).toBe(true);
  });
});

function segments(el: YatlDateInput) {
  return [...el.shadowRoot!.querySelectorAll<HTMLElement>('[part="segment"]')];
}

/** The segment for month, day or year, wherever the locale puts it */
function segment(el: YatlDateInput, key: 'month' | 'day' | 'year') {
  return segments(el).find(s => s.dataset.key === key)!;
}

async function press(el: YatlDateInput, ...keys: string[]) {
  for (const key of keys) {
    const target = el.shadowRoot!.activeElement as HTMLElement;
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, composed: true }),
    );
    await el.updateComplete;
  }
}

/** Types a whole date, each part in its own segment */
async function typeDate(
  el: YatlDateInput,
  month: string,
  day: string,
  year: string,
) {
  segment(el, 'month').focus();
  await press(el, ...month);
  segment(el, 'day').focus();
  await press(el, ...day);
  segment(el, 'year').focus();
  await press(el, ...year);
}

describe('YatlDateInput - typing', () => {
  test('a value fills the month, day and year segments', async () => {
    const el = await renderDateInput('value="2024-03-09"');
    expect(segment(el, 'month').textContent!.trim()).toBe('03');
    expect(segment(el, 'day').textContent!.trim()).toBe('09');
    expect(segment(el, 'year').textContent!.trim()).toBe('2024');
  });

  test('typing a date sets the value and fires change when focus leaves', async () => {
    document.body.innerHTML = `
      <yatl-date-input></yatl-date-input>
      <button id="after">after</button>`;
    const el = document.querySelector<YatlDateInput>('yatl-date-input')!;
    await el.updateComplete;
    let changes = 0;
    el.addEventListener('change', () => changes++);

    await typeDate(el, '07', '04', '2026');
    expect(el.formValue).toBe('2026-07-04');
    expect(changes).toBe(0);

    document.getElementById('after')!.focus();
    expect(changes).toBe(1);
  });

  test('an impossible date has no value and reports badInput', async () => {
    const el = await renderDateInput();
    await typeDate(el, '02', '30', '2026');
    expect(el.value).toBeUndefined();
    expect(el.checkValidity()).toBe(false);
    expect(el.validity.badInput).toBe(true);
  });

  test('a two digit year is that year, not 19xx', async () => {
    const el = await renderDateInput();
    await typeDate(el, '01', '02', '0099');
    expect(el.value?.getFullYear()).toBe(99);
  });

  test('typed dates are checked against min and max', async () => {
    const el = await renderDateInput('min="2026-01-01" max="2026-12-31"');
    await typeDate(el, '12', '31', '2025');
    expect(el.validity.rangeUnderflow).toBe(true);
    await typeDate(el, '01', '01', '2027');
    expect(el.validity.rangeOverflow).toBe(true);
  });

  test('Today picks today', async () => {
    const el = await renderDateInput();
    const today = el.shadowRoot!.querySelector<HTMLElement>(
      '[part="today-button"]',
    )!;
    today.click();
    await el.updateComplete;
    const now = new Date();
    expect(el.value?.toDateString()).toBe(now.toDateString());
  });

  test('Today is disabled when today is outside min and max', async () => {
    const el = await renderDateInput('max="2000-01-01"');
    const today = el.shadowRoot!.querySelector<HTMLButtonElement>(
      '[part="today-button"]',
    )!;
    expect(today.disabled).toBe(true);
  });
});
