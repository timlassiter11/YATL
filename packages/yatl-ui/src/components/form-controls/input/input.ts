import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { classMap } from 'lit/directives/class-map.js';
import { YatlFormControl } from '../form-control/form-control';
import { live } from 'lit/directives/live.js';
import styles from './input.styles';

export type YatlInputType =
  | 'email'
  | 'password'
  | 'search'
  | 'text'
  | 'tel'
  | 'url';

@customElement('yatl-input')
export class YatlInput extends YatlFormControl<string> {
  public static override styles = [...super.styles, styles];

  @property({ type: String })
  public type: YatlInputType = 'text';

  @property({ type: Number })
  public size = 15;

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

  @property({ type: String, attribute: 'value' })
  public defaultValue = '';

  @property({ attribute: false })
  public value = '';

  public get formValue() {
    return this.value;
  }

  protected override renderInput() {
    return html`
      <input
        part="input"
        name=${this.name}
        type=${this.type}
        size=${this.size}
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

  protected override renderLabel() {
    return html`
      <label for="input" class="label-row">
        <slot name="label">
          <div part="label" class=${classMap({ 'has-label': this.hasLabel })}>
            ${this.label}
          </div>
        </slot>
        <span class="label-spacer"></span>
        ${this.showCount ? this.renderCount() : nothing}
      </label>
    `;
  }

  protected renderCount() {
    const count = this.maxlength
      ? `${this.value.length}/${this.maxlength}`
      : `${this.value.length}`;

    return html`<span part="label-count">${count}</span>`;
  }

  protected override onValueChange(event: Event) {
    this.value = (event.target as HTMLInputElement).value;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-input': YatlInput;
  }
}
