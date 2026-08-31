import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { YatlCheckableControl } from '../checkable-control/checkable-control';
import styles from './radio.styles';

/**
 * @fires change - Fired when the checked state changes.
 */
@customElement('yatl-radio')
export class YatlRadio extends YatlCheckableControl {
  public static override styles = [...super.styles, styles];

  protected override render() {
    return html`
      <div part="base" class="base">${this.renderInput()}</div>
      ${this.renderLabel()} ${this.renderHint()} ${this.renderErrorText()}
    `;
  }

  protected override renderInput() {
    return html`
      <input
        part="input"
        class="input"
        id=${this.inputId}
        name=${this.name}
        type="radio"
        value=${this.value}
        .checked=${live(this.checked)}
        ?disabled=${this.isDisabled || this.readonly}
        ?required=${this.required}
        @change=${this.handleChange}
      />
      <svg viewBox="0 0 16 16" part="radio" class="radio">
        <circle cx="8" cy="8" r="8" />
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-radio': YatlRadio;
  }
}
