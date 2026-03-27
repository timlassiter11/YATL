import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { dateConverter, datesEqual, getDateOnly } from '../../../utils';
import { YatlDateRangePicker } from '../../date-range-picker/date-range-picker';
import { YatlDropdown } from '../../dropdown/dropdown';
import { YatlFormControl } from '../form-control/form-control';
import styles from './date-range-input.styles';
import { classMap } from 'lit/directives/class-map.js';

export interface YatlDateRange {
  start?: Date;
  end?: Date;
}

export type DateRangeFormatter = (range: YatlDateRange) => string | undefined;

const dayFormatter = Intl.DateTimeFormat(undefined, {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
});

const mediumFormatter = Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
});

const defaultFormatter: DateRangeFormatter = range => {
  if (range.start && !range.end) {
    return `After ${mediumFormatter.format(range.start)}`;
  } else if (range.end && !range.start) {
    return `Before ${mediumFormatter.format(range.end)}`;
  } else if (datesEqual(range.start, range.end)) {
    return mediumFormatter.format(range.start);
  } else {
    return `${dayFormatter.format(range.start)} - ${dayFormatter.format(
      range.end,
    )}`;
  }
};

@customElement('yatl-date-range-input')
export class YatlDateRangeInput extends YatlFormControl<YatlDateRange> {
  public static override styles = [...super.styles, styles];

  @state() private startDateDraft?: Date;
  @state() private endDateDraft?: Date;

  @state() private open = false;

  @property({ type: String })
  public placeholder = 'Pick a range';

  @property({ attribute: false })
  public formatter: DateRangeFormatter = defaultFormatter;

  @property({ type: Number })
  public size?: number;

  /**
   * The minimum allowable date value
   */
  @property({ converter: dateConverter })
  public min?: Date;

  /**
   * The maximum allowable date value
   */
  @property({ converter: dateConverter })
  public max?: Date;

  /**
   * The current start date for the range
   * @attr start-date
   */
  @property({ converter: dateConverter, attribute: 'start-date' })
  public startDate?: Date;

  /**
   * The current end date for the range
   * @attr end-date
   */
  @property({ converter: dateConverter, attribute: 'end-date' })
  public endDate?: Date;

  @property({ attribute: false })
  public defaultValue: YatlDateRange = {
    start: dateConverter.fromAttribute(this.getAttribute('start-date') ?? ''),
    end: dateConverter.fromAttribute(this.getAttribute('end-date') ?? ''),
  };

  public get value(): YatlDateRange | undefined {
    if (this.startDate || this.endDate) {
      return { start: this.startDate, end: this.endDate };
    }
  }

  @property({ attribute: false })
  public set value(value) {
    if (!value) {
      this.startDate = undefined;
      this.endDate = undefined;
      return;
    }

    const { start, end } = value;
    this.startDate = start;
    this.endDate = end;
  }

  public get formValue() {
    if (!this.name || !this.value) {
      return null;
    }

    const data = new FormData();
    if (this.startDate) {
      const startValue = dateConverter.toAttribute(this.startDate);
      if (startValue) {
        data.append(`${this.name}_start`, startValue);
      }
    }

    if (this.endDate) {
      const endValue = dateConverter.toAttribute(this.endDate);
      if (endValue) {
        data.append(`${this.name}_end`, endValue);
      }
    }
    return data;
  }

  protected override renderInput() {
    const valueClasses = {
      value: true,
      'has-placeholder': !this.value,
    };

    const valueText = this.value
      ? this.formatter(this.value)!
      : this.placeholder;

    const hasNoSelection = !this.startDateDraft && !this.endDateDraft;

    return html`
      <yatl-dropdown
        .open=${live(this.open)}
        @yatl-dropdown-open=${this.handleDropdownToggle}
        @yatl-dropdown-close=${this.handleDropdownToggle}
      >
        <button class="row" slot="trigger">
          <span class=${classMap(valueClasses)} title=${valueText}>
            ${valueText}
          </span>
          <yatl-icon name="calendar"></yatl-icon>
        </button>
        <yatl-date-range-picker
          .min=${this.min}
          .max=${this.max}
          .startDate=${this.startDateDraft}
          .endDate=${this.endDateDraft}
          @change=${this.handleDatePickerChange}
          ><div class="footer" slot="footer">
            <yatl-button
              variant="plain"
              color="danger"
              size="small"
              title="Clear dates"
              @click=${this.handleClearClick}
              >Clear</yatl-button
            >
            <div class="spacer"></div>
            <yatl-button
              variant="plain"
              color="muted"
              size="small"
              title="Cancel"
              @click=${this.handleCancelClick}
              >Cancel</yatl-button
            >
            <yatl-button
              variant="neutral"
              color="brand"
              size="small"
              title="Apply"
              ?disabled=${hasNoSelection}
              @click=${this.handleApplyClick}
              >Apply</yatl-button
            >
          </div>
        </yatl-date-range-picker>
      </yatl-dropdown>
    `;
  }

  private handleClearClick() {
    this.value = undefined;
    this.startDateDraft = undefined;
    this.endDateDraft = undefined;
    this.open = false;
    this.emitInteraction('change');
  }

  private handleCancelClick() {
    this.open = false;
  }

  private handleApplyClick() {
    this.startDate = this.startDateDraft;
    this.endDate = this.endDateDraft;
    this.open = false;
    this.emitInteraction('change');
  }

  private handleDatePickerChange(event: Event) {
    event.stopPropagation();
    const target = event.target as YatlDateRangePicker;
    this.startDateDraft = target.startDate;
    this.endDateDraft = target.endDate;
  }

  private handleDropdownToggle(event: Event) {
    const target = event.target as YatlDropdown;
    this.open = target.open;

    if (this.open) {
      this.startDateDraft = this.startDate
        ? getDateOnly(this.startDate)
        : undefined;
      this.endDateDraft = this.endDate ? getDateOnly(this.endDate) : undefined;
    }
  }

  protected override updateValidity() {
    super.updateValidity();

    // If the base class already flagged an error, stop here.
    if (!this.validity.valid) {
      return;
    }

    const startTime = this.startDate
      ? getDateOnly(this.startDate).getTime()
      : -Infinity;

    const endTime = this.endDate
      ? getDateOnly(this.endDate).getTime()
      : Infinity;

    if (this.min) {
      const minTime = getDateOnly(this.min).getTime();
      if (startTime < minTime || endTime < minTime) {
        this.setValidity(
          { rangeUnderflow: true },
          `Date must be on or after ${dayFormatter.format(this.min)}.`,
        );
        return;
      }
    }

    if (this.max) {
      const maxTime = getDateOnly(this.max).getTime();
      if (startTime > maxTime || endTime > maxTime) {
        this.setValidity(
          { rangeOverflow: true },
          `Date must be on or before ${dayFormatter.format(this.max)}.`,
        );
        return;
      }
    }

    if (
      this.startDate &&
      this.endDate &&
      this.startDate.getTime() > this.endDate.getTime()
    ) {
      this.setValidity(
        { badInput: true },
        'Start date cannot be after the end date.',
      );
      return;
    }
  }

  protected override onFormReset(): void {
    if (this.defaultValue) {
      this.value = this.defaultValue;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-date-range-input': YatlDateRangeInput;
  }
}
