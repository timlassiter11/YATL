import { html, PropertyValues } from 'lit';
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

  // Tracks the selection/bounds used the last time we picked
  // `currentMonth` for the user, so we can tell a *meaningful* change
  // (a new selection, or min/max moving while nothing is selected) apart
  // from an unrelated re-render - see willUpdate().
  private lastSelectionTime?: number;
  private lastMinTime?: number;
  private lastMaxTime?: number;

  /**
   * When true, today's date is visually highlighted.
   * @attr highlight-today
   */
  @property({ type: Boolean, attribute: 'highlight-today', reflect: true })
  public highlightToday = true;

  /** Date ranges to highlight on the grid, each rendered in the given color. */
  @property({ attribute: false })
  public ranges: YatlDateGridRange[] = [];

  /**
   * The earliest selectable date.
   * @attr min
   */
  @property({ converter: dateConverter })
  public min?: Date;

  /**
   * The latest selectable date.
   * @attr max
   */
  @property({ converter: dateConverter })
  public max?: Date;

  private get minTime() {
    return this.min ? getDateOnly(this.min).getTime() : undefined;
  }

  private get maxTime() {
    return this.max ? getDateOnly(this.max).getTime() : undefined;
  }

  private get minMonthTime() {
    return this.min ? getFirstDayOfMonth(this.min).getTime() : undefined;
  }

  private get maxMonthTime() {
    return this.max ? getFirstDayOfMonth(this.max).getTime() : undefined;
  }

  protected override willUpdate(
    changedProperties: PropertyValues<YatlDateGrid>,
  ): void {
    super.willUpdate(changedProperties);

    const selection = this.ranges[0]?.start ?? this.ranges[0]?.end;
    const selectionTime = selection?.getTime();
    const minTime = this.minTime;
    const maxTime = this.maxTime;

    // Jump to a relevant month whenever we haven't shown anything yet, a
    // selection appears/changes/clears, or (while nothing is selected)
    // min/max moves - e.g. a filter's computed bounds settling after we
    // first rendered. Comparing values (not changedProperties) matters
    // here since consumers like yatl-date-range-picker rebuild `ranges`
    // as a fresh array on every render, so reference equality alone would
    // fire constantly.
    const selectionChanged = selectionTime !== this.lastSelectionTime;
    const boundsChanged =
      minTime !== this.lastMinTime || maxTime !== this.lastMaxTime;

    if (
      !this.hasUpdated ||
      selectionChanged ||
      (boundsChanged && selection === undefined)
    ) {
      this.currentMonth = this.getRelevantMonth(selection);
    }

    this.lastSelectionTime = selectionTime;
    this.lastMinTime = minTime;
    this.lastMaxTime = maxTime;
  }

  /**
   * Picks the most useful month to display: the current selection's month
   * if there is one, otherwise today's month if it falls within min/max,
   * otherwise the nearest bound. Without this, a picker whose selectable
   * range is far from today would open on today's month with every day
   * disabled, forcing the user to page through months by hand to reach
   * anything they can actually pick.
   */
  private getRelevantMonth(selection: Date | undefined): Date {
    if (selection) {
      return getFirstDayOfMonth(selection);
    }

    const today = getDateOnly(new Date());
    if (this.minTime !== undefined && today.getTime() < this.minTime) {
      return getFirstDayOfMonth(this.min!);
    }
    if (this.maxTime !== undefined && today.getTime() > this.maxTime) {
      return getFirstDayOfMonth(this.max!);
    }
    return getFirstDayOfMonth(today);
  }

  protected override render() {
    const normalizedRanges: YatlDateGridRange[] = this.ranges.map(range => ({
      start: range.start ? getDateOnly(range.start) : undefined,
      end: range.end ? getDateOnly(range.end) : undefined,
      color: range.color,
    }));

    const currentMonthTime = this.currentMonth.getTime();
    const currentMonthText = monthYearFormatter.format(this.currentMonth);
    const minMonthTime = this.minMonthTime;
    const maxMonthTime = this.maxMonthTime;

    const disablePrev = !!minMonthTime && currentMonthTime <= minMonthTime;
    const disableNext = !!maxMonthTime && currentMonthTime >= maxMonthTime;

    const start = getFirstDayOfWeek(this.currentMonth);
    // Always render 6 weeks. This covers all months and prevents the size from shifting.
    const weeks = Array.from({ length: 6 }, (v, i) =>
      addDaysToDate(start, 7 * i),
    );
    const headers = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return html`
      <div part="base" class="base">
        <div part="navigation" class="navigation">
          <yatl-button
            part="navigation-button previous-button"
            variant="plain"
            title="Previous month"
            ?disabled=${disablePrev}
            @click=${this.handlePreviousClick}
            ><yatl-icon name="chevron-left"></yatl-icon
          ></yatl-button>
          <yatl-button
            part="navigation-button month-button"
            variant="plain"
            @click=${this.handleMonthClick}
            >${currentMonthText}</yatl-button
          >
          <yatl-button
            part="navigation-button next-button"
            variant="plain"
            title="Next month"
            ?disabled=${disableNext}
            @click=${this.handleNextClick}
            ><yatl-icon name="chevron-right"></yatl-icon
          ></yatl-button>
        </div>
        <slot name="toolbar"></slot>
        <div part="calendar" class="calendar" role="grid" aria-label="Calendar">
          ${this.renderRow(headers.map(h => this.renderWeekHeader(h)))}
          ${weeks.map(week => this.renderWeek(week, normalizedRanges))}
        </div>
        <slot name="footer"></slot>
      </div>
    `;
  }

  private renderWeek(date: Date, ranges: YatlDateGridRange[]) {
    const days = getDaysOfWeek(date);
    return this.renderRow(days.map(day => this.renderDay(day, ranges)));
  }

  private renderWeekHeader(day: string) {
    return html`
      <div part="weekday" class="weekday" role="columnheader" aria-label=${day}>
        ${day}
      </div>
    `;
  }

  private renderDay(date: Date, ranges: YatlDateGridRange[]) {
    const today = getDateOnly(new Date());
    const currentTime = date.getTime();
    const minTime = this.minTime;
    const maxTime = this.maxTime;

    let isStart = false,
      isEnd = false,
      isInRange = false;
    for (const range of ranges) {
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

    let isDisabled = false;
    if (minTime && currentTime < minTime) {
      isDisabled = true;
    }

    if (maxTime && currentTime > maxTime) {
      isDisabled = true;
    }

    const classes = {
      'day-button': true,
      'is-start': isStart,
      'is-end': isEnd,
      'is-in-range': isInRange,
      'is-today': isToday,
      'is-outside-month': !isThisMonth,
    };

    return html`
      <div part="day-cell" class="day-cell" role="gridcell">
        <yatl-button
          variant="plain"
          size="small"
          part="day-button"
          class=${classMap(classes)}
          ?disabled=${isDisabled}
          @click=${() => this.handleDayClicked(date)}
          >${date.getDate()}</yatl-button
        >
      </div>
    `;
  }

  private renderRow(contents: unknown) {
    return html` <div part="week" class="week" role="row">${contents}</div> `;
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
    if (newStartMonth.getTime() !== this.currentMonth.getTime()) {
      // User selected a date outside the currently displayed month
      // (a leading/trailing day from the previous/next month).
      // Lets move there to make it easier on them.
      this.currentMonth = newStartMonth;
    }
    this.dispatchEvent(new YatlDateSelected(date));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-date-grid': YatlDateGrid;
  }
}
