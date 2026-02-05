import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { YatlFormControl } from '../yatl-form-control';

import styles from './yatl-input.styles';
import { live } from 'lit/directives/live.js';

export type YatlInputType =
  | 'email'
  | 'password'
  | 'search'
  | 'text'
  | 'tel'
  | 'url';

@customElement('yatl-input')
export class YatlInput extends YatlFormControl<string> {
  public static override styles = [...YatlFormControl.styles, styles];

  @property({ type: String })
  public type: YatlInputType = 'text';

  /** A regular expression pattern to validate input against. */
  @property()
  public pattern?: string;
  /** The input's minimum value. Only applies to date and number input types. */

  @property({ type: String })
  public placeholder = '';

  @property({ type: Boolean, attribute: 'password-toggle' })
  public passwordToggle = false;

  /** The minimum length of input that will be considered valid. */
  @property({ type: Number })
  public minlength?: number;

  /** The maximum length of input that will be considered valid. */
  @property({ type: Number })
  public maxlength?: number;

  @property({ type: Boolean, attribute: 'show-count' })
  public showCount = false;

  public get typedValue(): string {
    return this.value;
  }
  public set typedValue(value: string) {
    this.value = value;
  }

  protected override renderInput(id: string) {
    return html`
      <input
        part="input"
        id=${id}
        name=${this.name}
        type=${this.type}
        .value=${live(this.value)}
        value=${this.defaultValue}
        placeholder=${this.placeholder}
        minlength=${ifDefined(this.minlength)}
        maxlength=${ifDefined(this.maxlength)}
        pattern=${ifDefined(this.pattern)}
        ?readonly=${this.readonly}
        ?disabled=${this.disabled}
        ?required=${this.required}
      />
    `;
  }

  protected override renderLabel(inputId: string) {
    if (!this.label && !this.showCount) {
      return nothing;
    }

    return html`
      <label part="label">
        <slot>
          <span part="label-row">
            ${super.renderLabel(inputId)}
            <span part="label-spacer"></span>
            ${this.renderCount()}
          </span>
        </slot>
      </label>
    `;
  }

  protected renderCount() {
    const count = this.maxlength
      ? `${this.value.length}/${this.maxlength}`
      : `${this.value.length}`;

    return html`<span part="label-count">${count}</span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-input': YatlInput;
  }
}
