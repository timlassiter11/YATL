import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { icons } from '../../icons';
import { YatlBase } from '../base/base';
import styles from './icon.styles';

@customElement('yatl-icon')
export class YatlIcon extends YatlBase {
  public static override styles = [...super.styles, styles];

  @property({ type: String })
  public name = '';

  @property({ type: String })
  public viewBox = '0 0 24 24';

  @property({ type: String })
  public label = '';

  public override render() {
    const svg = icons[this.name];

    return html`
      <slot>
        <svg
          part="svg"
          viewBox=${this.viewBox}
          aria-hidden=${this.label ? 'false' : 'true'}
          aria-label=${this.label || undefined}
          role=${this.label ? 'img' : 'presentation'}
        >
          ${svg ?? nothing}
        </svg>
      </slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-icon': YatlIcon;
  }
}
