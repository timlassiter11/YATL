import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { getEffectiveChildren } from './common';

type SlotName = '[default]' | (string & {});

/** A reactive controller that determines when slots exist. */
export class HasSlotController implements ReactiveController {
  private slotNames: SlotName[] = [];

  constructor(
    private readonly host: ReactiveControllerHost & Element,
    ...slotNames: SlotName[]
  ) {
    host.addController(this);
    this.slotNames = slotNames;
  }

  private hasSlot(name: SlotName | null): boolean {
    const slotContents = name
      ? this.host.querySelector(`:scope > [slot="${name}"]`)
      : this.host.querySelector(`:scope > :not([slot])`);

    if (!slotContents) {
      return false;
    }

    return getEffectiveChildren(slotContents).length > 0;
  }

  public test(slotName: SlotName | null) {
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
