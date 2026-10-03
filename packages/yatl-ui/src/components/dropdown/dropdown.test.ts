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

const nextFrame = () =>
  new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

// Gives autoUpdate()/computePosition() time to run and settle.
async function settle(el: YatlDropdown) {
  await el.updateComplete;
  await nextFrame();
  await nextFrame();
}

function getMenu(el: YatlDropdown) {
  return el.shadowRoot!.querySelector<HTMLElement>('[part="menu"]')!;
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

// The menu is a popover so it renders in the top layer. A plain
// `position: fixed` menu isn't actually safe from its ancestors: anything
// that creates a containing block or stacking context (lit-virtualizer
// positions every row with `transform`) clips it to that ancestor and
// stacks it beneath whatever comes later in the DOM - e.g. the next row.
describe('YatlDropdown - popover rendering', () => {
  const options = `
    <yatl-option value="a" label="A"></yatl-option>
    <yatl-option value="b" label="B"></yatl-option>
    <yatl-option value="c" label="C"></yatl-option>
  `;

  async function renderIn(wrapperStyle: string, after = '') {
    document.body.innerHTML = `
      <div style="${wrapperStyle}">
        <yatl-dropdown>
          <button slot="trigger">Trigger</button>
          ${options}
        </yatl-dropdown>
      </div>
      ${after}
    `;
    const el = document.querySelector<YatlDropdown>('yatl-dropdown')!;
    await el.updateComplete;
    return el;
  }

  test('the menu escapes a clipping ancestor instead of being squashed into it', async () => {
    const el = await renderIn(
      'position: relative; height: 60px; overflow: hidden; transform: translateZ(0)',
      '<div style="position: relative; transform: translateZ(0); height: 300px">Next row</div>',
    );

    el.open = true;
    await settle(el);

    const menu = getMenu(el);
    // Squashed into the 60px-tall clipping ancestor it would have to scroll.
    expect(menu.scrollHeight).toBeLessThanOrEqual(menu.clientHeight);

    // ...and it has to actually be on top of the row that follows.
    const rect = menu.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + 10, rect.bottom - 5);
    expect(hit && el.contains(hit)).toBe(true);
  });

  test('opening puts the menu in the top layer and closing takes it back out', async () => {
    const el = await renderIn('');
    const menu = getMenu(el);
    expect(menu.matches(':popover-open')).toBe(false);

    el.open = true;
    await settle(el);
    expect(menu.matches(':popover-open')).toBe(true);

    el.open = false;
    await settle(el);
    expect(menu.matches(':popover-open')).toBe(false);
  });

  test('a menu reopened after something else took the top layer is above it again', async () => {
    // e.g. a dropdown in a yatl-dialog: the dialog is shown (and so stacked)
    // after the first time the dropdown was used, and again every time it's
    // reopened. If closing leaves the menu in the top layer it keeps its
    // old, now-lower position and the dialog ends up covering it.
    const el = await renderIn(
      'position: absolute; top: 100px; left: 100px',
      '<div id="cover" popover="manual" style="position: fixed; inset: 0; width: auto; height: auto; margin: 0; border: 0; padding: 0; background: red"></div>',
    );
    const cover = document.querySelector<HTMLElement>('#cover')!;

    el.open = true;
    await settle(el);
    el.open = false;
    await settle(el);

    cover.showPopover();
    el.open = true;
    await settle(el);

    const rect = getMenu(el).getBoundingClientRect();
    const hit = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    expect(hit && el.contains(hit)).toBe(true);
  });

  test('the menu inherits its text color rather than the popover default (CanvasText)', async () => {
    const el = await renderIn('color: rgb(1, 2, 3)');

    el.open = true;
    await settle(el);

    expect(getComputedStyle(getMenu(el)).color).toBe('rgb(1, 2, 3)');
  });

  test('closes, and tells listeners it closed, when the trigger is scrolled out of view', async () => {
    document.body.innerHTML = `
      <div id="scroller" style="height: 50px; overflow: auto">
        <div style="height: 600px; padding-top: 400px">
          <yatl-dropdown>
            <button slot="trigger">Trigger</button>
            ${options}
          </yatl-dropdown>
        </div>
      </div>
    `;
    const el = document.querySelector<YatlDropdown>('yatl-dropdown')!;
    await el.updateComplete;

    const toggles: boolean[] = [];
    el.addEventListener('yatl-dropdown-toggle', event =>
      toggles.push(event.open),
    );

    // Scrolled to the top, the trigger is far below the scroller's
    // visible area. A menu left open here would just float in the middle
    // of nowhere, detached from the (invisible) trigger.
    el.open = true;
    await settle(el);

    expect(el.open).toBe(false);
    expect(toggles).toEqual([false]);
  });
});
