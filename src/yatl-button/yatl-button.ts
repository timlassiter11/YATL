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
      <button
        class="button"
        type=${this.type}
        ?disabled=${this.disabled}
        part="button"
      >
        <slot></slot>
      </button>
    `;
  }
}
