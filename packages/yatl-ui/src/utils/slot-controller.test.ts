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

// Mirrors the real-world pattern of e.g. yatl-dialog wrapping yatl-card and
// forwarding its own named slots straight through:
//   <yatl-card>
//     <slot name="footer" slot="footer-start"></slot>
//   </yatl-card>
// The forwarding <slot> is a real, always-present light-DOM child of the
// inner component, so a naive "does a matching child element exist" check
// reports true even when nothing was ever assigned to the outer slot it's
// forwarding.
@customElement('slot-forward-inner')
class SlotForwardInner extends LitElement {
  public slotController = new HasSlotController(this, 'target');

  protected override render() {
    return html`<slot name="target"></slot>`;
  }
}

@customElement('slot-forward-outer')
class SlotForwardOuter extends LitElement {
  protected override render() {
    return html`
      <slot-forward-inner>
        <slot name="passthrough" slot="target"></slot>
      </slot-forward-inner>
    `;
  }
}

@customElement('slot-forward-outer-with-fallback')
class SlotForwardOuterWithFallback extends LitElement {
  protected override render() {
    return html`
      <slot-forward-inner>
        <slot name="passthrough" slot="target">
          <span>fallback content</span>
        </slot>
      </slot-forward-inner>
    `;
  }
}

// Same forwarding shape, but the fallback is bare text rather than an
// element.
@customElement('slot-forward-outer-with-text-fallback')
class SlotForwardOuterWithTextFallback extends LitElement {
  protected override render() {
    return html`
      <slot-forward-inner>
        <slot name="passthrough" slot="target">Fallback text</slot>
      </slot-forward-inner>
    `;
  }
}

// Forwards the *default* slot (rather than a named one) straight through,
// so whatever the outer consumer assigns without a `slot` attribute -
// including bare text - is what the inner component ends up seeing.
@customElement('slot-forward-outer-default')
class SlotForwardOuterDefault extends LitElement {
  protected override render() {
    return html`
      <slot-forward-inner>
        <slot slot="target"></slot>
      </slot-forward-inner>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'slot-controller-test-host': SlotControllerTestHost;
    'slot-forward-inner': SlotForwardInner;
    'slot-forward-outer': SlotForwardOuter;
    'slot-forward-outer-with-fallback': SlotForwardOuterWithFallback;
    'slot-forward-outer-with-text-fallback': SlotForwardOuterWithTextFallback;
    'slot-forward-outer-default': SlotForwardOuterDefault;
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

// Regression coverage: a forwarding <slot> (a wrapper component
// re-projecting its own consumer's content into an inner component's slot)
// used to count as "has content" merely because the <slot> element itself
// always exists as a light-DOM child, regardless of whether anything was
// actually assigned to (or fell back into) it.
describe('HasSlotController - forwarded/nested slots', () => {
  async function renderOuter(
    tag:
      | 'slot-forward-outer'
      | 'slot-forward-outer-with-fallback'
      | 'slot-forward-outer-with-text-fallback'
      | 'slot-forward-outer-default',
    innerHTML = '',
  ) {
    document.body.innerHTML = `<${tag}>${innerHTML}</${tag}>`;
    const outer = document.querySelector(tag)!;
    await outer.updateComplete;
    const inner = outer.shadowRoot!.querySelector('slot-forward-inner')!;
    await inner.updateComplete;
    return inner;
  }

  test('an empty forwarding slot with nothing assigned does not count as content', async () => {
    const inner = await renderOuter('slot-forward-outer');
    expect(inner.slotController.test('target')).toBe(false);
  });

  test('a forwarding slot with something assigned to the outer slot counts', async () => {
    const inner = await renderOuter(
      'slot-forward-outer',
      '<span slot="passthrough">hi</span>',
    );
    expect(inner.slotController.test('target')).toBe(true);
  });

  test("a forwarding slot's own fallback content counts, even with nothing assigned", async () => {
    const inner = await renderOuter('slot-forward-outer-with-fallback');
    expect(inner.slotController.test('target')).toBe(true);
  });

  test("a forwarding slot's own bare-text fallback counts too, not just element fallback", async () => {
    const inner = await renderOuter('slot-forward-outer-with-text-fallback');
    expect(inner.slotController.test('target')).toBe(true);
  });

  test('a forwarded default slot that resolves to bare text (no wrapping element) counts', async () => {
    const inner = await renderOuter(
      'slot-forward-outer-default',
      'Just bare text passed through the default slot',
    );
    expect(inner.slotController.test('target')).toBe(true);
  });

  test('a forwarded default slot with nothing at all does not count', async () => {
    const inner = await renderOuter('slot-forward-outer-default');
    expect(inner.slotController.test('target')).toBe(false);
  });
});
