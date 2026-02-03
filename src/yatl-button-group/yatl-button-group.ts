import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { YatlDropdown } from '../yatl-dropdown';

import styles from './yatl-button-group.styles';

@customElement('yatl-button-group')
export class YatlButtonGroup extends LitElement {
  // FIXME: The column picker can't get the border radius
  static styles = [styles];

  render() {
    return html`
      <div class="group-container">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }

  private getFlattenedElements(slot: HTMLSlotElement) {
    const elements = slot
      .assignedNodes({ flatten: true })
      .filter(node => node.nodeType === Node.ELEMENT_NODE) as HTMLElement[];

    return elements.filter(
      element => getComputedStyle(element as HTMLElement).display !== 'none',
    );
  }

  private handleSlotChange(event: Event) {
    const slot = event.target as HTMLSlotElement;
    const elements = this.getFlattenedElements(slot);

    elements.forEach((element, index) => {
      if (element instanceof YatlDropdown) {
        element = element.querySelector('[slot="trigger"]') ?? element;
      }
      element.classList.toggle('is-first', index === 0);
      element.classList.toggle('is-last', index === elements.length - 1);
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-button-group': YatlButtonGroup;
  }
}
