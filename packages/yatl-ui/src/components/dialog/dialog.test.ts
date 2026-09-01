import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlDialog } from './dialog';

async function renderDialog(attrs = '') {
  document.body.innerHTML = `<yatl-dialog ${attrs}>content</yatl-dialog>`;
  const el = document.querySelector<YatlDialog>('yatl-dialog')!;
  await el.updateComplete;
  return el;
}

function nativeDialog(el: YatlDialog) {
  return el.shadowRoot!.querySelector('dialog')!;
}

describe('YatlDialog - basic show/hide', () => {
  test('show() opens the popover and fires yatl-dialog-show', async () => {
    const el = await renderDialog();
    let shown = false;
    el.addEventListener('yatl-dialog-show', () => (shown = true));

    await el.show();

    expect(el.open).toBe(true);
    expect(nativeDialog(el).matches(':popover-open')).toBe(true);
    expect(shown).toBe(true);
  });

  test('the close button hides the dialog and fires yatl-dialog-hide', async () => {
    const el = await renderDialog();
    await el.show();

    let hidden = false;
    el.addEventListener('yatl-dialog-hide', () => (hidden = true));

    const closeButton = el.shadowRoot!.querySelector(
      '[part="close-button"]',
    ) as HTMLElement;
    closeButton.click();
    await new Promise(r => setTimeout(r, 400));

    expect(el.open).toBe(false);
    expect(nativeDialog(el).matches(':popover-open')).toBe(false);
    expect(hidden).toBe(true);
  });

  test('a modal dialog does not close on backdrop click', async () => {
    const el = await renderDialog('modal');
    await el.show();

    const backdrop = el.shadowRoot!.querySelector('.backdrop') as HTMLElement;
    backdrop.click();
    await new Promise(r => setTimeout(r, 400));

    expect(el.open).toBe(true);
  });

  test('a non-modal dialog closes on backdrop click', async () => {
    const el = await renderDialog();
    await el.show();

    const backdrop = el.shadowRoot!.querySelector('.backdrop') as HTMLElement;
    backdrop.click();
    await new Promise(r => setTimeout(r, 400));

    expect(el.open).toBe(false);
  });

  test('a prevented hide request keeps the dialog open', async () => {
    const el = await renderDialog();
    await el.show();
    el.addEventListener('yatl-dialog-hide-request', event =>
      event.preventDefault(),
    );

    const closeButton = el.shadowRoot!.querySelector(
      '[part="close-button"]',
    ) as HTMLElement;
    closeButton.click();
    await new Promise(r => setTimeout(r, 400));

    expect(el.open).toBe(true);
  });
});

describe('YatlDialog - show/hide fire exactly once', () => {
  test('show()/close each dispatch their event exactly once, not twice', async () => {
    const el = await renderDialog();
    let showCount = 0;
    let hideCount = 0;
    el.addEventListener('yatl-dialog-show', () => showCount++);
    el.addEventListener('yatl-dialog-hide', () => hideCount++);

    await el.show();
    expect(showCount).toBe(1);

    const closeButton = el.shadowRoot!.querySelector(
      '[part="close-button"]',
    ) as HTMLElement;
    closeButton.click();
    await new Promise(r => setTimeout(r, 400));

    expect(hideCount).toBe(1);
  });
});

describe('YatlDialog - open/close race', () => {
  test('closing while the show animation is still in progress actually closes it', async () => {
    const el = await renderDialog();

    const showPromise = el.show();
    // Close while the show transition is still in flight.
    el.open = false;
    await showPromise;
    // The fix may need to wait out two sequential transitions (the
    // original show's, then a newly-started close's - 250ms each per the
    // dialog's default --dialog-show/hide-duration).
    await new Promise(r => setTimeout(r, 700));

    expect(el.open).toBe(false);
    expect(nativeDialog(el).matches(':popover-open')).toBe(false);
  });
});
