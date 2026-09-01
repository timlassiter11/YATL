import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { YatlFormControl } from '../form-control/form-control';
import { live } from 'lit/directives/live.js';

export type YatlInputType =
  | 'email'
  | 'password'
  | 'search'
  | 'text'
  | 'tel'
  | 'url';

/**
 * @fires input - Fired synchronously as the user types.
 * @fires change - Fired when the input value is committed (e.g., on blur).
 */
@customElement('yatl-input')
export class YatlInput extends YatlFormControl<string> {
  /**
   * The native HTML input type (e.g., 'text', 'email', 'password', 'number').
   * @attr type
   */
  @property({ type: String })
  public type: YatlInputType = 'text';

  /**
   * Hints to the browser and password managers what kind of data should be autofilled.
   * Accepts standard HTML autocomplete tokens (e.g., 'off', 'email', 'new-password').
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete
   * @attr autocomplete
   */
  @property({ type: String, reflect: true })
  public autocomplete: AutoFill | (string & {}) = 'off';

  /**
   * The placeholder text to display when the input is empty.
   * @attr placeholder
   */
  @property({ type: String })
  public placeholder = '';

  /**
   * The visual width of the input, measured in average character widths.
   * Note: This only changes the physical width of the control; it does NOT restrict
   * the number of characters the user can type (use `maxlength` for that).
   * @attr size
   */
  @property({ type: Number })
  public size?: number;

  /**
   * The minimum string length that the input will consider valid.
   * @attr minlength
   */
  @property({ type: Number })
  public minlength?: number;

  /**
   * The maximum string length that the input will consider valid.
   * @attr maxlength
   */
  @property({ type: Number })
  public maxlength?: number;

  /**
   * A regular expression pattern to validate input against.
   * @attr pattern
   */
  @property()
  public pattern?: string;

  /**
   * Displays a button at the end of the input to toggle the visibility of the text.
   * Typically used for password fields to let the user see what they typed.
   * @attr password-toggle
   */
  @property({ type: Boolean, attribute: 'password-toggle' })
  public passwordToggle = false;

  /**
   * When `type` is `password`, controls whether the value is masked.
   * Has no effect for any other `type`.
   * @attr hide-text
   */
  @property({ type: Boolean, attribute: 'hide-text' })
  public hideText = true;

  /**
   * When true, displays a live character count at the end of the label.
   * If `maxlength` is also set, it will display the count relative to the maximum (e.g., "6/20").
   * @attr show-count
   */
  @property({ type: Boolean, attribute: 'show-count' })
  public showCount = false;

  /**
   * The initial, uncontrolled value of the input.
   * @attr value
   */
  @property({ type: String, attribute: 'value' })
  public defaultValue = '';

  /** The current, controlled value of the input. */
  @property({ attribute: false })
  public value = this.initialAttributeValue('value', '');

  public get formValue() {
    return this.value;
  }

  protected override renderInput() {
    const type =
      this.type === 'password' && !this.hideText ? 'text' : this.type;
    // Don't leak a masked password's value through the tooltip.
    const isMasked = this.type === 'password' && this.hideText;

    return html`
      <input
        part="input"
        id=${this.inputId}
        name=${this.name}
        type=${type}
        title=${ifDefined(isMasked ? undefined : this.value)}
        autocomplete=${this.autocomplete}
        size=${ifDefined(this.size)}
        .value=${live(this.value)}
        placeholder=${this.placeholder}
        minlength=${ifDefined(this.minlength)}
        maxlength=${ifDefined(this.maxlength)}
        pattern=${ifDefined(this.pattern)}
        ?readonly=${this.readonly}
        ?disabled=${this.isDisabled}
        ?required=${this.required}
        @input=${this.handleChange}
        @change=${this.handleChange}
      />
      ${this.renderPasswordToggle()}
    `;
  }

  protected override renderLabelEnd() {
    if (!this.showCount) {
      return nothing;
    }
    const count = this.maxlength
      ? `${this.value.length}/${this.maxlength}`
      : `${this.value.length}`;

    return html`<span slot="end" part="label-count">${count}</span>`;
  }

  protected renderPasswordToggle() {
    if (!this.passwordToggle) {
      return nothing;
    }

    return html`
      <yatl-button
        size="small"
        variant="plain"
        ?disabled=${this.isDisabled}
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
