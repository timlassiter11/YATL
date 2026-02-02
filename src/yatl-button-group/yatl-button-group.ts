import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { YatlDropdown } from '../yatl-dropdown';

@customElement('yatl-button-group')
export class YatlButtonGroup extends LitElement {
  // FIXME: The column picker can't get the border radius
  static styles = css`
    :host {
      display: inline-flex;
      --yatl-button-group-radius: var(--yatl-table-button-group-radius, 8px);
    }

    .group-container {
      display: flex;
      flex-direction: row;
      align-items: stretch;
    }

    ::slotted(*:not(:first-child):not(:last-child)) {
      --yatl-table-button-radius: 0;
    }

    ::slotted(:first-child) {
      --yatl-table-button-radius: var(--yatl-button-group-radius) 0 0
        var(--yatl-button-group-radius);
    }

    ::slotted(:last-child) {
      --yatl-table-button-radius: 0 var(--yatl-button-group-radius)
        var(--yatl-button-group-radius) 0;
      margin-right: 0;
    }

    ::slotted(*) {
      margin-right: -1px;
    }
  `;

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
