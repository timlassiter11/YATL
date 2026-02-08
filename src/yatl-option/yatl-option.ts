import { html, LitElement, nothing } from 'lit';
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
    return html`
      <span part="base">
        <slot part="start" name="start"></slot>
        ${this.renderCheck()} ${this.renderLabel()}
        <slot part="end" name="end"></slot>
      </span>
    `;
  }

  protected renderLabel() {
    return html`<span part="label"><slot></slot></span>`;
  }

  protected renderCheck() {
    return this.checkable
      ? html`<yatl-icon part="check" name="check"></yatl-icon>`
      : nothing;
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
