import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import styles from './button.styles';

export type YatlButtonVariant = 'neutral' | 'outline' | 'plain';
export type YatlButtonColor =
  | 'neutral'
  | 'brand'
  | 'danger'
  | 'warning'
  | 'success'
  | 'raised'
  | 'muted';

@customElement('yatl-button')
export class YatlButton extends YatlBase {
  public static override styles = [...super.styles, styles];

  @property({ type: Boolean, reflect: true })
  public disabled = false;

  @property({ type: String, reflect: true })
  public type: 'button' | 'submit' | 'reset' = 'button';

  @property({ type: String, reflect: true })
  public variant: YatlButtonVariant = 'neutral';

  @property({ type: String, reflect: true })
  public color: YatlButtonColor = 'neutral';

  @property({ type: Boolean, reflect: true })
  public loading = false;

  protected override render() {
    return html`
      <button
        part="base"
        type=${this.type}
        ?disabled=${this.disabled || this.loading}
        aria-busy=${this.loading ? 'true' : 'false'}
        aria-disabled=${this.loading ? 'true' : 'false'}
      >
        <slot name="start"></slot>
        <slot></slot>
        <slot name="end"></slot>
        ${this.loading
          ? html`<yatl-spinner part="spinner"></yatl-spinner>`
          : nothing}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-button': YatlButton;
  }
}
