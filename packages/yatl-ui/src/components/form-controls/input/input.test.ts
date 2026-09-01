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
});
