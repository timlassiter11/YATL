import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
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

  public override get typedValue() {
    return dateConverter.fromAttribute(this.value) ?? null;
  }
  public override set typedValue(value) {
    this.value = dateConverter.toAttribute(value ?? undefined) ?? '';
  }

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
        .value=${live(this.value)}
        min=${ifDefined(min)}
        max=${ifDefined(max)}
        placeholder=${this.placeholder}
        ?readonly=${this.readonly}
        ?disabled=${this.disabled}
        ?required=${this.required}
      />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-date-input': YatlDateInput;
  }
}
