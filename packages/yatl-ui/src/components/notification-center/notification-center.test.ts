import { afterEach, describe, expect, test, vi } from 'vitest';

import '../../index';
import { YatlNotificationCenter } from './notification-center';
import { toast, toastStore } from '../../utils';
import { YatlToast } from '../toast/toast';
import { YatlDropdownToggleEvent } from '../../events';

async function renderCenter(attrs = '') {
  document.body.innerHTML = `<yatl-notification-center ${attrs}></yatl-notification-center>`;
  const el = document.querySelector<YatlNotificationCenter>(
    'yatl-notification-center',
  )!;
  await el.updateComplete;
  return el;
}

function getBadge(el: YatlNotificationCenter) {
  return el.shadowRoot!.querySelector('[part="badge"]');
}

function getItems(el: YatlNotificationCenter) {
  return [...el.shadowRoot!.querySelectorAll('[part="item"]')];
}

async function openPanel(el: YatlNotificationCenter) {
  // Go through the real trigger click (like a user would), not
  // dropdown.open = true directly, since only the click path runs
  // requestState() and fires yatl-dropdown-toggle.
  const trigger = el.shadowRoot!.querySelector(
    '[part="trigger"]',
  ) as HTMLElement;
  trigger.click();
  await el.updateComplete;
}

afterEach(() => {
  document.body.innerHTML = '';
  toastStore.clear();
  toastStore.maxHistory = 50;
});

describe('YatlNotificationCenter', () => {
  test('shows no badge when there is no unread history', async () => {
    const el = await renderCenter();
    expect(getBadge(el)).toBeNull();
  });

  test('the badge reflects the unread count as toasts come in', async () => {
    const el = await renderCenter();

    toast({ message: 'First' });
    await el.updateComplete;
    expect(getBadge(el)?.textContent?.trim()).toBe('1');

    toast({ message: 'Second' });
    await el.updateComplete;
    expect(getBadge(el)?.textContent?.trim()).toBe('2');
  });

  test('the badge caps display at "99+"', async () => {
    const el = await renderCenter();

    for (let i = 0; i < 100; i++) {
      toast({ message: `Toast ${i}` });
    }
    await el.updateComplete;

    expect(getBadge(el)?.textContent?.trim()).toBe('99+');
  });

  test('history already in the store when mounted is shown immediately', async () => {
    toast({ message: 'Already here' });

    const el = await renderCenter();

    expect(getItems(el).length).toBe(1);
    expect(getBadge(el)?.textContent?.trim()).toBe('1');
  });

  test('opening the panel marks everything read and clears the badge', async () => {
    const el = await renderCenter();
    toast({ message: 'Hi' });
    await el.updateComplete;
    expect(getBadge(el)).not.toBeNull();

    await openPanel(el);

    expect(getBadge(el)).toBeNull();
    expect(toastStore.history.every(r => r.read)).toBe(true);
  });

  test('clicking "Clear all" empties the history and fires yatl-notification-center-clear', async () => {
    const el = await renderCenter();
    toast({ message: 'Hi' });
    await el.updateComplete;

    let cleared = false;
    el.addEventListener('yatl-notification-center-clear', () => {
      cleared = true;
    });

    const clearButton = el.shadowRoot!.querySelector(
      '[part="clear-button"]',
    ) as HTMLElement;
    clearButton.click();
    await el.updateComplete;

    expect(getItems(el).length).toBe(0);
    expect(toastStore.history.length).toBe(0);
    expect(cleared).toBe(true);
  });

  test('removing a single item only deletes that record', async () => {
    const el = await renderCenter();
    const keepId = toast({ message: 'Keep me' });
    toast({ message: 'Remove me' });
    await el.updateComplete;

    const removeButtons = el.shadowRoot!.querySelectorAll(
      '[part="item-remove"]',
    );
    // Newest first, so index 0 is "Remove me".
    (removeButtons[0] as HTMLElement).click();
    await el.updateComplete;

    expect(getItems(el).length).toBe(1);
    expect(toastStore.history.map(r => r.id)).toEqual([keepId]);
  });

  test('updating a toast by id is reflected as a single history entry', async () => {
    const el = await renderCenter();
    const id = toast({ message: 'Uploading 0%' });
    await el.updateComplete;

    toast({ id, message: 'Uploading 50%' });
    await el.updateComplete;

    const items = getItems(el);
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Uploading 50%');
  });

  test('shows an empty state when there is no history', async () => {
    const el = await renderCenter();
    expect(el.shadowRoot!.querySelector('[part="empty"]')).not.toBeNull();
  });

  test('max-history attribute is forwarded to the shared store', async () => {
    await renderCenter('max-history="5"');
    expect(toastStore.maxHistory).toBe(5);
  });

  test('the badge is not clipped by the trigger button (which itself has overflow: hidden)', async () => {
    const el = await renderCenter();
    toast({ message: 'Hi' });
    await el.updateComplete;

    const badge = getBadge(el)!;
    const wrapper = el.shadowRoot!.querySelector('[part="trigger-wrapper"]')!;
    expect(badge).not.toBeNull();
    // The badge must be a sibling of the button, not a descendant of it -
    // yatl-button clips its own content, which would clip an overhanging
    // badge positioned inside it.
    expect(badge.closest('yatl-button')).toBeNull();
    expect(wrapper.contains(badge)).toBe(true);
  });

  test('a toast whose timer expires without the panel ever being opened stays unread', async () => {
    document.body.innerHTML = `
      <yatl-notification-center></yatl-notification-center>
      <yatl-toast-manager></yatl-toast-manager>
    `;
    const el = document.querySelector<YatlNotificationCenter>(
      'yatl-notification-center',
    )!;
    const manager = document.querySelector('yatl-toast-manager')!;
    await el.updateComplete;

    toast({ message: 'Bye' });
    await el.updateComplete;
    const toastEl = manager.shadowRoot!.querySelector(
      'yatl-toast',
    ) as YatlToast;

    // Simulates the duration timer expiring, same as handleAnimationEnd().
    await toastEl.hide('timeout');
    await el.updateComplete;

    // Still unread - the badge is the only cue the user has that they
    // missed something while it was live.
    expect(getBadge(el)?.textContent?.trim()).toBe('1');
    expect(toastStore.history[0].read).toBe(false);
  });

  test('manually closing a toast (not waiting for the timer) marks it read and clears the badge', async () => {
    document.body.innerHTML = `
      <yatl-notification-center></yatl-notification-center>
      <yatl-toast-manager></yatl-toast-manager>
    `;
    const el = document.querySelector<YatlNotificationCenter>(
      'yatl-notification-center',
    )!;
    const manager = document.querySelector('yatl-toast-manager')!;
    await el.updateComplete;

    toast({ message: 'Bye' });
    await el.updateComplete;
    const toastEl = manager.shadowRoot!.querySelector(
      'yatl-toast',
    ) as YatlToast;
    await toastEl.updateComplete;
    const closeButton = toastEl.shadowRoot!.querySelector(
      '[part="close"]',
    ) as HTMLElement;

    closeButton.click();
    // hide() uses animateWithClass's fallback timeout (1000ms) if the real
    // CSS animation doesn't fire, e.g. under reduced motion in headless
    // test browsers - give it enough room either way.
    await new Promise(r => setTimeout(r, 1200));
    await el.updateComplete;

    expect(getBadge(el)).toBeNull();
    expect(toastStore.history[0].read).toBe(true);
  });

  test('the item icon always renders (even with no glyph, for alignment) and is colored per variant', async () => {
    // The real design-token stylesheet isn't loaded in this test, so set
    // the tokens the component reads directly to make the assertion exact.
    document.documentElement.style.setProperty(
      '--yatl-color-success',
      'rgb(10, 20, 30)',
    );
    document.documentElement.style.setProperty(
      '--yatl-color-danger',
      'rgb(40, 50, 60)',
    );
    try {
      const el = await renderCenter();
      toast({ message: 'Neutral' });
      toast({ message: 'Success', variant: 'success' });
      toast({ message: 'Danger', variant: 'danger' });
      await el.updateComplete;

      const icons = [
        ...el.shadowRoot!.querySelectorAll('[part="item-icon"]'),
      ] as HTMLElement[];
      // Newest first: danger, success, neutral.
      expect(icons).toHaveLength(3);
      expect(icons.map(i => i.getAttribute('data-variant'))).toEqual([
        'danger',
        'success',
        'neutral',
      ]);

      // The neutral icon still renders, for layout alignment, just with no
      // glyph name.
      expect(icons[2].getAttribute('name')).toBe('');

      expect(getComputedStyle(icons[0]).color).toBe('rgb(40, 50, 60)');
      expect(getComputedStyle(icons[1]).color).toBe('rgb(10, 20, 30)');
    } finally {
      document.documentElement.style.removeProperty('--yatl-color-success');
      document.documentElement.style.removeProperty('--yatl-color-danger');
    }
  });

  test('while the panel is open, relative timestamps refresh on an interval rather than waiting for a re-render trigger', async () => {
    const start = new Date('2024-01-01T00:00:00Z').getTime();
    vi.useFakeTimers();
    try {
      vi.setSystemTime(start);
      const el = await renderCenter();
      toast({ message: 'Hi' });
      await el.updateComplete;

      await openPanel(el);
      expect(
        el.shadowRoot!.querySelector('[part="item-time"]')?.textContent,
      ).toBe('just now');

      vi.setSystemTime(start + 5 * 60_000);
      await vi.advanceTimersByTimeAsync(30_000);
      await el.updateComplete;

      expect(
        el.shadowRoot!.querySelector('[part="item-time"]')?.textContent,
      ).toBe('5 minutes ago');
    } finally {
      vi.useRealTimers();
    }
  });

  test('the relative-time refresh interval stops once the panel closes', async () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const el = await renderCenter();
    toast({ message: 'Hi' });
    await el.updateComplete;

    await openPanel(el);
    clearIntervalSpy.mockClear();
    // Simulate the dropdown itself reporting closed - yatl-dropdown's own
    // open/close click and outside-click mechanics are its own component's
    // concern; this isolates just this component's reaction to the event.
    el.shadowRoot!.querySelector('yatl-dropdown')!.dispatchEvent(
      new YatlDropdownToggleEvent(false),
    );

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  test('the relative-time refresh interval stops on disconnect', async () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const el = await renderCenter();
    toast({ message: 'Hi' });
    await el.updateComplete;
    await openPanel(el);
    clearIntervalSpy.mockClear();

    el.remove();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
