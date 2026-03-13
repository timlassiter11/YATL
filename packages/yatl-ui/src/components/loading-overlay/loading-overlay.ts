import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import styles from './loading-overlay.styles';
import { YatlSpinnerState } from '../spinner/spinner';
import { YatlSpinnerStateChangeEvent } from '../../events';

@customElement('yatl-loading-overlay')
export class YatlLoadingOverlay extends YatlBase {
  public static override styles = [...super.styles, styles];

  @property({ type: Boolean, reflect: true })
  public show = false;

  @property({ type: String, reflect: true })
  public state: YatlSpinnerState = 'loading';

  public override render() {
    return html`
      <div part="base">
        <yatl-spinner
          part="spinner"
          state=${this.state}
          @yatl-spinner-state-change=${this.handleStateChange}
        ></yatl-spinner>
        <div part="message">
          <slot> </slot>
        </div>
      </div>
    `;
  }

  private handleStateChange(event: YatlSpinnerStateChangeEvent) {
    this.state = event.state;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-loading-overlay': YatlLoadingOverlay;
  }
}
