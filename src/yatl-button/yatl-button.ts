import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import theme from '../theme';
import styles from './yatl-button.styles';

export type YatlButtonVariant = 'button' | 'icon';

@customElement('yatl-button')
export class YatlButton extends LitElement {
  public static override styles = [theme, styles];

  @property({ type: Boolean, reflect: true })
  public disabled = false;

  @property({ type: String, reflect: true })
  public type: 'button' | 'submit' | 'reset' = 'button';

  @property({ type: String, reflect: true})
  public variant: YatlButtonVariant = 'button';

  protected override render() {
    return html`
      <div part="base">
        <button part="button" type=${this.type} ?disabled=${this.disabled}>
          <slot name="start"></slot>
          <slot></slot>
          <slot name="end"></slot>
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-button': YatlButton;
  }
}
