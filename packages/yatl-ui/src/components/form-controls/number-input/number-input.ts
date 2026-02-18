import { html } from 'lit';
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
  public size = 4;

  @property({ type: Number })
  public min?: number;

  @property({ type: Number })
  public max?: number;

  @property({ type: Number })
  public step?: number;

  @property({ type: Number })
  public displayPrecision?: number;

  @property({ type: Number, attribute: 'value' })
  public defaultValue?: number;

  @property({ attribute: false })
  public value?: number;

  public get formValue() {
    return this.value !== undefined ? String(this.value) : '';
  }

  protected renderInput() {
    let value = this.formValue;
    if (this.value !== undefined && this.displayPrecision) {
      const formatter = Intl.NumberFormat(undefined, {
        maximumFractionDigits: this.displayPrecision,
        minimumFractionDigits: this.displayPrecision,
      });
      value = formatter.format(this.value);
    }

    return html`
      <input
        part="input"
        name=${this.name}
        type="number"
        size=${this.size}
        .value=${live(value)}
        min=${ifDefined(this.min)}
        max=${ifDefined(this.max)}
        step=${ifDefined(this.step)}
        ?readonly=${this.readonly}
        ?disabled=${this.disabled}
        ?required=${this.required}
      />
    `;
  }

  protected override isValidChangeEvent(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = Number(input.value);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-number-input': YatlNumberInput;
  }
}
