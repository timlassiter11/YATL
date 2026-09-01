import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlFlyout } from './flyout';

async function renderFlyout(attrs = '') {
  document.body.innerHTML = `<yatl-flyout ${attrs}>content</yatl-flyout>`;
  const el = document.querySelector<YatlFlyout>('yatl-flyout')!;
  await el.updateComplete;
  return el;
}

function nativeDialog(el: YatlFlyout) {
  return el.shadowRoot!.querySelector('dialog')!;
}

describe('YatlFlyout - basic show/hide', () => {
  test('show() opens the popover and fires yatl-flyout-show', async () => {
    const el = await renderFlyout();
    let shown = false;
    el.addEventListener('yatl-flyout-show', () => (shown = true));

    await el.show();

    expect(el.open).toBe(true);
    expect(nativeDialog(el).matches(':popover-open')).toBe(true);
    expect(shown).toBe(true);
  });

  test('the close button hides the flyout and fires yatl-flyout-hide', async () => {
    const el = await renderFlyout();
    await el.show();

    let hidden = false;
    el.addEventListener('yatl-flyout-hide', () => (hidden = true));

    const closeButton = el.shadowRoot!.querySelector(
      '[part="close-button"]',
    ) as HTMLElement;
    closeButton.click();
    await new Promise(r => setTimeout(r, 400));

    expect(el.open).toBe(false);
    expect(nativeDialog(el).matches(':popover-open')).toBe(false);
    expect(hidden).toBe(true);
  });

  test('a modal flyout does not close on backdrop click', async () => {
    const el = await renderFlyout('modal');
    await el.show();

    const backdrop = el.shadowRoot!.querySelector('.backdrop') as HTMLElement;
    backdrop.click();
    await new Promise(r => setTimeout(r, 400));

    expect(el.open).toBe(true);
  });
});

describe('YatlFlyout - open/close race', () => {
  test('closing while the show animation is still in progress actually closes it', async () => {
    const el = await renderFlyout();

    const showPromise = el.show();
    // Close while the show transition is still in flight.
    el.open = false;
    await showPromise;
    // The fix may need to wait out two sequential transitions (the
    // original show's, then a newly-started close's - 250ms each per the
    // flyout's default --flyout-show/hide-duration).
    await new Promise(r => setTimeout(r, 700));

    expect(el.open).toBe(false);
    expect(nativeDialog(el).matches(':popover-open')).toBe(false);
  });
});
