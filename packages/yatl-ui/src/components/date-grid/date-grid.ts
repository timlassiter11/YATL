import { html, nothing, PropertyValues } from 'lit';
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

const monthFormatter = Intl.DateTimeFormat(undefined, { month: 'short' });

/** For screen readers, e.g. "Wednesday, November 11, 2026" */
const fullDateFormatter = Intl.DateTimeFormat(undefined, {
  dateStyle: 'full',
});

/** What the grid shows: days of a month, months of a year, or years */
type YatlDateGridView = 'days' | 'months' | 'years';

/** Years shown at once in the year view */
const YEARS_PER_PAGE = 12;

/** Keys that move the focused day, and by how many days */
const DAY_KEYS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

function addMonths(date: Date, months: number) {
  const result = new Date(date.getFullYear(), date.getMonth() + months, 1);
  // Keep the day, but not past the end of the new month (Jan 31 -> Feb 28)
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(date.getDate(), lastDay));
  return result;
}

/**
 * A month of days to pick from. Click the month to pick a month or year
 * instead.
 *
 * The days are a grid you can move around with the keyboard: arrow keys
 * move a day or a week, Home and End go to the start and end of the week,
 * Page Up and Page Down change the month (with Shift, the year), and
 * Enter or Space picks the day.
 *
 * @fires yatl-date-selected - When the user selects a date
 */
@customElement('yatl-date-grid')
export class YatlDateGrid extends YatlBase {
  public static override styles = [...super.styles, styles];

  @state() private currentMonth = getFirstDayOfMonth(new Date());
  @state() private view: YatlDateGridView = 'days';
  /** The day keyboard focus is on, or would go to when tabbing in */
  @state() private focusedDate?: Date;
  /** The first year on the year view's page */
  @state() private yearPageStart = 0;

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

    const { title, previousTitle, nextTitle, disablePrev, disableNext } =
      this.navigation;

    return html`
      <div part="base" class="base" @keydown=${this.handleViewKeyDown}>
        <div part="navigation" class="navigation">
          <yatl-button
            part="navigation-button previous-button"
            variant="plain"
            title=${previousTitle}
            ?disabled=${disablePrev}
            @click=${this.handlePreviousClick}
            ><yatl-icon name="chevron-left"></yatl-icon
          ></yatl-button>
          <yatl-button
            part="navigation-button month-button"
            variant="plain"
            title=${this.view === 'days'
              ? 'Pick a month'
              : this.view === 'months'
              ? 'Pick a year'
              : ''}
            ?disabled=${this.view === 'years'}
            aria-live="polite"
            @click=${this.handleMonthClick}
            >${title}</yatl-button
          >
          <yatl-button
            part="navigation-button next-button"
            variant="plain"
            title=${nextTitle}
            ?disabled=${disableNext}
            @click=${this.handleNextClick}
            ><yatl-icon name="chevron-right"></yatl-icon
          ></yatl-button>
        </div>
        <slot name="toolbar"></slot>
        ${this.view === 'days'
          ? this.renderDays(normalizedRanges)
          : this.view === 'months'
          ? this.renderMonths()
          : this.renderYears()}
        <slot name="footer"></slot>
      </div>
    `;
  }

  /** The header's title and arrows for the current view */
  private get navigation() {
    const year = this.currentMonth.getFullYear();
    const minYear = this.min?.getFullYear();
    const maxYear = this.max?.getFullYear();

    if (this.view === 'months') {
      return {
        title: String(year),
        previousTitle: 'Previous year',
        nextTitle: 'Next year',
        disablePrev: minYear !== undefined && year <= minYear,
        disableNext: maxYear !== undefined && year >= maxYear,
      };
    }
    if (this.view === 'years') {
      const last = this.yearPageStart + YEARS_PER_PAGE - 1;
      return {
        title: `${this.yearPageStart} – ${last}`,
        previousTitle: 'Previous years',
        nextTitle: 'Next years',
        disablePrev: minYear !== undefined && this.yearPageStart <= minYear,
        disableNext: maxYear !== undefined && last >= maxYear,
      };
    }

    const currentMonthTime = this.currentMonth.getTime();
    const minMonthTime = this.minMonthTime;
    const maxMonthTime = this.maxMonthTime;
    return {
      title: monthYearFormatter.format(this.currentMonth),
      previousTitle: 'Previous month',
      nextTitle: 'Next month',
      disablePrev: !!minMonthTime && currentMonthTime <= minMonthTime,
      disableNext: !!maxMonthTime && currentMonthTime >= maxMonthTime,
    };
  }

  private renderDays(ranges: YatlDateGridRange[]) {
    const start = getFirstDayOfWeek(this.currentMonth);
    // Always render 6 weeks. This covers all months and prevents the size from shifting.
    const weeks = Array.from({ length: 6 }, (v, i) =>
      addDaysToDate(start, 7 * i),
    );
    const headers = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return html`
      <div
        part="calendar"
        class="calendar"
        role="grid"
        aria-label=${monthYearFormatter.format(this.currentMonth)}
        @keydown=${this.handleDayKeyDown}
        @focusin=${this.handleDayFocusIn}
      >
        ${this.renderRow(headers.map(h => this.renderWeekHeader(h)))}
        ${weeks.map(week => this.renderWeek(week, ranges))}
      </div>
    `;
  }

  private renderMonths() {
    const year = this.currentMonth.getFullYear();
    const selected = this.selection;
    return html`
      <div
        part="picker months"
        class="picker"
        role="listbox"
        aria-label="Months"
      >
        ${Array.from({ length: 12 }, (_, month) => {
          const first = new Date(year, month, 1);
          const last = new Date(year, month + 1, 0);
          const disabled =
            (this.minTime !== undefined && last.getTime() < this.minTime) ||
            (this.maxTime !== undefined && first.getTime() > this.maxTime);
          const isSelected =
            selected?.getFullYear() === year && selected.getMonth() === month;
          return html`<yatl-button
            part="picker-button month-option"
            class=${classMap({
              'picker-button': true,
              'is-selected': isSelected,
            })}
            variant="plain"
            size="small"
            role="option"
            aria-selected=${isSelected ? 'true' : 'false'}
            ?disabled=${disabled}
            @click=${() => this.handleMonthPicked(month)}
            >${monthFormatter.format(first)}</yatl-button
          >`;
        })}
      </div>
    `;
  }

  private renderYears() {
    const selectedYear = this.selection?.getFullYear();
    const minYear = this.min?.getFullYear();
    const maxYear = this.max?.getFullYear();
    return html`
      <div part="picker years" class="picker" role="listbox" aria-label="Years">
        ${Array.from({ length: YEARS_PER_PAGE }, (_, i) => {
          const year = this.yearPageStart + i;
          const disabled =
            (minYear !== undefined && year < minYear) ||
            (maxYear !== undefined && year > maxYear);
          const isSelected = year === selectedYear;
          return html`<yatl-button
            part="picker-button year-option"
            class=${classMap({
              'picker-button': true,
              'is-selected': isSelected,
            })}
            variant="plain"
            size="small"
            role="option"
            aria-selected=${isSelected ? 'true' : 'false'}
            ?disabled=${disabled}
            @click=${() => this.handleYearPicked(year)}
            >${year}</yatl-button
          >`;
        })}
      </div>
    `;
  }

  /** The first selected date, if any */
  private get selection() {
    return this.ranges[0]?.start ?? this.ranges[0]?.end;
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

    // Only one day is in the tab order. The arrow keys move between them.
    // A host with tabindex -1 takes its button out of the tab order.
    const isFocusTarget = currentTime === this.rovingDate.getTime();

    return html`
      <div
        part="day-cell"
        class="day-cell"
        role="gridcell"
        aria-selected=${isStart || isEnd || isInRange ? 'true' : 'false'}
      >
        <yatl-button
          variant="plain"
          size="small"
          part="day-button"
          class=${classMap(classes)}
          data-date=${currentTime}
          tabindex=${isFocusTarget ? nothing : -1}
          aria-label=${fullDateFormatter.format(date)}
          aria-current=${isToday ? 'date' : nothing}
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
    this.page(-1);
  }

  private handleNextClick() {
    this.page(1);
  }

  /** Moves a page in the current view: a month, a year or a page of years */
  private page(direction: 1 | -1) {
    if (this.view === 'years') {
      this.yearPageStart += YEARS_PER_PAGE * direction;
    } else {
      const months = this.view === 'months' ? 12 * direction : direction;
      this.currentMonth = getFirstDayOfMonth(
        addMonths(this.currentMonth, months),
      );
    }
  }

  private handleMonthClick() {
    if (this.view === 'days') {
      this.view = 'months';
    } else if (this.view === 'months') {
      // A page with the current year in the middle of it
      this.yearPageStart =
        this.currentMonth.getFullYear() - Math.floor(YEARS_PER_PAGE / 2) + 1;
      this.view = 'years';
    }
  }

  private handleMonthPicked(month: number) {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), month, 1);
    this.view = 'days';
  }

  private handleYearPicked(year: number) {
    this.currentMonth = new Date(year, this.currentMonth.getMonth(), 1);
    this.view = 'months';
  }

  /** Escape goes back from the month or year view without picking */
  private handleViewKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.view !== 'days') {
      event.stopPropagation();
      this.view = this.view === 'years' ? 'months' : 'days';
    }
  }

  /**
   * The day in the tab order: the focused day if it's in this month, else
   * the selection, today or the first day of the month (in that order) -
   * whichever is in this month and selectable.
   */
  private get rovingDate(): Date {
    const inView = (date: Date | undefined) =>
      date &&
      date.getFullYear() === this.currentMonth.getFullYear() &&
      date.getMonth() === this.currentMonth.getMonth() &&
      this.isSelectable(date);
    const candidates = [
      this.focusedDate,
      this.selection ? getDateOnly(this.selection) : undefined,
      getDateOnly(new Date()),
    ];
    const found = candidates.find(inView);
    if (found) return found;
    // The first selectable day, or the 1st if none are
    for (
      let day = new Date(this.currentMonth);
      day.getMonth() === this.currentMonth.getMonth();
      day = addDaysToDate(day, 1)
    ) {
      if (this.isSelectable(day)) return day;
    }
    return new Date(this.currentMonth);
  }

  private isSelectable(date: Date) {
    const time = getDateOnly(date).getTime();
    return (
      (this.minTime === undefined || time >= this.minTime) &&
      (this.maxTime === undefined || time <= this.maxTime)
    );
  }

  private handleDayFocusIn(event: FocusEvent) {
    const button = event
      .composedPath()
      .find(
        (el): el is HTMLElement =>
          el instanceof HTMLElement && el.dataset.date !== undefined,
      );
    if (button) {
      this.focusedDate = new Date(Number(button.dataset.date));
    }
  }

  private handleDayKeyDown(event: KeyboardEvent) {
    const from = this.rovingDate;
    let to: Date | undefined;

    if (event.key in DAY_KEYS) {
      to = addDaysToDate(from, DAY_KEYS[event.key]);
    } else if (event.key === 'Home') {
      to = addDaysToDate(from, -from.getDay());
    } else if (event.key === 'End') {
      to = addDaysToDate(from, 6 - from.getDay());
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      const direction = event.key === 'PageUp' ? -1 : 1;
      to = addMonths(from, (event.shiftKey ? 12 : 1) * direction);
    } else {
      return;
    }

    event.preventDefault();
    if (!this.isSelectable(to)) {
      return;
    }
    this.focusDay(to);
  }

  /** Moves focus to a day, changing the month if it's in another one */
  private async focusDay(date: Date) {
    this.focusedDate = getDateOnly(date);
    const month = getFirstDayOfMonth(date);
    if (month.getTime() !== this.currentMonth.getTime()) {
      this.currentMonth = month;
    }
    await this.updateComplete;
    const host = this.renderRoot.querySelector<HTMLElement>(
      `[data-date="${this.focusedDate.getTime()}"]`,
    );
    // yatl-button doesn't delegate focus, so focus its own button
    (host?.shadowRoot?.querySelector('button') ?? host)?.focus();
  }

  /** Puts keyboard focus on the day in the tab order */
  public focusCalendar() {
    if (this.view !== 'days') {
      this.view = 'days';
    }
    return this.focusDay(this.rovingDate);
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
