import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { YatlBaseFilter } from '../base-filter/base-filter';

import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';
import {
  addDaysToDate,
  dateConverter,
  getDateOnly,
  getDaysOfWeek,
  getFirstDayOfMonth,
  getFirstDayOfWeek,
  isInDateRange,
} from '../../../utils';
import { YatlDropdown } from '../../dropdown/dropdown';
import styles from './date-range-filter.styles';

type FilterFunction = (value: Date) => boolean;

const dayFormatter = Intl.DateTimeFormat(undefined, { dateStyle: 'short' });
const monthYearFormatter = Intl.DateTimeFormat(undefined, {
  month: 'short',
  year: 'numeric',
});

@customElement('yatl-date-range-filter')
export class YatlDateRangeFilter extends YatlBaseFilter<FilterFunction> {
  public static override styles = [...super.styles, styles];

  // Store
  private originalStartDate?: Date;
  private originalEndDate?: Date;

  @state() private currentMonth = getFirstDayOfMonth(new Date());

  @state() private open = false;

  // Current values used while user is picking
  @state() private startDateDraft?: Date;
  @state() private endDateDraft?: Date;

  /**
   * The current start date
   * @attr start-date
   */
  @property({ converter: dateConverter, attribute: 'start-date' })
  public startDate?: Date;

  /**
   * The current end date
   * @attr end-date
   */
  @property({ converter: dateConverter, attribute: 'end-date' })
  public endDate?: Date;

  protected override willUpdate(
    changedProperties: PropertyValues<YatlDateRangeFilter>,
  ): void {
    super.willUpdate(changedProperties);

    if (!this.hasUpdated) {
      // Capture our original values for reset.
      this.originalStartDate = this.startDate;
      this.originalEndDate = this.endDate;
    }

    if (
      changedProperties.has('startDate') ||
      changedProperties.has('endDate')
    ) {
      this.correctRanges();
    }
  }

  protected override render() {
    const startText = this.startDate
      ? dayFormatter.format(this.startDate)
      : 'From';
    const endText = this.endDate ? dayFormatter.format(this.endDate) : 'To';
    return html`
      <yatl-dropdown
        .open=${live(this.open)}
        @yatl-dropdown-open=${this.handleDropdownToggle}
        @yatl-dropdown-close=${this.handleDropdownToggle}
      >
        <yatl-input
          part="input"
          slot="trigger"
          label=${this.label}
          value="-"
          readonly
        >
          <span slot="start">${startText}</span>
          <span slot="end">${endText}</span>
        </yatl-input>
        ${this.renderCalendar()}
      </yatl-dropdown>
    `;
  }

  private renderCalendar() {
    const start = getFirstDayOfWeek(getFirstDayOfMonth(this.currentMonth));
    // Always render 6 weeks. This covers all months and prevents the size from shifting.
    const weeks = Array.from({ length: 6 }, (v, i) =>
      addDaysToDate(start, 7 * i),
    );
    const headers = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const currentMonthText = monthYearFormatter.format(this.currentMonth);
    return html`
      <div class="calendar">
        <div class="calendar-header">
          <yatl-button
            variant="plain"
            title="Previous month"
            @click=${this.handlePreviousClick}
            ><yatl-icon name="chevron-left"></yatl-icon
          ></yatl-button>
          <yatl-button variant="plain" @click=${this.handleMonthClick}
            >${currentMonthText}</yatl-button
          >
          <yatl-button
            variant="plain"
            title="Next month"
            @click=${this.handleNextClick}
            ><yatl-icon name="chevron-right"></yatl-icon
          ></yatl-button>
        </div>
        <div class="calendar-grid" role="grid" aria-label="Calendar">
          ${this.renderRow(headers.map(h => this.renderWeekHeader(h)))}
          ${weeks.map(week => this.renderWeek(week))}
        </div>
        <div class="calendar-footer">
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
            ?disabled=${!this.startDateDraft}
            @click=${this.handleApplyClick}
            >Apply</yatl-button
          >
        </div>
      </div>
    `;
  }

  private renderWeek(date: Date) {
    const days = getDaysOfWeek(date);
    return this.renderRow(days.map(day => this.renderDay(day)));
  }

  private renderWeekHeader(day: string) {
    return html`
      <div role="columnheader" aria-label=${day} class="header-cell">
        ${day}
      </div>
    `;
  }

  private renderDay(date: Date) {
    const today = getDateOnly(new Date());
    const currentTime = date.getTime();
    const isStart = currentTime === this.startDateDraft?.getTime();
    const isEnd = currentTime === this.endDateDraft?.getTime();
    const isToday = currentTime === today.getTime();
    const isThisMonth = date.getMonth() === this.currentMonth.getMonth();

    const classes = {
      'day-button': true,
      'is-start': isStart,
      'is-end': isEnd,
      'is-today': isToday,
      'is-outside-month': !isThisMonth,
      'is-in-range': isInDateRange(
        date,
        this.startDateDraft,
        this.endDateDraft,
      ),
    };

    return this.renderCell(html`
      <yatl-button
        variant="plain"
        size="small"
        class=${classMap(classes)}
        @click=${() => this.handleDayClicked(date)}
        >${date.getDate()}</yatl-button
      >
    `);
  }

  private renderRow(contents: unknown) {
    return html`
      <div part="week" class="grid-row" role="row">${contents}</div>
    `;
  }

  private renderCell(contents: unknown) {
    return html`
      <div part="day" class="grid-cell" role="gridcell">${contents}</div>
    `;
  }

  protected override reset() {
    this.startDate = this.originalStartDate;
    this.endDate = this.originalEndDate;
    this.startDateDraft = undefined;
    this.endDateDraft = undefined;
    this.updateValue();
  }

  private handlePreviousClick() {
    const prev = new Date(this.currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    this.currentMonth = getFirstDayOfMonth(prev);
  }

  private handleNextClick() {
    const next = new Date(this.currentMonth);
    next.setMonth(next.getMonth() + 1);
    this.currentMonth = getFirstDayOfMonth(next);
  }

  private handleMonthClick() {
    // TODO: Show a month / year picker
  }

  private handleDayClicked(date: Date) {
    if (!this.startDateDraft || (this.startDateDraft && this.endDateDraft)) {
      // We don't have a start date or we have both a start and end date.
      this.startDateDraft = date;
      this.endDateDraft = undefined;
      const newStartMonth = getFirstDayOfMonth(date);
      if (newStartMonth.getTime() > this.currentMonth.getTime()) {
        // User selected a start date that is in the next month/year. Lets move there to make it easier on them.
        const newMonth = new Date(this.currentMonth);
        newMonth.setMonth(date.getMonth());
        newMonth.setFullYear(date.getFullYear());
        this.currentMonth = getFirstDayOfMonth(newMonth);
      }
    } else {
      this.endDateDraft = date;
    }
    this.correctRanges();
  }

  private handleClearClick() {
    this.reset();
    this.open = false;
  }

  private handleCancelClick() {
    this.open = false;
  }

  private handleApplyClick() {
    this.startDate = this.startDateDraft;
    this.endDate = this.endDateDraft;
    this.updateValue();
    this.open = false;
  }

  private handleDropdownToggle(event: Event) {
    const target = event.target as YatlDropdown;
    this.open = target.open;

    if (this.open) {
      this.startDateDraft = this.startDate
        ? getDateOnly(this.startDate)
        : undefined;
      this.endDateDraft = this.endDate ? getDateOnly(this.endDate) : undefined;
      this.currentMonth = getFirstDayOfMonth(this.startDate ?? new Date());
    }
  }

  private correctRanges() {
    if (
      this.startDateDraft &&
      this.endDateDraft &&
      this.endDateDraft.getTime() < this.startDateDraft.getTime()
    ) {
      // They are inverted so swap them.
      const tmp = this.startDateDraft;
      this.startDateDraft = this.endDateDraft;
      this.endDateDraft = tmp;
    }

    if (
      this.startDate &&
      this.endDate &&
      this.endDate.getTime() < this.startDate.getTime()
    ) {
      const tmp = this.startDate;
      this.startDate = this.endDate;
      this.endDate = tmp;
    }
  }

  private updateValue() {
    this.correctRanges();
    const filterFunction = (value: Date) => {
      if (!value) {
        return false;
      }

      const startDate = this.startDate;
      let endDate = this.endDate;
      // endDate should be inclusive.
      if (endDate instanceof Date) {
        // Make a copy so we don't keep increasing
        endDate = new Date(endDate);
        endDate.setDate(endDate.getDate() + 1);
      }

      if (startDate instanceof Date && endDate instanceof Date) {
        return (
          startDate.getTime() <= value.getTime() &&
          endDate.getTime() > value.getTime()
        );
      } else if (startDate instanceof Date) {
        return startDate.getTime() <= value.getTime();
      } else if (endDate) {
        return endDate.getTime() >= value.getTime();
      }
      return true;
    };

    this.value = filterFunction;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-date-range-filter': YatlDateRangeFilter;
  }
}
