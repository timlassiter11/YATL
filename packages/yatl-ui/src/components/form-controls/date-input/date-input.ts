import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { dateConverter, getDateOnly } from '../../../utils';
import type { YatlDatePicker } from '../../date-picker/date-picker';
import type { YatlDropdown } from '../../dropdown/dropdown';
import {
  dateParts,
  dateToSegments,
  segmentsToDate,
} from '../segmented-field/date-segments';
import {
  type FieldPart,
  type SegmentValues,
  YatlSegmentedField,
} from '../segmented-field/segmented-field';

import styles from './date-input.styles';

const dayFormatter = Intl.DateTimeFormat(undefined, {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
});

/**
 * A date, typed in parts (month, day and year in the locale's order) or
 * picked from a calendar.
 *
 * @fires input - Fired on every edit.
 * @fires change - Fired when a date is picked, or focus leaves with a
 *  different date than it had.
 */
@customElement('yatl-date-input')
export class YatlDateInput extends YatlSegmentedField<Date> {
  public static override styles = [...super.styles, styles];

  @state() private open = false;

  /**
   * The earliest selectable date.
   * @attr min
   */
  @property({ converter: dateConverter, reflect: true })
  public min?: Date;

  /**
   * The latest selectable date.
   * @attr max
   */
  @property({ converter: dateConverter, reflect: true })
  public max?: Date;

  /**
   * Shows a Clear button in the calendar. Backspace clears the typed parts
   * either way.
   * @attr clearable
   */
  @property({ type: Boolean })
  public clearable = false;

  /**
   * The initial, uncontrolled value of the input.
   * @attr value
   */
  @property({ converter: dateConverter, attribute: 'value' })
  public defaultValue?: Date;

  // Mutable value types need to be copied
  // so the user's changes don't mess things up.
  private _value?: Date;
  /** The current, controlled value of the input. */
  public get value() {
    return this._value ? new Date(this._value) : undefined;
  }
  @property({ attribute: false })
  public set value(value) {
    if (typeof value === 'string') {
      value = dateConverter.fromAttribute(value);
    }
    this._value = value ? new Date(value) : undefined;
  }

  public get formValue() {
    return dateConverter.toAttribute(this.value);
  }

  protected override get parts(): FieldPart[] {
    return dateParts();
  }

  protected override get emptyValue() {
    return undefined;
  }

  protected override valueKey(value: Date | undefined) {
    return dateConverter.toAttribute(value);
  }

  protected override toSegments(value: Date | undefined): SegmentValues {
    return dateToSegments(value);
  }

  protected override fromSegmentValues(values: Record<string, number>) {
    return segmentsToDate(values);
  }

  protected override renderBase(contents: unknown) {
    const disabled = this.isDisabled || this.readonly;
    const today = getDateOnly(new Date());
    const todayAllowed =
      (!this.min || today >= getDateOnly(this.min)) &&
      (!this.max || today <= getDateOnly(this.max));

    return html`
      <div part="input" class="input">
        <slot part="start" class="input-start" name="start"></slot>
        ${contents}
        <yatl-dropdown
          part="picker"
          .open=${live(this.open)}
          @yatl-dropdown-toggle=${this.handleDropdownToggle}
        >
          <button
            slot="trigger"
            part="picker-button"
            class="trigger-button"
            type="button"
            title="Pick a date"
            aria-label="Pick a date"
            ?disabled=${disabled}
          >
            <yatl-icon name="calendar"></yatl-icon>
          </button>
          <yatl-date-picker
            .min=${this.min}
            .max=${this.max}
            .date=${this.value}
            @change=${this.handlePickerChange}
          >
            <div slot="footer" class="footer">
              ${this.clearable
                ? html`<yatl-button
                    part="clear-button"
                    variant="plain"
                    color="danger"
                    size="small"
                    title="Clear date"
                    ?disabled=${disabled}
                    @click=${this.handleClearClick}
                    >Clear</yatl-button
                  >`
                : nothing}
              <yatl-button
                part="today-button"
                variant="plain"
                size="small"
                title=${todayAllowed ? 'Pick today' : "Today isn't allowed"}
                ?disabled=${disabled || !todayAllowed}
                @click=${this.handleTodayClick}
                >Today</yatl-button
              >
            </div>
          </yatl-date-picker>
        </yatl-dropdown>
        <slot part="end" class="input-end" name="end"></slot>
      </div>
    `;
  }

  private pick(date: Date | undefined) {
    if (this.isDisabled || this.readonly) {
      return;
    }
    this.setFromPicker(date);
    this.commitChange();
    this.open = false;
  }

  private handlePickerChange(event: Event) {
    event.stopPropagation();
    this.pick((event.target as YatlDatePicker).date);
  }

  private handleClearClick() {
    this.pick(undefined);
  }

  private handleTodayClick() {
    this.pick(getDateOnly(new Date()));
  }

  private handleDropdownToggle(event: Event) {
    this.open = (event.target as YatlDropdown).open;
    if (this.open) {
      // So the arrow keys move around the calendar right away
      this.renderRoot.querySelector('yatl-date-picker')?.focusCalendar();
    }
  }

  protected override updateValueValidity() {
    if (!this.value) {
      return;
    }
    const time = getDateOnly(this.value).getTime();
    if (this.min && time < getDateOnly(this.min).getTime()) {
      this.setValidity(
        { rangeUnderflow: true },
        `Date must be on or after ${dayFormatter.format(this.min)}.`,
      );
    } else if (this.max && time > getDateOnly(this.max).getTime()) {
      this.setValidity(
        { rangeOverflow: true },
        `Date must be on or before ${dayFormatter.format(this.max)}.`,
      );
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-date-input': YatlDateInput;
  }
}
