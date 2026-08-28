import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlFormControl } from '../form-control/form-control';
import { live } from 'lit/directives/live.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import styles from './textarea.styles';

/**
 * @fires input - Fired synchronously as the user types.
 * @fires change - Fired when the input value is committed (e.g., on blur).
 */
@customElement('yatl-textarea')
export class YatlTextArea extends YatlFormControl {
  public static override styles = [...super.styles, styles];

  /**
   * The number of visible text lines.
   * @attr rows
   */
  @property({ type: Number })
  public rows?: number;

  /**
   * The placeholder text to display when the input is empty.
   * @attr placeholder
   */
  @property({ type: String })
  public placeholder = '';

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
   * The initial, uncontrolled value of the textarea.
   * @attr value
   */
  @property({ type: String, attribute: 'value' })
  public defaultValue = '';

  /** The current, controlled value of the textarea. */
  @property({ attribute: false })
  public value = '';

  public get formValue() {
    return this.value;
  }

  protected override render() {
    return html`
      ${this.renderLabel()}
      <div part="base">${this.renderInput()}</div>
      ${this.renderHint()} ${this.renderErrorText()}
    `;
  }

  protected override renderInput() {
    return html`
      <textarea
        part="input"
        class="text-input"
        id=${this.inputId}
        name=${this.name}
        placeholder=${this.placeholder}
        minlength=${ifDefined(this.minlength)}
        maxlength=${ifDefined(this.maxlength)}
        rows=${ifDefined(this.rows)}
        .value=${live(this.value)}
        ?readonly=${this.readonly}
        ?disabled=${this.disabled}
        ?required=${this.required}
        @input=${this.handleChange}
        @change=${this.handleChange}
      ></textarea>
    `;
  }

  private handleChange(event: Event) {
    event.stopPropagation();
    this.value = (event.target as HTMLTextAreaElement).value;
    this.emitInteraction(event.type as 'change' | 'input');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-textarea': YatlTextArea;
  }
}
