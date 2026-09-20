import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { describe, expect, test } from 'vitest';

import { HasSlotController } from './slot-controller';

@customElement('slot-controller-test-host')
class SlotControllerTestHost extends LitElement {
  public slotController = new HasSlotController(this, '[default]', 'named');

  protected override render() {
    return html`
      <slot></slot>
      <slot name="named"></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'slot-controller-test-host': SlotControllerTestHost;
  }
}

async function renderHost(innerHTML: string) {
  document.body.innerHTML = `<slot-controller-test-host>${innerHTML}</slot-controller-test-host>`;
  const el = document.querySelector('slot-controller-test-host')!;
  await el.updateComplete;
  return el;
}

describe('HasSlotController - default slot', () => {
  test('a bare text node with no wrapping element counts as default content', async () => {
    const el = await renderHost('Just some text, no element at all');
    expect(el.slotController.test(null)).toBe(true);
  });

  test('an element with no slot attribute counts as default content', async () => {
    const el = await renderHost('<span>hi</span>');
    expect(el.slotController.test(null)).toBe(true);
  });

  test('whitespace-only text (e.g. formatting indentation) does not count', async () => {
    const el = await renderHost('\n      \n    ');
    expect(el.slotController.test(null)).toBe(false);
  });

  test('no children at all reports no default content', async () => {
    const el = await renderHost('');
    expect(el.slotController.test(null)).toBe(false);
  });

  test('content assigned to a named slot does not count as default content', async () => {
    const el = await renderHost('<span slot="named">hi</span>');
    expect(el.slotController.test(null)).toBe(false);
  });

  test('a mix of whitespace and real text still counts', async () => {
    const el = await renderHost('\n  Some real text  \n');
    expect(el.slotController.test(null)).toBe(true);
  });
});

describe('HasSlotController - named slot', () => {
  test('an element assigned to the named slot is detected', async () => {
    const el = await renderHost('<span slot="named">hi</span>');
    expect(el.slotController.test('named')).toBe(true);
  });

  test('default-slotted content does not count towards a named slot', async () => {
    const el = await renderHost('plain default text');
    expect(el.slotController.test('named')).toBe(false);
  });

  test('no children at all reports no named-slot content', async () => {
    const el = await renderHost('');
    expect(el.slotController.test('named')).toBe(false);
  });
});
