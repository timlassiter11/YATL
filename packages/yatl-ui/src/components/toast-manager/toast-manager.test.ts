import { afterEach, describe, expect, test } from 'vitest';

import '../../index';
import { YatlToastManager } from './toast-manager';
import { toast, toastStore } from '../../utils';
import { YatlToast } from '../toast/toast';

async function renderManager() {
  document.body.innerHTML = '<yatl-toast-manager></yatl-toast-manager>';
  const el = document.querySelector<YatlToastManager>('yatl-toast-manager')!;
  await el.updateComplete;
  return el;
}

function queryToasts(el: YatlToastManager) {
  return [...el.shadowRoot!.querySelectorAll('yatl-toast')] as YatlToast[];
}

afterEach(() => {
  document.body.innerHTML = '';
  // The manager is just a view over the shared, session-lived store now -
  // reset it so toasts from one test don't leak into the next.
  toastStore.clear();
});

describe('YatlToastManager', () => {
  test('a yatl-toast-request event adds a rendered toast', async () => {
    const el = await renderManager();

    toast({ message: 'Hello' });
    await el.updateComplete;

    const toasts = queryToasts(el);
    expect(toasts.length).toBe(1);
    expect(toasts[0].getAttribute('message')).toBe('Hello');
  });

  test('newest toasts are added to the front', async () => {
    const el = await renderManager();

    toast({ message: 'First' });
    await el.updateComplete;
    toast({ message: 'Second' });
    await el.updateComplete;

    const messages = queryToasts(el).map(t => t.getAttribute('message'));
    expect(messages).toEqual(['Second', 'First']);
  });

  test('a toast hiding itself removes it from the manager', async () => {
    const el = await renderManager();

    toast({ message: 'Bye' });
    await el.updateComplete;

    const toastEl = queryToasts(el)[0];
    await toastEl.hide();
    await el.updateComplete;

    expect(queryToasts(el).length).toBe(0);
  });

  test('the popover is only shown while there is at least one toast', async () => {
    const el = await renderManager();
    expect(el.matches(':popover-open')).toBe(false);

    toast({ message: 'Hi' });
    await el.updateComplete;
    expect(el.matches(':popover-open')).toBe(true);

    const toastEl = queryToasts(el)[0];
    await toastEl.hide();
    await el.updateComplete;
    expect(el.matches(':popover-open')).toBe(false);
  });

  test('a toast hiding itself dismisses it in the shared store rather than deleting it', async () => {
    const el = await renderManager();

    toast({ message: 'Bye' });
    await el.updateComplete;
    const id = queryToasts(el)[0].id;

    await queryToasts(el)[0].hide();
    await el.updateComplete;

    expect(queryToasts(el).length).toBe(0);
    const record = toastStore.history.find(r => r.id === id);
    expect(record).toBeDefined();
    expect(record?.dismissedAt).toBeDefined();
  });

  test('a manual close (hide() default reason "user") marks the store record read', async () => {
    const el = await renderManager();
    toast({ message: 'Bye' });
    await el.updateComplete;
    const id = queryToasts(el)[0].id;

    await queryToasts(el)[0].hide();
    await el.updateComplete;

    expect(toastStore.history.find(r => r.id === id)?.read).toBe(true);
  });

  test('the timer expiring (hide("timeout")) leaves the store record unread', async () => {
    const el = await renderManager();
    toast({ message: 'Bye' });
    await el.updateComplete;
    const id = queryToasts(el)[0].id;

    await queryToasts(el)[0].hide('timeout');
    await el.updateComplete;

    expect(toastStore.history.find(r => r.id === id)?.read).toBe(false);
  });

  test('toasts already in the store when the manager mounts are shown immediately', async () => {
    toast({ message: 'Already here' });

    const el = await renderManager();

    expect(queryToasts(el).map(t => t.getAttribute('message'))).toEqual([
      'Already here',
    ]);
  });

  test('clearing the store removes toasts from the live view, even while showing', async () => {
    const el = await renderManager();
    toast({ message: 'Hi' });
    await el.updateComplete;
    expect(queryToasts(el).length).toBe(1);

    toastStore.clear();
    await el.updateComplete;

    expect(queryToasts(el).length).toBe(0);
  });

  test('updating an existing toast by id re-renders the same element instead of adding a new one', async () => {
    const el = await renderManager();
    const id = toast({ message: 'Uploading 0%' });
    await el.updateComplete;

    toast({ id, message: 'Uploading 50%' });
    await el.updateComplete;

    const toasts = queryToasts(el);
    expect(toasts.length).toBe(1);
    expect(toasts[0].getAttribute('message')).toBe('Uploading 50%');
  });
});
