import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import theme from '../theme';
import styles from './yatl-button.styles';

@customElement('yatl-button')
export class YatlButton extends LitElement {
  public static override styles = [theme, styles];

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String, reflect: true })
  type: 'button' | 'submit' | 'reset' = 'button';

  render() {
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
