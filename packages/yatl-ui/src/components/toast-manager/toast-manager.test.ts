import { afterEach, describe, expect, test } from 'vitest';

import '../../index';
import { YatlToastManager } from './toast-manager';
import { toast } from '../../utils';
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
});
