import { describe, expect, test } from 'vitest';

import '../../../index';
import { YatlInput } from './input';

async function renderInput(attrs = '') {
  document.body.innerHTML = `<yatl-input ${attrs}></yatl-input>`;
  const el = document.querySelector<YatlInput>('yatl-input')!;
  await el.updateComplete;
  return el;
}

describe('YatlInput', () => {
  test('typing updates value and emits input', async () => {
    const el = await renderInput();
    let inputCount = 0;
    el.addEventListener('input', () => inputCount++);

    const input = el.shadowRoot!.querySelector('input')!;
    input.value = 'hello';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(el.value).toBe('hello');
    expect(inputCount).toBe(1);
  });

  test('formValue reflects the current value', async () => {
    const el = await renderInput();
    el.value = 'x';
    expect(el.formValue).toBe('x');
  });

  test('required is invalid when empty and valid once filled', async () => {
    const el = await renderInput('required');
    expect(el.checkValidity()).toBe(false);

    el.value = 'something';
    await el.updateComplete;
    expect(el.checkValidity()).toBe(true);
  });

  test('disabled prevents the value from being submitted', async () => {
    document.body.innerHTML =
      '<form><yatl-input name="q" value="abc" disabled></yatl-input></form>';
    const form = document.querySelector('form')!;
    const el = document.querySelector<YatlInput>('yatl-input')!;
    await el.updateComplete;

    expect(new FormData(form).get('q')).toBeNull();
  });

  test('password-toggle switches the rendered input type', async () => {
    const el = await renderInput('type="password" password-toggle');
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.type).toBe('password');

    const toggle = el.shadowRoot!.querySelector('yatl-button')!;
    (toggle as HTMLElement).click();
    await el.updateComplete;

    expect(input.type).toBe('text');
  });

  test('date and time use the native inputs and their value formats', async () => {
    const date = await renderInput('type="date" value="2026-11-11"');
    expect(date.shadowRoot!.querySelector('input')!.type).toBe('date');
    expect(date.value).toBe('2026-11-11');

    const time = await renderInput('type="time"');
    const input = time.shadowRoot!.querySelector('input')!;
    expect(input.type).toBe('time');
    input.value = '06:30';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(time.value).toBe('06:30');
  });

  test('min and max make a date outside them invalid', async () => {
    const el = await renderInput(
      'type="date" min="2026-11-01" max="2026-11-30"',
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.min).toBe('2026-11-01');

    const enter = async (value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;
    };

    await enter('2026-10-31');
    expect(el.validity.rangeUnderflow).toBe(true);
    await enter('2026-12-01');
    expect(el.validity.rangeOverflow).toBe(true);
    await enter('2026-11-15');
    expect(el.validity.valid).toBe(true);
  });

  test('step makes an off-step time invalid', async () => {
    // 15 minutes, in seconds
    const el = await renderInput('type="time" step="900"');
    const input = el.shadowRoot!.querySelector('input')!;
    input.value = '06:10';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;
    expect(el.validity.stepMismatch).toBe(true);

    input.value = '06:15';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;
    expect(el.validity.valid).toBe(true);
  });
});
