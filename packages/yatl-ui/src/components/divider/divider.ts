import { LitElement } from 'lit';
import { property, customElement } from 'lit/decorators.js';

import styles from './divider.styles';

@customElement('yatl-divider')
export class YatlDivider extends LitElement {
  public static override styles = [styles];

  /**
   * The direction the divider line is drawn.
   * @attr orientation
   */
  @property({ type: String, reflect: true })
  public orientation: 'horizontal' | 'vertical' = 'horizontal';
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-divider': YatlDivider;
  }
}
