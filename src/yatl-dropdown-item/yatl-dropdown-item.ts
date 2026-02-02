import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import styles from './yatl-dropdown-item.styles';

@customElement('yatl-dropdown-item')
export class YatlDropdownItem extends LitElement {
  public static override styles = [styles];

  @property({ type: String, reflect: true })
  public value = 'on';

  @property({ type: Boolean, reflect: true })
  public checked = false;

  protected override render() {
    return html`
      <label part="dropdown-item" class="dropdown-item">
        <input
          type="checkbox"
          value=${this.value}
          .checked=${this.checked}
          @change=${this.handleCheckboxChanged}
        />
        <div class="check-container">
          <svg class="check-icon" viewBox="0 0 16 16">
            <path
              d="M13.485 1.929l-8.485 8.485-3.536-3.536-1.414 1.414 4.95 4.95 9.9-9.9z"
            />
          </svg>
        </div>
        <span part="label-text" class="label-text"><slot></slot></span>
      </label>
    `;
  }

  private handleCheckboxChanged = (event: Event) => {
    const input = event.target as HTMLInputElement;
    this.checked = input.checked;
    this.dispatchEvent(
      new CustomEvent<YatlDropdownToggleDetail>('yatl-dropdown-toggle', {
        composed: true,
        bubbles: true,
        detail: { value: this.value, checked: this.checked },
      }),
    );
  };
}

interface YatlDropdownToggleDetail {
  value: string;
  checked: boolean;
}

export type YatlDropdownToggleEvent = CustomEvent<YatlDropdownToggleDetail>;
