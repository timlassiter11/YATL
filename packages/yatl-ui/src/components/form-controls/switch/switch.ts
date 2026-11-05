import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { YatlToggleControl } from '../toggle-control/toggle-control';
import styles from './switch.styles';

/**
 * @fires change - Fired when the checked state changes.
 */
@customElement('yatl-switch')
export class YatlSwitch extends YatlToggleControl {
  public static override styles = [...super.styles, styles];

  protected override renderInput() {
    return html`
      <input
        role="switch"
        id=${this.inputId}
        name=${this.name}
        type="checkbox"
        value=${this.value}
        .checked=${live(this.checked)}
        ?checked=${this.checked}
        ?disabled=${this.isDisabled || this.readonly}
        ?required=${this.required}
        @change=${this.handleChange}
      />
      <span part="control" class="switch">
        <span part="thumb" class="thumb"></span>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-switch': YatlSwitch;
  }
}
