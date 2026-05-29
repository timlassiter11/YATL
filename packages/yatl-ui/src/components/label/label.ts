import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import styles from './label.styles';

@customElement('yatl-label')
export class YatlLabel extends YatlBase {
  public static override styles = [...super.styles, styles];

  protected override render() {
    return html` <slot></slot> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-label': YatlLabel;
  }
}
