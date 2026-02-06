import { html, LitElement, nothing } from 'lit';

import theme from '../theme';
import styles from './yatl-icon.styles';
import { customElement, property } from 'lit/decorators.js';
import { icons } from '../icons';

@customElement('yatl-icon')
export class YatlIcon extends LitElement {
  public static override styles = [theme, styles];

  @property({ type: String })
  public name = '';

  @property({ type: String })
  public viewBox = '0 0 24 24';

  @property({ type: String })
  public label = '';

  public override render() {
    const svg = icons[this.name];

    return html`
      <svg
        part="svg"
        viewBox=${this.viewBox}
        aria-hidden=${this.label ? 'false' : 'true'}
        aria-label=${this.label || undefined}
        role=${this.label ? 'img' : 'presentation'}
      >
        ${svg ?? nothing}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-icon': YatlIcon;
  }
}
