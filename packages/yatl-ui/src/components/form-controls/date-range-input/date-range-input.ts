import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { dateConverter, datesEqual, getDateOnly } from '../../../utils';
import type { YatlDateRangePicker } from '../../date-range-picker/date-range-picker';
import type { YatlDropdown } from '../../dropdown/dropdown';
import {
  dateParts,
  dateToSegments,
  filledDateSegments,
  segmentsToDate,
} from '../segmented-field/date-segments';
import {
  type FieldPart,
  type SegmentValues,
  YatlSegmentedField,
} from '../segmented-field/segmented-field';

import styles from './date-range-input.styles';

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

/**
 * A start and end date, typed in parts or picked from a calendar. Either
 * end can be left empty for an open range ("after" or "before" a date).
 *
 * @fires input - Fired on every edit.
 * @fires change - Fired when a range is applied from the calendar, or
 *  focus leaves with a different range than it had.
 */
@customElement('yatl-date-range-input')
export class YatlDateRangeInput extends YatlSegmentedField<YatlDateRange> {
  public static override styles = [...super.styles, styles];

  @state() private startDateDraft?: Date;
  @state() private endDateDraft?: Date;

  @state() private open = false;

  /**
   * Formats the range a read-only or disabled input shows, e.g.
   * "After Nov 1, 2026".
   */
  @property({ attribute: false })
  public formatter: DateRangeFormatter = defaultFormatter;

  /**
   * The minimum allowable date value
   * @attr min
   */
  @property({ converter: dateConverter })
  public min?: Date;

  /**
   * The maximum allowable date value
   * @attr max
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

  /**
   * A function used to genrate the form value names
   */
  @property({ attribute: false })
  public nameFunction?: (name: string) => {
    start: string | null;
    end: string | null;
  };

  /**
   * The initial, uncontrolled value of the range. Computed automatically
   * from `startDate`/`endDate` on first render (see firstUpdated()) - only
   * set this directly if you need to override that default.
   */
  @property({ attribute: false })
  public defaultValue: YatlDateRange = {};

  /** The current, controlled value of the range. */
  public get value(): YatlDateRange | undefined {
    if (this.startDate || this.endDate) {
      return { start: this.startDate, end: this.endDate };
    }
  }

  @property({ attribute: false })
  public set value(value) {
    this.startDate = value?.start;
    this.endDate = value?.end;
  }

  public get formValue() {
    if (!this.value) {
      return null;
    }

    const names = this.nameFunction?.(this.name) ?? generateNames(this.name);

    const data = new FormData();
    if (this.startDate) {
      const startValue = dateConverter.toAttribute(this.startDate);
      if (startValue && names.start) {
        data.append(names.start, startValue);
      }
    }

    if (this.endDate) {
      const endValue = dateConverter.toAttribute(this.endDate);
      if (endValue && names.end) {
        data.append(names.end, endValue);
      }
    }
    return data;
  }

  protected override get parts(): FieldPart[] {
    return [
      ...dateParts('start'),
      // Non-breaking, since spaces at the edges of a flex item collapse
      { type: 'literal', text: ' – ' },
      ...dateParts('end'),
    ];
  }

  protected override get emptyValue() {
    return undefined;
  }

  protected override valueKey(value: YatlDateRange | undefined) {
    if (!value?.start && !value?.end) {
      return null;
    }
    return `${dateConverter.toAttribute(value.start) ?? ''}|${
      dateConverter.toAttribute(value.end) ?? ''
    }`;
  }

  protected override toSegments(value: YatlDateRange | undefined) {
    return {
      ...dateToSegments(value?.start, 'start'),
      ...dateToSegments(value?.end, 'end'),
    };
  }

  /** Each end is complete or empty, so the range can be open */
  protected override resolveSegments(values: SegmentValues) {
    let problem: 'incomplete' | 'invalid' | undefined;
    const resolve = (prefix: 'start' | 'end') => {
      const filled = filledDateSegments(values, prefix);
      if (filled === 0) return undefined;
      if (filled < 3) {
        problem ??= 'incomplete';
        return undefined;
      }
      const date = segmentsToDate(values, prefix);
      if (!date) problem ??= 'invalid';
      return date;
    };
    const start = resolve('start');
    const end = resolve('end');
    const value = problem || (!start && !end) ? undefined : { start, end };
    return { value, problem };
  }

  protected override fromSegmentValues(values: Record<string, number>) {
    return this.resolveSegments(values).value;
  }

  protected override willUpdate(changedProps: PropertyValues<this>) {
    // The value is made of startDate and endDate, so setting either one
    // from outside should update the segments like setting value does
    if (
      (changedProps.has('startDate') || changedProps.has('endDate')) &&
      !changedProps.has('value')
    ) {
      this.segmentValues = this.toSegments(this.value);
    }
    super.willUpdate(changedProps);
  }

  protected override renderInput() {
    // A read-only range reads better as a sentence than as parts
    const value = this.value;
    if ((this.readonly || this.isDisabled) && value) {
      const text = this.formatter(value) ?? '';
      return html`<div id=${this.inputId} class="formatted" title=${text}>
        ${text}
      </div>`;
    }
    return super.renderInput();
  }

  protected override renderBase(contents: unknown) {
    const hasNoSelection = !this.startDateDraft && !this.endDateDraft;
    const disabled = this.isDisabled || this.readonly;

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
            title="Pick dates"
            aria-label="Pick dates"
            ?disabled=${disabled}
          >
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
                ?disabled=${this.isDisabled}
                @click=${this.handleClearClick}
                >Clear</yatl-button
              >
              <div class="spacer"></div>
              <yatl-button
                variant="plain"
                color="muted"
                size="small"
                title="Cancel"
                ?disabled=${this.isDisabled}
                @click=${this.handleCancelClick}
                >Cancel</yatl-button
              >
              <yatl-button
                variant="neutral"
                color="brand"
                size="small"
                title="Apply"
                ?disabled=${hasNoSelection || this.isDisabled}
                @click=${this.handleApplyClick}
                >Apply</yatl-button
              >
            </div>
          </yatl-date-range-picker>
        </yatl-dropdown>
        <slot part="end" class="input-end" name="end"></slot>
      </div>
    `;
  }

  private pick(range: YatlDateRange | undefined) {
    if (this.isDisabled) {
      return;
    }
    this.setFromPicker(range);
    this.commitChange();
    this.open = false;
  }

  private handleClearClick() {
    this.startDateDraft = undefined;
    this.endDateDraft = undefined;
    this.pick(undefined);
  }

  private handleCancelClick() {
    this.open = false;
  }

  private handleApplyClick() {
    this.pick({ start: this.startDateDraft, end: this.endDateDraft });
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
      // So the arrow keys move around the calendar right away
      this.renderRoot.querySelector('yatl-date-range-picker')?.focusCalendar();
    }
  }

  protected override updateValueValidity() {
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
    this.segmentValues = this.toSegments(this.value);
  }

  protected override firstUpdated(
    changedProps: PropertyValues<YatlDateRangeInput>,
  ) {
    super.firstUpdated(changedProps);
    // Capture whatever start/end date ended up set by the time we first
    // render as the "default" to revert to on form reset. This has to
    // happen here rather than as a field initializer, since startDate/
    // endDate may have been set via JS properties before the element was
    // even connected - reading attributes in the constructor would miss
    // that and always compute an empty default.
    if (!this.startDate && !this.endDate) {
      return;
    }
    this.defaultValue = { start: this.startDate, end: this.endDate };
  }
}

function generateNames(name: string) {
  return {
    start: name ? `${name}_start` : 'start',
    end: name ? `${name}_end` : 'end',
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-date-range-input': YatlDateRangeInput;
  }
}
