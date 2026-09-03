import { describe, expect, test, vi } from 'vitest';

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

  test('hide() defaults to a "user" reason', async () => {
    const el = await renderToast('message="hello"');
    let reason: string | undefined;
    el.addEventListener('yatl-toast-hide', event => (reason = event.reason));

    await el.hide();

    expect(reason).toBe('user');
  });

  test('hide("timeout") reports a "timeout" reason', async () => {
    const el = await renderToast('message="hello"');
    let reason: string | undefined;
    el.addEventListener('yatl-toast-hide', event => (reason = event.reason));

    await el.hide('timeout');

    expect(reason).toBe('timeout');
  });

  test('clicking the close button hides the toast with a "user" reason', async () => {
    const el = await renderToast('message="hello"');
    let reason: string | undefined;
    el.addEventListener('yatl-toast-hide', event => (reason = event.reason));

    const closeButton = el.shadowRoot!.querySelector(
      '[part="close"]',
    ) as HTMLElement;
    closeButton.click();
    // hide() uses animateWithClass's fallback timeout (1000ms) if the real
    // CSS animation doesn't fire, e.g. under reduced motion in headless
    // test browsers - give it enough room either way.
    await new Promise(r => setTimeout(r, 1200));

    expect(el.hidden).toBe(true);
    expect(reason).toBe('user');
  });

  test('the duration timer expiring hides the toast with a "timeout" reason', async () => {
    const el = await renderToast('message="hello" duration="1000"');
    let reason: string | undefined;
    el.addEventListener('yatl-toast-hide', event => (reason = event.reason));

    const timer = el.shadowRoot!.querySelector('[part="timer"]')!;
    timer.dispatchEvent(
      new AnimationEvent('animationend', { animationName: 'toast-timer' }),
    );
    await new Promise(r => setTimeout(r, 1200));

    expect(el.hidden).toBe(true);
    expect(reason).toBe('timeout');
  });

  test('the status icon keeps its space even for the neutral variant, which has no glyph', async () => {
    const el = await renderToast('message="hello"');

    const icon = el.shadowRoot!.querySelector('[part="status-icon"]')!;
    expect(getComputedStyle(icon).display).not.toBe('none');
  });

  test('show() unhides the element', async () => {
    const el = await renderToast('message="hello"');
    el.hidden = true;

    el.show();

    expect(el.hidden).toBe(false);
  });

  test('changing duration after connect restarts the timer, e.g. when a toast is updated in place', async () => {
    const el = await renderToast('message="hi" duration="1000"');
    const startTimerSpy = vi.spyOn(el, 'startTimer');

    el.duration = 2000;
    await el.updateComplete;

    expect(startTimerSpy).toHaveBeenCalledTimes(1);
  });

  test('changing an unrelated property does not restart the timer', async () => {
    const el = await renderToast('message="hi" duration="1000"');
    const startTimerSpy = vi.spyOn(el, 'startTimer');

    el.message = 'updated';
    await el.updateComplete;

    expect(startTimerSpy).not.toHaveBeenCalled();
  });
});
