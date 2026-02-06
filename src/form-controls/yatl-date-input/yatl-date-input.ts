import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { YatlFormControl } from '../yatl-form-control';

import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { dateConverter } from '../../utils';
import styles from './yatl-date-input.styles';

@customElement('yatl-date-input')
export class YatlDateInput extends YatlFormControl<Date> {
  public static override styles = [...YatlFormControl.styles, styles];

  @property({ type: String })
  public placeholder = '';

  @property({ converter: dateConverter, reflect: true })
  public min?: Date;

  @property({ converter: dateConverter, reflect: true })
  public max?: Date;

  @property({ converter: dateConverter, attribute: 'value' })
  public defaultValue?: Date;

  // Mutable value types need to be copied
  // so the user's changes don't mess things up.
  private _value?: Date;
  @property({ attribute: false})
  public get value() {
    return this._value ? new Date(this._value) : undefined;
  }
  public set value(value) {
    const oldValue = this._value;
    if (oldValue?.getTime() === value?.getTime()) {
      return;
    }

    this._value = value ? new Date(value) : undefined;
    this.requestUpdate('value', oldValue);
  }

  public get formValue() {
    return dateConverter.toAttribute(this.value);
  }

  public formResetCallback() {}

  protected override renderInput(id: string) {
    // Unfortunately we have to calculate the attributes for each render
    // because they aren't reflected back during the render cycle.
    const min = dateConverter.toAttribute(this.min) ?? undefined;
    const max = dateConverter.toAttribute(this.max) ?? undefined;
    return html`
      <input
        part="input"
        id=${id}
        name=${this.name}
        type="date"
        .value=${live(this.formValue ?? '')}
        min=${ifDefined(min)}
        max=${ifDefined(max)}
        placeholder=${this.placeholder}
        ?readonly=${this.readonly}
        ?disabled=${this.disabled}
        ?required=${this.required}
      />
    `;
  }

  protected override onValueChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = dateConverter.fromAttribute(input.value);
  } 
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-date-input': YatlDateInput;
  }
}
