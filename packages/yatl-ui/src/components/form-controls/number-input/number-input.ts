import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { YatlFormControl } from '../form-control/form-control';
import { live } from 'lit/directives/live.js';
import styles from './number-input.styles';

/**
 * @fires input - Fired synchronously as the user types.
 * @fires change - Fired when the input value is committed (e.g., on blur).
 */
@customElement('yatl-number-input')
export class YatlNumberInput extends YatlFormControl<number> {
  public static override styles = [...super.styles, styles];

  /**
   * The placeholder text to display when the input is empty.
   * @attr placeholder
   */
  @property({ type: String })
  public placeholder = '';

  /**
   * The visual width of the input, measured in average character widths.
   * @attr size
   */
  @property({ type: Number })
  public size?: number;

  /**
   * The minimum value that the input will consider valid.
   * @attr min
   */
  @property({ type: Number })
  public min?: number;

  /**
   * The maximum value that the input will consider valid.
   * @attr max
   */
  @property({ type: Number })
  public max?: number;

  /**
   * The granularity that the value must adhere to.
   * @attr step
   */
  @property({ type: Number })
  public step?: number;

  /**
   * The number of decimal places to display when the input isn't focused.
   * @attr displayprecision
   */
  @property({ type: Number })
  public displayPrecision?: number;

  /**
   * Displays a button to toggle between showing the number and masking it.
   * @attr visibility-toggle
   */
  @property({ type: Boolean, attribute: 'visibility-toggle' })
  public visibilityToggle = false;

  /**
   * When true, masks the displayed value until toggled visible.
   * @attr hide-text
   */
  @property({ type: Boolean, attribute: 'hide-text' })
  public hideText = false;

  /**
   * The initial, uncontrolled value of the input.
   * @attr value
   */
  @property({ type: Number, attribute: 'value' })
  public defaultValue?: number;

  /** The current, controlled value of the input. */
  @property({ attribute: false })
  public value?: number;

  public get formValue() {
    return this.value !== undefined ? String(this.value) : '';
  }

  protected renderInput() {
    // Only use the display value if the user isn't editing.
    // Don't want to cut off part of the number and then submit that.
    const editing = !this.isDisabled && !this.readonly;
    let value = this.formValue;
    if (!editing && this.value !== undefined) {
      if (this.displayPrecision !== undefined) {
        const formatter = Intl.NumberFormat(undefined, {
          maximumFractionDigits: this.displayPrecision,
          minimumFractionDigits: this.displayPrecision,
        });
        value = formatter.format(this.value);
      }

      if (this.hideText) {
        value = '•'.repeat(value.length);
      }
    }

    const type = editing ? 'number' : 'text';

    return html`
      <input
        part="input"
        id=${this.inputId}
        name=${this.name}
        type=${type}
        title=${value}
        size=${ifDefined(this.size)}
        min=${ifDefined(this.min)}
        max=${ifDefined(this.max)}
        step=${ifDefined(this.step)}
        .value=${live(value)}
        autocomplete="off"
        ?readonly=${this.readonly}
        ?disabled=${this.isDisabled}
        ?required=${this.required}
        @input=${this.handleChange}
        @change=${this.handleChange}
      />
      ${this.renderVisibilityToggle()}
    `;
  }

  protected renderVisibilityToggle() {
    if (!this.visibilityToggle) {
      return nothing;
    }

    return html`
      <yatl-button
        size="small"
        variant="plain"
        part="visibility-toggle"
        ?disabled=${this.isDisabled}
        @click=${this.handleVisibilityToggleClick}
      >
        <yatl-icon name=${this.hideText ? 'eye' : 'eye-slash'}></yatl-icon>
      </yatl-button>
    `;
  }

  private handleChange(event: Event) {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.value = input.valueAsNumber;
    } else {
      this.value = undefined;
    }
    this.emitInteraction(event.type as 'change' | 'input');
  }

  private handleVisibilityToggleClick() {
    this.hideText = !this.hideText;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-number-input': YatlNumberInput;
  }
}
