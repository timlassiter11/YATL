import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { icons } from '../../icons';
import { YatlBase } from '../base/base';
import styles from './icon.styles';

@customElement('yatl-icon')
export class YatlIcon extends YatlBase {
  public static override styles = [...super.styles, styles];

  /**
   * The name of the icon to render, looked up in the built-in icon set.
   * @attr name
   */
  @property({ type: String })
  public name = '';

  /**
   * The SVG `viewBox` attribute for the icon.
   * @attr viewbox
   */
  @property({ type: String })
  public viewBox = '0 0 24 24';

  /**
   * An accessible label for the icon. When unset, the icon is hidden from assistive technology.
   * @attr label
   */
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
