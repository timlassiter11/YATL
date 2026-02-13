import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { YatlBase } from '../base/base';

import styles from './spinner.styles';
import { icons } from '../../icons';

@customElement('yatl-spinner')
export class YatlSpinner extends YatlBase {
  public static override styles = [...super.styles, styles];

  public override render() {
    const icon = icons['spinner'];
    return html`
      <div part="base" role="status">
        <svg viewBox="0 0 24 24" fill="none">${icon}</svg>
        <span class="sr-only">Loading...</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-spinner': YatlSpinner;
  }
}
