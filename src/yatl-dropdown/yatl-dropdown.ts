import { html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import styles from './yatl-dropdown.styles';

@customElement('yatl-dropdown')
export class YatlDropdown extends LitElement {
  public static override styles = [styles];

  @query('details')
  private detailsElement!: HTMLElement;

  @property({ type: Boolean, reflect: true })
  public open = false;

  protected override render() {
    return html`
      <details part="dropdown" class="dropdown" ?open=${this.open}>
        <summary @click=${this.handleDropdownTriggerClick}>
          <slot name="trigger"></slot>
        </summary>
        <div part="dropdown-menu" class="dropdown-menu">
          <slot></slot>
        </div>
      </details>
    `;
  }

  private handleDropdownTriggerClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    this.open = !this.open;
    if (this.open) {
      // Add listener to the whole document
      document.addEventListener('click', this.handleDocumentClick);
    } else {
      // Clean up the listener when closed
      document.removeEventListener('click', this.handleDocumentClick);
    }
  };

  // Check if the click happened inside or outside
  private handleDocumentClick = (event: MouseEvent) => {
    // e.composedPath() is vital for Shadow DOM to see through the boundaries
    if (
      this.detailsElement &&
      !event.composedPath().includes(this.detailsElement)
    ) {
      this.open = false;
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-dropdown': YatlDropdown;
  }
}
