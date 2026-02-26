import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { YatlFormControl } from '../form-control/form-control';
import { live } from 'lit/directives/live.js';
import styles from './number-input.styles';

@customElement('yatl-number-input')
export class YatlNumberInput extends YatlFormControl<number> {
  public static override styles = [...super.styles, styles];

  @property({ type: String })
  public placeholder = '';

  @property({ type: Number })
  public size?: number;

  @property({ type: Number })
  public min?: number;

  @property({ type: Number })
  public max?: number;

  @property({ type: Number })
  public step?: number;

  @property({ type: Number })
  public displayPrecision?: number;

  @property({ type: Boolean, attribute: 'visibility-toggle' })
  public visibilityToggle = false;

  @property({ type: Boolean, attribute: 'hide-text' })
  public hideText = false;

  @property({ type: Number, attribute: 'value' })
  public defaultValue?: number;

  @property({ attribute: false })
  public value?: number;

  public get formValue() {
    return this.value !== undefined ? String(this.value) : '';
  }

  protected renderInput() {
    // Only use the display value if the user isn't editing.
    // Don't want to cut off part of the number and then submit that.
    const editing = !this.disabled && !this.readonly;
    let value = this.formValue;
    if (!editing && this.value !== undefined && this.displayPrecision) {
      const formatter = Intl.NumberFormat(undefined, {
        maximumFractionDigits: this.displayPrecision,
        minimumFractionDigits: this.displayPrecision,
      });
      value = formatter.format(this.value);
    }

    const type = this.hideText ? 'password' : editing ? 'number' : 'text';

    return html`
      <input
        part="input"
        name=${this.name}
        type=${type}
        size=${ifDefined(this.size)}
        min=${ifDefined(this.min)}
        max=${ifDefined(this.max)}
        step=${ifDefined(this.step)}
        .value=${live(value)}
        ?readonly=${this.readonly}
        ?disabled=${this.disabled}
        ?required=${this.required}
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
        @click=${this.handleVisibilityToggleClick}
      >
        <yatl-icon name=${this.hideText ? 'eye' : 'eye-slash'}></yatl-icon>
      </yatl-button>
    `;
  }

  protected override isValidChangeEvent(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = Number(input.value);
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
