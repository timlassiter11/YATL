import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { YatlBase } from '../base/base';

import { classMap } from 'lit/directives/class-map.js';
import { YatlDateSelected } from '../../events';
import {
  addDaysToDate,
  dateConverter,
  getDateOnly,
  getDaysOfWeek,
  getFirstDayOfMonth,
  getFirstDayOfWeek,
  isInDateRange,
} from '../../utils';
import { YatlButtonColor } from '../button/button';
import styles from './date-grid.styles';

export interface YatlDateGridRange {
  start?: Date;
  end?: Date;
  color: YatlButtonColor;
}

const monthYearFormatter = Intl.DateTimeFormat(undefined, {
  month: 'short',
  year: 'numeric',
});

/**
 * @fires yatl-date-selected - When the user selects a date
 */
@customElement('yatl-date-grid')
export class YatlDateGrid extends YatlBase {
  public static override styles = [...super.styles, styles];

  @state() private currentMonth = getFirstDayOfMonth(new Date());

  @property({ type: Boolean, attribute: 'highlight-today', reflect: true })
  public highlightToday = true;

  @property({ attribute: false })
  public ranges: YatlDateGridRange[] = [];

  @property({ converter: dateConverter })
  public min?: Date;

  @property({ converter: dateConverter })
  public max?: Date;

  protected override render() {
    const start = getFirstDayOfWeek(getFirstDayOfMonth(this.currentMonth));
    // Always render 6 weeks. This covers all months and prevents the size from shifting.
    const weeks = Array.from({ length: 6 }, (v, i) =>
      addDaysToDate(start, 7 * i),
    );
    const headers = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const currentMonthText = monthYearFormatter.format(this.currentMonth);
    return html`
      <div part="base" class="calendar">
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

    let isStart = false,
      isEnd = false,
      isInRange = false;
    for (const range of this.ranges) {
      if (currentTime === range.start?.getTime()) {
        isStart = true;
      }
      if (currentTime === range.end?.getTime()) {
        isEnd = true;
      }
      if (isInDateRange(date, range.start, range.end)) {
        isInRange = true;
      }
    }

    const isToday = currentTime === today.getTime();
    const isThisMonth = date.getMonth() === this.currentMonth.getMonth();

    const classes = {
      'day-button': true,
      'is-start': isStart,
      'is-end': isEnd,
      'is-in-range': isInRange,
      'is-today': isToday,
      'is-outside-month': !isThisMonth,
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
    const newStartMonth = getFirstDayOfMonth(date);
    if (newStartMonth.getTime() > this.currentMonth.getTime()) {
      // User selected a date that is in the next month/year.
      // Lets move there to make it easier on them.
      const newMonth = new Date(this.currentMonth);
      newMonth.setMonth(date.getMonth());
      newMonth.setFullYear(date.getFullYear());
      this.currentMonth = getFirstDayOfMonth(newMonth);
    }
    this.dispatchEvent(new YatlDateSelected(date));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-date-grid': YatlDateGrid;
  }
}
