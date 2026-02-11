import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBase } from '../yatl-base';
import styles from './yatl-button.styles';

export type YatlButtonVariant = 'button' | 'icon';

@customElement('yatl-button')
export class YatlButton extends YatlBase {
  public static override styles = [...super.styles, styles];

  @property({ type: Boolean, reflect: true })
  public disabled = false;

  @property({ type: String, reflect: true })
  public type: 'button' | 'submit' | 'reset' = 'button';

  @property({ type: String, reflect: true })
  public variant: YatlButtonVariant = 'button';

  protected override render() {
    return html`
      <div part="base">
        <button part="button" type=${this.type} ?disabled=${this.disabled}>
          <slot name="start"></slot>
          <slot></slot>
          <slot name="end"></slot>
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-button': YatlButton;
  }
}
