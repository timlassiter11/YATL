import { describe, expect, test } from 'vitest';

import '../../../index';
import { YatlTextArea } from './textarea';

async function renderTextarea(attrs = '') {
  document.body.innerHTML = `<yatl-textarea ${attrs}></yatl-textarea>`;
  const el = document.querySelector<YatlTextArea>('yatl-textarea')!;
  await el.updateComplete;
  return el;
}

describe('YatlTextArea', () => {
  test('typing updates value and emits input', async () => {
    const el = await renderTextarea();
    let inputCount = 0;
    el.addEventListener('input', () => inputCount++);

    const textarea = el.shadowRoot!.querySelector('textarea')!;
    textarea.value = 'hello world';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    expect(el.value).toBe('hello world');
    expect(inputCount).toBe(1);
  });

  test('required is invalid when empty and valid once filled', async () => {
    const el = await renderTextarea('required');
    expect(el.checkValidity()).toBe(false);

    el.value = 'something';
    await el.updateComplete;
    expect(el.checkValidity()).toBe(true);
  });

  test('disabled prevents the value from being submitted', async () => {
    document.body.innerHTML =
      '<form><yatl-textarea name="notes" value="hi" disabled></yatl-textarea></form>';
    const form = document.querySelector('form')!;
    const el = document.querySelector<YatlTextArea>('yatl-textarea')!;
    await el.updateComplete;

    expect(new FormData(form).get('notes')).toBeNull();
  });

  test('show-count reflects value length, relative to maxlength when set', async () => {
    const el = await renderTextarea('show-count maxlength="10"');
    el.value = 'abc';
    await el.updateComplete;

    const count = el.shadowRoot!.querySelector('[part="label-count"]')!;
    expect(count.textContent).toBe('3/10');
  });
});
