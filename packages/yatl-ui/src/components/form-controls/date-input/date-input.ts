import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { dateConverter, getDateOnly } from '../../../utils';
import { YatlFormControl } from '../form-control/form-control';

import { YatlDatePicker } from '../../date-picker/date-picker';
import { YatlDropdown } from '../../dropdown/dropdown';
import styles from './date-input.styles';
import { classMap } from 'lit/directives/class-map.js';

const dayFormatter = Intl.DateTimeFormat(undefined, {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
});

@customElement('yatl-date-input')
export class YatlDateInput extends YatlFormControl<Date> {
  public static override styles = [...super.styles, styles];

  @state() private open = false;

  @property({ type: String })
  public placeholder = 'Pick a date';

  @property({ type: Number })
  public size?: number;

  @property({ converter: dateConverter, reflect: true })
  public min?: Date;

  @property({ converter: dateConverter, reflect: true })
  public max?: Date;

  @property({ converter: dateConverter, attribute: 'value' })
  public defaultValue?: Date;

  // Mutable value types need to be copied
  // so the user's changes don't mess things up.
  private _value?: Date;
  public get value() {
    return this._value ? new Date(this._value) : undefined;
  }
  @property({ attribute: false })
  public set value(value) {
    if (typeof value === 'string') {
      value = dateConverter.fromAttribute(value);
    }

    if (this._value?.getTime() === value?.getTime()) {
      return;
    }

    this._value = value ? new Date(value) : undefined;
  }

  public get formValue() {
    return dateConverter.toAttribute(this.value);
  }

  protected override renderInput() {
    const valueClasses = {
      'has-placeholder': this.value === undefined,
    };
    const valueText = this.value
      ? dayFormatter.format(this.value)
      : this.placeholder;
    return html`
      <yatl-dropdown
        .open=${live(this.open)}
        @yatl-dropdown-request=${this.handleDropdownToggle}
      >
        <button class="row" slot="trigger">
          <div class=${classMap(valueClasses)}>${valueText}</div>
          <yatl-icon name="calendar"></yatl-icon>
        </button>
        <yatl-date-picker
          .min=${this.min}
          .max=${this.max}
          .date=${this.value}
          @change=${this.handleChange}
        >
          <div slot="footer" class="footer">
            <yatl-button
              variant="plain"
              color="danger"
              size="small"
              title="Clear date"
              @click=${this.handleClearClick}
              >Clear</yatl-button
            >
          </div>
        </yatl-date-picker>
      </yatl-dropdown>
    `;
  }

  private handleChange(event: Event) {
    const target = event.target as YatlDatePicker;
    this.value = target.date;
    this.open = false;
    this.emitInteraction('change');
  }

  private handleClearClick() {
    this.value = undefined;
    this.open = false;
    this.emitInteraction('change');
  }

  private handleDropdownToggle(event: Event) {
    const target = event.target as YatlDropdown;
    this.open = target.open;
  }

  protected override updateValidity() {
    super.updateValidity();

    // If the base class already flagged an error, stop here.
    if (!this.validity.valid) {
      return;
    }

    const valueTime = this.value
      ? getDateOnly(this.value).getTime()
      : -Infinity;

    if (this.min) {
      const minTime = getDateOnly(this.min).getTime();
      if (valueTime < minTime) {
        this.setValidity(
          { rangeUnderflow: true },
          `Date must be on or after ${dayFormatter.format(this.min)}.`,
        );
        return;
      }
    }

    if (this.max) {
      const maxTime = getDateOnly(this.max).getTime();
      if (valueTime > maxTime) {
        this.setValidity(
          { rangeOverflow: true },
          `Date must be on or before ${dayFormatter.format(this.max)}.`,
        );
        return;
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-date-input': YatlDateInput;
  }
}
