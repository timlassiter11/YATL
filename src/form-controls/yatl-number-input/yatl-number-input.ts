import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { YatlFormControl } from '../yatl-form-control';
import { live } from 'lit/directives/live.js';
import styles from './yatl-number-input.styles';

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

  @property({ type: Number, attribute: 'value' })
  public defaultValue?: number;

  @property({ attribute: false })
  public value?: number;

  public get formValue() {
    return this.value ? String(this.value) : '';
  }

  protected renderInput() {
    return html`
      <input
        part="input"
        name=${this.name}
        type="number"
        size=${this.size}
        .value=${live(this.formValue)}
        min=${ifDefined(this.min)}
        max=${ifDefined(this.max)}
        ?readonly=${this.readonly}
        ?disabled=${this.disabled}
        ?required=${this.required}
      />
    `;
  }

  protected override onValueChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = Number(input.value);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-number-input': YatlNumberInput;
  }
}
