import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlConfirmationDialog } from './confirmation-dialog';
import { YatlDialog } from '../dialog/dialog';
import { YatlButton } from '../button/button';

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

function footerButtons(el: YatlConfirmationDialog) {
  return [...el.shadowRoot!.querySelectorAll('yatl-button')] as YatlButton[];
}

function partButton(el: YatlConfirmationDialog, part: string) {
  return el.shadowRoot!.querySelector(`[part="${part}"]`) as YatlButton;
}

// confirm()/confirmWithCancel() await show() (and its ~250ms+ animation)
// before their accept/reject/cancel listeners are even registered - wait
// for that to settle before simulating a button click/interaction, same
// as a real user would only be able to click once the dialog has
// actually rendered.
async function waitForShown(el: YatlConfirmationDialog) {
  await new Promise(r => setTimeout(r, 400));
}

async function waitForHidden() {
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

  test('an implicit dismiss (e.g. Escape/backdrop/close button) fires cancel and resolves confirm() with false', async () => {
    const el = await renderConfirmationDialog();
    const resultPromise = el.confirm();
    await waitForShown(el);

    let cancelCount = 0;
    let rejectCount = 0;
    let hideCount = 0;
    el.addEventListener('yatl-confirmation-dialog-cancel', () => cancelCount++);
    el.addEventListener('yatl-confirmation-dialog-reject', () => rejectCount++);
    el.addEventListener('yatl-confirmation-dialog-hide', () => hideCount++);

    await innerDialog(el).hide();

    expect(await resultPromise).toBe(false);
    expect(el.open).toBe(false);
    expect(cancelCount).toBe(1);
    expect(rejectCount).toBe(0);
    expect(hideCount).toBe(1);
  });
});

describe('YatlConfirmationDialog - confirmWithCancel() resolution', () => {
  test('accept() resolves with "accept"', async () => {
    const el = await renderConfirmationDialog();
    const resultPromise = el.confirmWithCancel();
    await waitForShown(el);

    await el.accept();

    expect(await resultPromise).toBe('accept');
  });

  test('reject() resolves with "reject"', async () => {
    const el = await renderConfirmationDialog();
    const resultPromise = el.confirmWithCancel();
    await waitForShown(el);

    await el.reject();

    expect(await resultPromise).toBe('reject');
  });

  test('the cancel button resolves with "cancel"', async () => {
    const el = await renderConfirmationDialog('cancel-text="Cancel"');
    const resultPromise = el.confirmWithCancel();
    await waitForShown(el);

    partButton(el, 'cancel-button').click();

    expect(await resultPromise).toBe('cancel');
  });

  test('an implicit dismiss resolves with "cancel"', async () => {
    const el = await renderConfirmationDialog();
    const resultPromise = el.confirmWithCancel();
    await waitForShown(el);

    await innerDialog(el).hide();

    expect(await resultPromise).toBe('cancel');
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

describe('YatlConfirmationDialog - open attribute reflection', () => {
  test('open reflects back to the attribute after being cleared', async () => {
    const el = await renderConfirmationDialog();
    // Simulate a devtools "Elements" panel attribute edit, not a JS
    // property set - this is exactly how the original bug reproduced.
    el.setAttribute('open', '');
    await el.updateComplete;
    await waitForShown(el);
    expect(el.hasAttribute('open')).toBe(true);

    await el.reject();
    await waitForHidden();

    expect(el.open).toBe(false);
    expect(el.hasAttribute('open')).toBe(false);
  });
});

describe('YatlConfirmationDialog - modal default and close button', () => {
  test('modal defaults to true, blocking backdrop dismissal', async () => {
    const el = await renderConfirmationDialog();
    el.show();
    await waitForShown(el);

    const backdrop = innerDialog(el).shadowRoot!.querySelector(
      '.backdrop',
    ) as HTMLElement;
    backdrop.click();
    await waitForHidden();

    expect(el.open).toBe(true);
  });

  test('setting modal=false explicitly allows backdrop dismissal', async () => {
    const el = await renderConfirmationDialog();
    el.modal = false;
    await el.updateComplete;
    el.show();
    await waitForShown(el);

    const backdrop = innerDialog(el).shadowRoot!.querySelector(
      '.backdrop',
    ) as HTMLElement;
    backdrop.click();
    await waitForHidden();

    expect(el.open).toBe(false);
  });

  test('the close button still works while modal (the default)', async () => {
    const el = await renderConfirmationDialog();
    el.show();
    await waitForShown(el);

    const closeButton = innerDialog(el).shadowRoot!.querySelector(
      '[part="close-button"]',
    ) as HTMLElement;
    closeButton.click();
    await waitForHidden();

    expect(el.open).toBe(false);
  });
});

describe('YatlConfirmationDialog - fullscreen', () => {
  test('fullscreen passes through to the inner dialog', async () => {
    const el = await renderConfirmationDialog('fullscreen');
    expect(innerDialog(el).fullscreen).toBe(true);
  });
});

describe('YatlConfirmationDialog - label rendering', () => {
  // Regression test: the header slot forwarded to the inner yatl-dialog used
  // to be rendered with no fallback content. Per the slot flattening spec, an
  // *assigned-but-empty* slot still counts as "has assigned content" from the
  // inner dialog's perspective, which silently suppressed the inner dialog's
  // own `label` fallback - the title never rendered, in every case
  // (fullscreen or not), even though `label` was set correctly.
  function flattenedHeaderText(el: YatlConfirmationDialog) {
    const headerSlot = innerDialog(el).shadowRoot!.querySelector(
      'slot[name="header"]',
    ) as HTMLSlotElement;
    return headerSlot
      .assignedElements({ flatten: true })
      .map(node => node.textContent?.trim())
      .join('');
  }

  test('label renders through the forwarded header slot', async () => {
    const el = await renderConfirmationDialog('label="My Title"');
    expect(flattenedHeaderText(el)).toBe('My Title');
  });

  test('label renders through the forwarded header slot when fullscreen', async () => {
    const el = await renderConfirmationDialog('label="My Title" fullscreen');
    expect(flattenedHeaderText(el)).toBe('My Title');
  });

  test('a custom header slot still overrides the default label', async () => {
    document.body.innerHTML = `
      <yatl-confirmation-dialog label="Ignored">
        <span slot="header">Custom header</span>
      </yatl-confirmation-dialog>
    `;
    const el = document.querySelector<YatlConfirmationDialog>(
      'yatl-confirmation-dialog',
    )!;
    await el.updateComplete;
    expect(flattenedHeaderText(el)).toBe('Custom header');
  });
});

describe('YatlConfirmationDialog - button customization', () => {
  test('accept defaults to brand, reject and cancel default to neutral', async () => {
    const el = await renderConfirmationDialog('cancel-text="Cancel"');
    expect(partButton(el, 'accept-button').color).toBe('brand');
    expect(partButton(el, 'reject-button').color).toBe('neutral');
    expect(partButton(el, 'cancel-button').color).toBe('neutral');
  });

  test('accept/reject/cancel color and variant are configurable', async () => {
    const el = await renderConfirmationDialog(
      'cancel-text="Cancel" accept-color="danger" accept-variant="outline" reject-color="muted" cancel-variant="plain"',
    );

    expect(partButton(el, 'accept-button').color).toBe('danger');
    expect(partButton(el, 'accept-button').variant).toBe('outline');
    expect(partButton(el, 'reject-button').color).toBe('muted');
    expect(partButton(el, 'cancel-button').variant).toBe('plain');
  });

  test('the cancel button is hidden by default and shown when cancel-text is set', async () => {
    const withoutCancel = await renderConfirmationDialog();
    expect(partButton(withoutCancel, 'cancel-button').hidden).toBe(true);

    const withCancel = await renderConfirmationDialog('cancel-text="Cancel"');
    expect(partButton(withCancel, 'cancel-button').hidden).toBe(false);
  });

  test('buttons render in cancel, reject, accept order', async () => {
    const el = await renderConfirmationDialog('cancel-text="Cancel"');
    const parts = footerButtons(el).map(b => b.getAttribute('part'));

    expect(parts).toEqual(['cancel-button', 'reject-button', 'accept-button']);
  });

  test('accept/reject/cancel are all exposed as CSS parts', async () => {
    const el = await renderConfirmationDialog('cancel-text="Cancel"');

    expect(partButton(el, 'accept-button')).toBeInstanceOf(YatlButton);
    expect(partButton(el, 'reject-button')).toBeInstanceOf(YatlButton);
    expect(partButton(el, 'cancel-button')).toBeInstanceOf(YatlButton);
  });
});

describe('YatlConfirmationDialog - show/hide event passthrough', () => {
  test('fires yatl-confirmation-dialog-show and -hide around the transition', async () => {
    const el = await renderConfirmationDialog();
    let shown = false;
    let hidden = false;
    el.addEventListener('yatl-confirmation-dialog-show', () => (shown = true));
    el.addEventListener('yatl-confirmation-dialog-hide', () => (hidden = true));

    await el.show();
    expect(shown).toBe(true);
    expect(hidden).toBe(false);

    await el.hide();
    expect(hidden).toBe(true);
  });
});

describe('YatlConfirmationDialog - slot passthrough', () => {
  test('header, header-actions, and footer slots reach the inner dialog', async () => {
    document.body.innerHTML = `
      <yatl-confirmation-dialog>
        <span slot="header">Custom header</span>
        <span slot="header-actions">Header action</span>
        <span slot="footer">Footer note</span>
      </yatl-confirmation-dialog>
    `;
    const el = document.querySelector<YatlConfirmationDialog>(
      'yatl-confirmation-dialog',
    )!;
    await el.updateComplete;

    const dialog = innerDialog(el);
    await dialog.updateComplete;

    const headerSlot = dialog.shadowRoot!.querySelector(
      'slot[name="header"]',
    ) as HTMLSlotElement;
    const headerActionsSlot = dialog.shadowRoot!.querySelector(
      'slot[name="header-actions"]',
    ) as HTMLSlotElement;
    const footerSlot = dialog.shadowRoot!.querySelector(
      'slot[name="footer"]',
    ) as HTMLSlotElement;

    expect(
      headerSlot.assignedElements({ flatten: true }).length,
    ).toBeGreaterThan(0);
    expect(
      headerActionsSlot.assignedElements({ flatten: true }).length,
    ).toBeGreaterThan(0);
    expect(
      footerSlot.assignedElements({ flatten: true }).length,
    ).toBeGreaterThan(0);
  });
});
