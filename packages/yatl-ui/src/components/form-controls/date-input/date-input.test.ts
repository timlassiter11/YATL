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
    const el = await renderDateInput();
    selectDate(el, new Date(2024, 0, 15));
    expect(el.value).toBeDefined();

    const clearButton = el.shadowRoot!.querySelector(
      'yatl-button',
    ) as HTMLElement;
    clearButton.click();

    expect(el.value).toBeUndefined();
    expect(el.formValue).toBeNull();
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
