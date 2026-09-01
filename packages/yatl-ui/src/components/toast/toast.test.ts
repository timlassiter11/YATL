import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlToast } from './toast';

async function renderToast(attrs = '') {
  document.body.innerHTML = `<yatl-toast ${attrs}></yatl-toast>`;
  const el = document.querySelector<YatlToast>('yatl-toast')!;
  await el.updateComplete;
  return el;
}

describe('YatlToast', () => {
  test('hide() resolves, hides the element, and fires yatl-toast-hide', async () => {
    const el = await renderToast('message="hello"');
    let hideCount = 0;
    el.addEventListener('yatl-toast-hide', () => hideCount++);

    await el.hide();

    expect(el.hidden).toBe(true);
    expect(hideCount).toBe(1);
  });

  test('clicking the close button hides the toast', async () => {
    const el = await renderToast('message="hello"');

    const closeButton = el.shadowRoot!.querySelector(
      '[part="close"]',
    ) as HTMLElement;
    closeButton.click();
    // hide() uses animateWithClass's fallback timeout (1000ms) if the real
    // CSS animation doesn't fire, e.g. under reduced motion in headless
    // test browsers - give it enough room either way.
    await new Promise(r => setTimeout(r, 1200));

    expect(el.hidden).toBe(true);
  });

  test('show() unhides the element', async () => {
    const el = await renderToast('message="hello"');
    el.hidden = true;

    el.show();

    expect(el.hidden).toBe(false);
  });
});
