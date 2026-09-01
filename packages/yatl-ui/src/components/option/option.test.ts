import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlOption } from './option';

async function renderOption(attrs = '') {
  document.body.innerHTML = `<yatl-option ${attrs}></yatl-option>`;
  const el = document.querySelector<YatlOption>('yatl-option')!;
  await el.updateComplete;
  return el;
}

describe('YatlOption', () => {
  test('clicking a checkable option toggles checked', async () => {
    const el = await renderOption('checkable value="a"');

    el.click();

    expect(el.checked).toBe(true);

    el.click();

    expect(el.checked).toBe(false);
  });

  test('clicking a non-checkable option does not toggle checked', async () => {
    const el = await renderOption('value="a"');

    el.click();

    expect(el.checked).toBe(false);
  });

  test('a disabled option ignores clicks entirely', async () => {
    const el = await renderOption('checkable disabled value="a"');

    el.click();

    expect(el.checked).toBe(false);
  });

  test('a cancelled toggle request leaves checked unchanged', async () => {
    const el = await renderOption('checkable value="a"');
    el.addEventListener('yatl-option-toggle', e => e.preventDefault());

    el.click();

    expect(el.checked).toBe(false);
  });
});
