import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import styles from './loading-overlay.styles';
import { SpinnerState } from '../spinner/spinner';

@customElement('yatl-loading-overlay')
export class YatlLoadingOverlay extends YatlBase {
  public static override styles = [...super.styles, styles];

  @property({ type: Boolean, reflect: true })
  public show = false;

  @property({ type: String, reflect: true })
  public state: SpinnerState = 'loading';

  public override render() {
    return html`
      <div part="base">
        <yatl-spinner part="spinner" state=${this.state}></yatl-spinner>
        <div part="message">
          <slot> </slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-loading-overlay': YatlLoadingOverlay;
  }
}
