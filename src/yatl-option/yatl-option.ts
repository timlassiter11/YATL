import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import theme from '../theme';
import styles from './yatl-option.styles';

@customElement('yatl-option')
export class YatlOption extends LitElement {
  public static override styles = [theme, styles];

  @property({ type: String, reflect: true })
  public value = 'on';

  @property({ type: Boolean, reflect: true })
  public checkable = false;

  @property({ type: Boolean, reflect: true })
  public checked = false;

  @property({ type: Boolean, reflect: true })
  public disabled = false;

  protected override render() {
    if (!this.checkable) {
      return html`<div part="base">${this.renderLabel()}</div>`;
    }

    return html`
      <label part="base"> ${this.renderCheck()} ${this.renderLabel()} </label>
    `;
  }

  protected renderLabel() {
    return html`<span part="label"><slot></slot></span>`;
  }

  protected renderCheck() {
    return html`
      <svg part="check" viewBox="0 0 16 16">
        <path
          d="M13.485 1.929l-8.485 8.485-3.536-3.536-1.414 1.414 4.95 4.95 9.9-9.9z"
        />
      </svg>
    `;
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.handleItemClicked);
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.handleItemClicked);
  }

  private handleItemClicked = (event: Event) => {
    if (this.disabled) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    if (this.checkable) {
      this.checked = !this.checked;
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-option': YatlOption;
  }
}
