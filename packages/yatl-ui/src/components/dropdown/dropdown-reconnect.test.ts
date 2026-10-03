import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlDropdown } from './dropdown';

async function renderDropdown() {
  document.body.innerHTML = `
    <div id="host">
      <yatl-dropdown open>
        <button slot="trigger">Trigger</button>
        <yatl-option value="a" label="A"></yatl-option>
      </yatl-dropdown>
    </div>
  `;
  const el = document.querySelector<YatlDropdown>('yatl-dropdown')!;
  await el.updateComplete;
  return el;
}

describe('YatlDropdown - disconnect/reconnect while open', () => {
  test('still closes on Escape after being moved to a different parent while open', async () => {
    const el = await renderDropdown();
    expect(el.open).toBe(true);

    // Simulate a parent re-render moving this element in the DOM tree
    // (disconnects then reconnects the same element instance).
    const newParent = document.createElement('div');
    document.body.appendChild(newParent);
    newParent.appendChild(el);
    await el.updateComplete;

    expect(el.open).toBe(true); // still reports open

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    );
    await el.updateComplete;

    expect(el.open).toBe(false);
  });

  test('is put back in the top layer after being moved to a different parent while open', async () => {
    const el = await renderDropdown();
    const menu = el.shadowRoot!.querySelector<HTMLElement>('[part="menu"]')!;
    expect(menu.matches(':popover-open')).toBe(true);

    // Removing a popover from the document hides it. If the dropdown is
    // still open when it comes back the menu has to be shown again, or it
    // falls back to being a plain `position: fixed` box - the very thing
    // using a popover was meant to get away from.
    const newParent = document.createElement('div');
    document.body.appendChild(newParent);
    newParent.appendChild(el);
    await el.updateComplete;

    expect(menu.matches(':popover-open')).toBe(true);
  });
});
