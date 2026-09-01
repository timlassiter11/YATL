import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlDropdown } from './dropdown';
import { YatlOption } from '../option/option';

// Disabled options bookend the list (x, d) so Home/End and wrap-around
// navigation can't accidentally land on an enabled option by coincidence.
async function renderDropdown() {
  document.body.innerHTML = `
    <yatl-dropdown open>
      <button slot="trigger">Trigger</button>
      <yatl-option value="x" label="X" disabled></yatl-option>
      <yatl-option value="a" label="A"></yatl-option>
      <yatl-option value="b" label="B" disabled></yatl-option>
      <yatl-option value="c" label="C"></yatl-option>
      <yatl-option value="d" label="D" disabled></yatl-option>
    </yatl-dropdown>
  `;
  const el = document.querySelector<YatlDropdown>('yatl-dropdown')!;
  await el.updateComplete;
  const [, a, , c] = [...el.querySelectorAll('yatl-option')] as YatlOption[];
  return { el, a, c };
}

function dispatchKeydown(key: string) {
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  );
}

describe('YatlDropdown - keyboard navigation skips disabled options', () => {
  test('ArrowDown from nothing focused lands on the first enabled option', async () => {
    const { a } = await renderDropdown();
    dispatchKeydown('ArrowDown');
    expect(document.activeElement).toBe(a);
  });

  test('ArrowDown skips a disabled option in the middle', async () => {
    const { c } = await renderDropdown();
    dispatchKeydown('ArrowDown'); // -> a
    dispatchKeydown('ArrowDown'); // should skip disabled b, -> c
    expect(document.activeElement).toBe(c);
  });

  test('ArrowDown from the last enabled option wraps to the first, skipping a trailing disabled option', async () => {
    const { a } = await renderDropdown();
    dispatchKeydown('ArrowDown'); // -> a
    dispatchKeydown('ArrowDown'); // -> c
    dispatchKeydown('ArrowDown'); // should skip disabled d, wrap to a
    expect(document.activeElement).toBe(a);
  });

  test('ArrowUp from nothing focused wraps to the last enabled option', async () => {
    const { c } = await renderDropdown();
    dispatchKeydown('ArrowUp');
    expect(document.activeElement).toBe(c);
  });

  test('ArrowUp skips a disabled option in the middle', async () => {
    const { a } = await renderDropdown();
    dispatchKeydown('ArrowUp'); // -> c
    dispatchKeydown('ArrowUp'); // should skip disabled b, -> a
    expect(document.activeElement).toBe(a);
  });

  test('Home lands on the first enabled option, skipping a leading disabled one', async () => {
    const { a } = await renderDropdown();
    dispatchKeydown('Home');
    expect(document.activeElement).toBe(a);
  });

  test('End lands on the last enabled option, skipping a trailing disabled one', async () => {
    const { c } = await renderDropdown();
    dispatchKeydown('End');
    expect(document.activeElement).toBe(c);
  });
});
