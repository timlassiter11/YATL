import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { YatlToggleControl } from '../toggle-control/toggle-control';

import styles from './checkbox.styles';

/**
 * @fires change - Fired when the checked state changes.
 */
@customElement('yatl-checkbox')
export class YatlCheckbox extends YatlToggleControl {
  public static override styles = [...super.styles, styles];

  protected override render() {
    return html`
      ${this.renderLabel()}
      <div part="base" class="base">${this.renderInput()}</div>
      ${this.renderHint()} ${this.renderErrorText()}
    `;
  }

  protected override renderInput() {
    return html`
      <input
        part="input"
        class="input"
        id=${this.inputId}
        name=${this.name}
        type="checkbox"
        value=${this.value}
        .checked=${live(this.checked)}
        ?disabled=${this.isDisabled || this.readonly}
        ?required=${this.required}
        @change=${this.handleChange}
      />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-checkbox': YatlCheckbox;
  }
}
