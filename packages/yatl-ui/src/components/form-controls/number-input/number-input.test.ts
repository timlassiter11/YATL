import { describe, expect, test } from 'vitest';

import '../../../index';
import { YatlNumberInput } from './number-input';

async function renderNumberInput(attrs = '') {
  document.body.innerHTML = `<yatl-number-input ${attrs}></yatl-number-input>`;
  const el = document.querySelector<YatlNumberInput>('yatl-number-input')!;
  await el.updateComplete;
  return el;
}

describe('YatlNumberInput', () => {
  test('typing updates value as a number and emits input', async () => {
    const el = await renderNumberInput();
    const input = el.shadowRoot!.querySelector('input')!;
    input.value = '42';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(el.value).toBe(42);
  });

  test('clearing the input sets value to undefined, not NaN or 0', async () => {
    const el = await renderNumberInput();
    el.value = 5;
    await el.updateComplete;

    const input = el.shadowRoot!.querySelector('input')!;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(el.value).toBeUndefined();
  });

  test('a required number input with a value of 0 is valid, not "missing"', async () => {
    const el = await renderNumberInput('required');
    el.value = 0;
    await el.updateComplete;

    expect(el.checkValidity()).toBe(true);
  });

  test('a required number input with no value is invalid', async () => {
    const el = await renderNumberInput('required');
    expect(el.checkValidity()).toBe(false);
  });
});
