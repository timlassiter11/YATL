import type { ReactiveController, ReactiveControllerHost } from 'lit';

type SlotName = '[default]' | (string & {});

/** A reactive controller that determines when slots exist. */
export class HasSlotController<T extends string = string>
  implements ReactiveController
{
  private slotNames: (T | SlotName)[] = [];

  constructor(
    private readonly host: ReactiveControllerHost & Element,
    ...slotNames: (T | SlotName)[]
  ) {
    host.addController(this);
    this.slotNames = slotNames;
  }

  private hasSlot(name: T | null): boolean {
    // Default-slotted content isn't necessarily an element - a bare text
    // node (e.g. <yatl-toast>Some message</yatl-toast>, no wrapping
    // element) is default-slotted too, but only elements can ever match a
    // CSS selector or carry a `slot` attribute, so we have to walk the
    // actual child nodes rather than use querySelector.
    return [...this.host.childNodes].some(node => {
      if (name) {
        // Only elements can ever be assigned to a named slot.
        return (
          node instanceof Element &&
          node.getAttribute('slot') === name &&
          this.hasContent(node)
        );
      }
      // A bare text node can't carry a `slot` attribute, so it's always
      // default-slotted.
      if (node instanceof Element && node.hasAttribute('slot')) {
        return false;
      }
      return this.hasContent(node);
    });
  }

  /**
   * Whether a node is (or resolves to) real content, recursing through a
   * forwarding <slot> - a wrapper component re-projecting its own
   * consumer's content into this host's slot (e.g. a dialog subclass doing
   * `<yatl-dialog><slot name="footer" slot="footer"></slot></yatl-dialog>`
   * to pass its own `footer` slot straight through) - to whatever it
   * actually ends up assigned or falling back to, since the forwarding
   * <slot> element itself always exists as a light-DOM child regardless.
   *
   * Deliberately doesn't reuse getEffectiveChildren()'s slot-resolution:
   * that helper calls assignedElements()/`.children`, which - same as
   * querySelector above - only ever see elements, so a forwarded slot that
   * resolves to bare text would go right back to looking empty. Uses
   * assignedNodes()/`.childNodes` here instead to catch that too.
   */
  private hasContent(node: Node): boolean {
    if (node instanceof HTMLSlotElement) {
      const assigned = node.assignedNodes({ flatten: true });
      const candidates = assigned.length > 0 ? assigned : node.childNodes;
      return [...candidates].some(child => this.hasContent(child));
    }
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent!.trim() !== '';
    }
    return node instanceof Element;
  }

  public test(slotName: T | null) {
    return this.hasSlot(slotName);
  }

  public hostConnected() {
    this.host.shadowRoot!.addEventListener('slotchange', this.handleSlotChange);
  }

  public hostDisconnected() {
    this.host.shadowRoot!.removeEventListener(
      'slotchange',
      this.handleSlotChange,
    );
  }

  private handleSlotChange = (event: Event) => {
    const slot = event.target as HTMLSlotElement;

    if (
      (this.slotNames.includes('[default]') && !slot.name) ||
      (slot.name && this.slotNames.includes(slot.name))
    ) {
      this.host.requestUpdate();
    }
  };
}

/**
 * Given a list of nodes, this function iterates over all of them and returns the concatenated
 * HTML as a string. This is useful for getting the HTML that corresponds to a slot’s assigned nodes (since we can't use slot.innerHTML as an alternative).
 * @param nodes - The list of nodes to iterate over.
 * @param callback - A function that can be used to customize the HTML output for specific types of nodes. If the function returns undefined, the default HTML output will be used.
 */
export function getInnerHTML(
  nodes: Iterable<Node>,
  callback?: (node: Node) => string | undefined,
): string {
  let html = '';

  for (const node of nodes) {
    if (callback) {
      const customHTML = callback(node);

      if (customHTML !== undefined) {
        html += customHTML;
        continue;
      }
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      html += (node as HTMLElement).outerHTML;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      html += node.textContent;
    }
  }

  return html;
}
