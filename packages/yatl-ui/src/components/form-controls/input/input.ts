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

  /**
   * The native HTML input type (e.g., 'text', 'email', 'password', 'number').
   */
  @property({ type: String })
  public type: YatlInputType = 'text';

  /**
   * Hints to the browser and password managers what kind of data should be autofilled.
   * Accepts standard HTML autocomplete tokens (e.g., 'off', 'email', 'new-password').
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete
   */
  @property({ type: String, reflect: true })
  public autocomplete: AutoFill | (string & {}) = 'off';

  /**
   * The placeholder text to display when the input is empty.
   */
  @property({ type: String })
  public placeholder = '';

  /**
   * The visual width of the input, measured in average character widths.
   * Note: This only changes the physical width of the control; it does NOT restrict
   * the number of characters the user can type (use `maxlength` for that).
   */
  @property({ type: Number })
  public size?: number;

  /**
   * The minimum string length that the input will consider valid.
   */
  @property({ type: Number })
  public minlength?: number;

  /**
   * The maximum string length that the input will consider valid.
   */
  @property({ type: Number })
  public maxlength?: number;

  /**
   * A regular expression pattern to validate input against.
   */
  @property()
  public pattern?: string;

  /**
   * Displays a button at the end of the input to toggle the visibility of the text.
   * Typically used for password fields to let the user see what they typed.
   */
  @property({ type: Boolean, attribute: 'password-toggle' })
  public passwordToggle = false;

  /**
   * When true, masks the input text (like a password field) regardless of the
   * actual input `type` attribute.
   */
  @property({ type: Boolean, attribute: 'hide-text' })
  public hideText = true;

  /**
   * When true, displays a live character count at the end of the label.
   * If `maxlength` is also set, it will display the count relative to the maximum (e.g., "6/20").
   */
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
    const type =
      this.type === 'password' && !this.hideText ? 'text' : this.type;

    return html`
      <input
        part="input"
        id=${this.inputId}
        name=${this.name}
        type=${type}
        autocomplete=${this.autocomplete}
        size=${ifDefined(this.size)}
        .value=${live(this.value)}
        value=${this.defaultValue}
        placeholder=${this.placeholder}
        minlength=${ifDefined(this.minlength)}
        maxlength=${ifDefined(this.maxlength)}
        pattern=${ifDefined(this.pattern)}
        ?readonly=${this.readonly}
        ?disabled=${this.disabled}
        ?required=${this.required}
        @input=${this.handleChange}
        @change=${this.handleChange}
      />
      ${this.renderPasswordToggle()}
    `;
  }

  protected override renderLabel() {
    const classes = {
      label: true,
      'label-row': true,
      'has-label': this.hasLabel,
    };
    return html`
      <label for=${this.inputId} class=${classMap(classes)}>
        <slot name="label">
          <div part="label">${this.label}</div>
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

  protected renderPasswordToggle() {
    if (!this.passwordToggle) {
      return nothing;
    }

    return html`
      <yatl-button
        size="small"
        variant="plain"
        @click=${this.handlePasswordToggleClick}
      >
        <yatl-icon name=${this.hideText ? 'eye' : 'eye-slash'}></yatl-icon>
      </yatl-button>
    `;
  }

  protected handleChange(event: Event) {
    event.stopPropagation();
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.emitInteraction(event.type as 'change' | 'input');
  }

  private handlePasswordToggleClick() {
    this.hideText = !this.hideText;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-input': YatlInput;
  }
}
