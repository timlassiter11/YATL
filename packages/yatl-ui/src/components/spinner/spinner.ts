import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBase } from '../base/base';

import styles from './spinner.styles';
import { icons } from '../../icons';

export type SpinnerState = 'idle' | 'loading' | 'success' | 'error';

@customElement('yatl-spinner')
export class YatlSpinner extends YatlBase {
  public static override styles = [...super.styles, styles];

  @property({ type: String, reflect: true })
  public state: SpinnerState = 'loading';

  public override render() {
    const spinnerIcon = icons['spinner'];
    const checkIcon = icons['check'];
    const closeIcon = icons['close'];
    return html`
      <div part="base" role="status" aria-busy=${this.state === 'loading'}>
        <svg viewBox="0 0 24 24" fill="none">
          <!-- put check first so the animation looks better -->
          ${checkIcon} ${closeIcon} ${spinnerIcon}
        </svg>
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
