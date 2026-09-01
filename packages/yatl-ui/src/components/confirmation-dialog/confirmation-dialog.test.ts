import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlConfirmationDialog } from './confirmation-dialog';
import { YatlDialog } from '../dialog/dialog';

async function renderConfirmationDialog(attrs = '') {
  document.body.innerHTML = `<yatl-confirmation-dialog ${attrs}></yatl-confirmation-dialog>`;
  const el = document.querySelector<YatlConfirmationDialog>(
    'yatl-confirmation-dialog',
  )!;
  await el.updateComplete;
  return el;
}

function innerDialog(el: YatlConfirmationDialog) {
  return el.shadowRoot!.querySelector('yatl-dialog') as YatlDialog;
}

// confirm() awaits show() (and its ~250ms+ animation) before its
// accept/reject listeners are even registered - wait for that to settle
// before simulating a button click/interaction, same as a real user would
// only be able to click once the dialog has actually rendered.
async function waitForShown(el: YatlConfirmationDialog) {
  await new Promise(r => setTimeout(r, 400));
}

describe('YatlConfirmationDialog - confirm() resolution', () => {
  test('accept() resolves confirm() with true', async () => {
    const el = await renderConfirmationDialog();
    const resultPromise = el.confirm();
    await waitForShown(el);

    await el.accept();

    expect(await resultPromise).toBe(true);
  });

  test('reject() resolves confirm() with false', async () => {
    const el = await renderConfirmationDialog();
    const resultPromise = el.confirm();
    await waitForShown(el);

    await el.reject();

    expect(await resultPromise).toBe(false);
  });

  test('closing the inner dialog directly (e.g. Escape/backdrop) resolves confirm() with false', async () => {
    const el = await renderConfirmationDialog();
    const resultPromise = el.confirm();
    await waitForShown(el);

    await innerDialog(el).hide();

    expect(await resultPromise).toBe(false);
    expect(el.open).toBe(false);
  });
});

describe('YatlConfirmationDialog - repeated confirm() calls', () => {
  test('a second confirm() resolves independently and correctly after the first', async () => {
    const el = await renderConfirmationDialog();

    const first = el.confirm();
    await waitForShown(el);
    await el.accept();
    expect(await first).toBe(true);

    const second = el.confirm();
    await waitForShown(el);
    await el.reject();
    expect(await second).toBe(false);
  });
});
