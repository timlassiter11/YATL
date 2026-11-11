import { YatlEvent } from '@timlassiter11/yatl';
import { html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { YatlBase } from '../base/base';

import styles from './time-picker.styles';

export type YatlHourCycle = 'h12' | 'h23';

interface ColumnOption {
  value: number;
  label: string;
  disabled: boolean;
}

type ColumnKey = 'hour' | 'minute' | 'period';

const TIME_PATTERN = /^(\d{1,2}):(\d{2})/;

/** Minutes since midnight for "HH:MM", or undefined if it isn't one */
export function parseTime(value: string | null | undefined) {
  const match = value ? TIME_PATTERN.exec(value) : null;
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return undefined;
  return hours * 60 + minutes;
}

/** "HH:MM" for minutes since midnight */
export function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(
    2,
    '0',
  )}`;
}

/** The locale's hour cycle, as h12 or h23 */
export function localeHourCycle(): YatlHourCycle {
  const cycle = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
  }).resolvedOptions().hourCycle;
  return cycle === 'h11' || cycle === 'h12' ? 'h12' : 'h23';
}

/** The locale's AM and PM text */
function dayPeriods(): [string, string] {
  const format = (hour: number) =>
    new Intl.DateTimeFormat(undefined, { hour: 'numeric', hourCycle: 'h12' })
      .formatToParts(new Date(2000, 0, 1, hour))
      .find(part => part.type === 'dayPeriod')?.value;
  return [format(1) ?? 'AM', format(13) ?? 'PM'];
}

/**
 * Picks a time of day from columns: hours, minutes (every `step`) and, on
 * a 12 hour clock, AM/PM. Picking any part sets the time, using the other
 * parts' current values (or the first option when there's no time yet).
 *
 * Each column shows the selected option in the middle, with its neighbours
 * above and below, and long columns wrap around (23, 00, 01). Spin a
 * column with the mouse wheel, its arrow buttons or by dragging it (touch),
 * or click an option.
 *
 * Each column is one tab stop: Up/Down pick the previous or next option,
 * Home/End the first or last, Left/Right move between columns, and Enter
 * fires `done`.
 *
 * @csspart column - A column, with its arrow buttons
 * @csspart column-viewport - The visible rows of a column
 * @csspart option - An option
 * @csspart scroll-button - The arrows above and below a column
 *
 * @cssprop --yatl-time-picker-row-height - Height of each row
 *
 * @fires change - When a part is picked. `value` has the new time.
 * @fires done - When Enter is pressed, e.g. to close a dropdown.
 */
@customElement('yatl-time-picker')
export class YatlTimePicker extends YatlBase {
  public static override styles = [...super.styles, styles];

  /**
   * The time, "HH:MM" in 24 hour time, or "" for none.
   * @attr value
   */
  @property({ type: String })
  public value = '';

  /**
   * 12 hour (h12, with AM/PM) or 24 hour (h23). Defaults to the locale's.
   * @attr hour-cycle
   */
  @property({ type: String, attribute: 'hour-cycle' })
  public hourCycle?: YatlHourCycle;

  /**
   * Minutes between the options in the minute column.
   * @attr step
   */
  @property({ type: Number })
  public step = 1;

  /**
   * The earliest allowed time, "HH:MM". Hours entirely before it are
   * disabled.
   * @attr min
   */
  @property({ type: String })
  public min?: string;

  /**
   * The latest allowed time, "HH:MM". Hours entirely after it are disabled.
   * @attr max
   */
  @property({ type: String })
  public max?: string;

  private get is12Hour() {
    return (this.hourCycle ?? localeHourCycle()) === 'h12';
  }

  /** The current time's parts, or undefined parts without a time */
  private get parts() {
    const minutes = parseTime(this.value);
    if (minutes === undefined) {
      return { hour24: undefined, minute: undefined };
    }
    return { hour24: Math.floor(minutes / 60), minute: minutes % 60 };
  }

  /** Whether any minute in [start, end] is within min and max */
  private allowsAny(start: number, end: number) {
    const min = parseTime(this.min) ?? 0;
    const max = parseTime(this.max) ?? 24 * 60 - 1;
    return end >= min && start <= max;
  }

  private get hourOptions(): ColumnOption[] {
    const { hour24 } = this.parts;
    if (this.is12Hour) {
      const pm = (hour24 ?? 0) >= 12;
      // 12 first, like a clock: 12, 1, 2 ... 11
      return [12, ...Array.from({ length: 11 }, (_, i) => i + 1)].map(hour => {
        const start = ((hour % 12) + (pm ? 12 : 0)) * 60;
        return {
          value: hour,
          label: String(hour).padStart(2, '0'),
          disabled: !this.allowsAny(start, start + 59),
        };
      });
    }
    return Array.from({ length: 24 }, (_, hour) => ({
      value: hour,
      label: String(hour).padStart(2, '0'),
      disabled: !this.allowsAny(hour * 60, hour * 60 + 59),
    }));
  }

  private get minuteOptions(): ColumnOption[] {
    const step = Math.max(1, Math.min(60, Math.floor(this.step) || 1));
    const options: ColumnOption[] = [];
    for (let minute = 0; minute < 60; minute += step) {
      options.push({
        value: minute,
        label: String(minute).padStart(2, '0'),
        disabled: false,
      });
    }
    return options;
  }

  private get periodOptions(): ColumnOption[] {
    const [am, pm] = dayPeriods();
    return [
      { value: 0, label: am, disabled: !this.allowsAny(0, 12 * 60 - 1) },
      { value: 1, label: pm, disabled: !this.allowsAny(12 * 60, 24 * 60 - 1) },
    ];
  }

  /** The selected option's value in each column */
  private get selected(): Record<ColumnKey, number | undefined> {
    const { hour24, minute } = this.parts;
    if (hour24 === undefined) {
      return { hour: undefined, minute: undefined, period: undefined };
    }
    return {
      hour: this.is12Hour ? hour24 % 12 || 12 : hour24,
      minute,
      period: hour24 >= 12 ? 1 : 0,
    };
  }

  private get columns(): {
    key: ColumnKey;
    label: string;
    options: ColumnOption[];
  }[] {
    const columns: {
      key: ColumnKey;
      label: string;
      options: ColumnOption[];
    }[] = [
      { key: 'hour', label: 'Hour', options: this.hourOptions },
      { key: 'minute', label: 'Minute', options: this.minuteOptions },
    ];
    if (this.is12Hour) {
      columns.push({
        key: 'period',
        label: 'AM or PM',
        options: this.periodOptions,
      });
    }
    return columns;
  }

  private optionsFor(key: ColumnKey) {
    switch (key) {
      case 'hour':
        return this.hourOptions;
      case 'minute':
        return this.minuteOptions;
      case 'period':
        return this.periodOptions;
    }
  }

  protected override render() {
    const selected = this.selected;
    return html`
      <div part="base" class="columns">
        ${this.columns.map(
          (column, i) =>
            html`${i === 1
              ? html`<div class="separator" aria-hidden="true">:</div>`
              : nothing}${this.renderColumn(column, selected[column.key])}`,
        )}
      </div>
    `;
  }

  private renderColumn(
    column: { key: ColumnKey; label: string; options: ColumnOption[] },
    current: number | undefined,
  ) {
    const { key, label, options } = column;
    const index = options.findIndex(o => o.value === current);
    // Without a time, the first allowed option sits in the middle
    const anchor =
      index >= 0
        ? index
        : Math.max(
            0,
            options.findIndex(o => !o.disabled),
          );
    const wraps = wrapsAround(options);

    // The visible rows, plus a few more above and below so a sliding
    // column never shows a gap
    const rows: { offset: number; option?: ColumnOption }[] = [];
    for (let offset = -RENDERED_HALF; offset <= RENDERED_HALF; offset++) {
      const i = wraps ? mod(anchor + offset, options.length) : anchor + offset;
      rows.push({ offset, option: options[i] });
    }

    return html`<div part="column" class="column">
      <button
        part="scroll-button"
        class="scroll-button"
        tabindex="-1"
        aria-hidden="true"
        @click=${() => this.move(key, -1)}
      >
        <yatl-icon name="chevron-up"></yatl-icon>
      </button>
      <div
        part="column-viewport"
        class="viewport"
        role="spinbutton"
        tabindex="0"
        data-column=${key}
        aria-label=${label}
        aria-valuenow=${current ?? nothing}
        aria-valuetext=${index >= 0 ? options[index].label : nothing}
        @keydown=${(event: KeyboardEvent) =>
          this.handleColumnKeyDown(event, key, options)}
        @wheel=${(event: WheelEvent) => this.handleWheel(event, key)}
        @pointerdown=${(event: PointerEvent) =>
          this.handlePointerDown(event, key)}
        @pointermove=${this.handlePointerMove}
        @pointerup=${this.handlePointerUp}
        @pointercancel=${this.handlePointerUp}
      >
        <div class="track">
          ${rows.map(({ offset, option }) =>
            option
              ? html`<div
                  part="option"
                  class=${classMap({
                    row: true,
                    option: true,
                    selected: offset === 0 && index >= 0,
                    disabled: option.disabled,
                  })}
                  data-offset=${offset}
                  aria-hidden="true"
                  @click=${() => this.pick(key, option)}
                >
                  ${option.label}
                </div>`
              : html`<div class="row" data-offset=${offset}></div>`,
          )}
        </div>
      </div>
      <button
        part="scroll-button"
        class="scroll-button"
        tabindex="-1"
        aria-hidden="true"
        @click=${() => this.move(key, 1)}
      >
        <yatl-icon name="chevron-down"></yatl-icon>
      </button>
    </div>`;
  }

  protected override updated(changedProps: PropertyValues<this>) {
    super.updated(changedProps);
    const slide = this.slide;
    this.slide = undefined;
    if (slide && !this.drag?.moved) {
      this.slideIn(slide.key, slide.rows);
    }
  }

  /** Focuses the first column */
  public async focusPicker() {
    await this.updateComplete;
    this.renderRoot.querySelector<HTMLElement>('.viewport')?.focus();
  }

  /** The column just picked from, and how many rows it moved */
  private slide?: { key: ColumnKey; rows: number };

  private trackFor(key: ColumnKey) {
    return this.renderRoot.querySelector<HTMLElement>(
      `[data-column="${key}"] .track`,
    );
  }

  private get rowHeight() {
    return (
      this.renderRoot.querySelector<HTMLElement>('.row')?.offsetHeight || 32
    );
  }

  /**
   * The new rows are already in place, so start them `rows` rows away
   * (plus wherever an unfinished slide had got to) and slide them home
   */
  private slideIn(key: ColumnKey, rows: number) {
    const track = this.trackFor(key);
    if (
      !track ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const current = new DOMMatrixReadOnly(getComputedStyle(track).transform)
      .m42;
    track.getAnimations().forEach(animation => animation.cancel());
    track.animate(
      [
        { transform: `translateY(${rows * this.rowHeight + current}px)` },
        { transform: 'translateY(0)' },
      ],
      { duration: 150, easing: 'ease-out' },
    );
  }

  private pick(key: ColumnKey, option: ColumnOption) {
    if (option.disabled) {
      return;
    }
    const current = this.selected;
    const value = { ...current, [key]: option.value };

    // Parts that aren't picked yet start at their first allowed option
    const first = (options: ColumnOption[]) =>
      (options.find(o => !o.disabled) ?? options[0]).value;
    const minute = value.minute ?? first(this.minuteOptions);
    let hour24: number;
    if (this.is12Hour) {
      const period = value.period ?? first(this.periodOptions);
      const hour = value.hour ?? first(this.hourOptions);
      hour24 = (hour % 12) + period * 12;
    } else {
      hour24 = value.hour ?? first(this.hourOptions);
    }

    const time = formatTime(hour24 * 60 + minute);
    if (time === this.value) {
      return;
    }

    // Slide the column by as many rows as the pick moved it
    const options = this.optionsFor(key);
    const from = options.findIndex(o => o.value === current[key]);
    if (from >= 0) {
      let rows = options.findIndex(o => o.value === option.value) - from;
      if (wrapsAround(options)) {
        const half = Math.floor(options.length / 2);
        rows = mod(rows + half, options.length) - half;
      }
      this.slide = {
        key,
        rows: Math.max(-BUFFER_ROWS, Math.min(BUFFER_ROWS, rows)),
      };
    }

    this.value = time;
    this.dispatchEvent(new YatlEvent('change'));
  }

  /**
   * Picks the next (1) or previous (-1) allowed option in a column,
   * wrapping around if the column does. Without a time it picks the
   * option in the middle. Returns whether anything was picked.
   */
  private move(key: ColumnKey, direction: 1 | -1) {
    const options = this.optionsFor(key);
    const index = options.findIndex(o => o.value === this.selected[key]);
    if (index < 0) {
      const first = options.find(o => !o.disabled);
      if (first) {
        this.pick(key, first);
      }
      return Boolean(first);
    }

    const wraps = wrapsAround(options);
    let i = index;
    for (let tries = 1; tries < options.length; tries++) {
      i += direction;
      if (wraps) {
        i = mod(i, options.length);
      } else if (i < 0 || i >= options.length) {
        return false;
      }
      if (!options[i].disabled) {
        this.pick(key, options[i]);
        return true;
      }
    }
    return false;
  }

  private wheelDistance = 0;

  /** A notch of a mouse wheel, or a short swipe on a trackpad, is a row */
  private handleWheel(event: WheelEvent, key: ColumnKey) {
    event.preventDefault();
    const pixels =
      event.deltaMode === WheelEvent.DOM_DELTA_PIXEL
        ? event.deltaY
        : event.deltaY * this.rowHeight;
    this.wheelDistance += pixels;
    if (Math.abs(this.wheelDistance) >= WHEEL_STEP) {
      this.move(key, this.wheelDistance > 0 ? 1 : -1);
      this.wheelDistance = 0;
    }
  }

  /** A touch or pen dragging a column, to spin it like a wheel */
  private drag?: {
    key: ColumnKey;
    pointerId: number;
    startY: number;
    rows: number;
    moved: boolean;
  };

  private handlePointerDown(event: PointerEvent, key: ColumnKey) {
    // A mouse has the wheel, the arrows and clicks
    if (event.pointerType === 'mouse' || this.drag) {
      return;
    }
    this.drag = {
      key,
      pointerId: event.pointerId,
      startY: event.clientY,
      rows: 0,
      moved: false,
    };
  }

  private handlePointerMove = (event: PointerEvent) => {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    const distance = event.clientY - drag.startY;
    if (!drag.moved) {
      if (Math.abs(distance) < DRAG_THRESHOLD) {
        return;
      }
      // A drag, not a tap. Capturing also means no option gets the click.
      drag.moved = true;
      try {
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      } catch {
        // The pointer is already gone
      }
    }

    // Each row dragged past picks the next option, and the rest of the
    // distance moves the column under the finger
    const height = this.rowHeight;
    const target = Math.round(-distance / height);
    while (drag.rows !== target) {
      const direction = target > drag.rows ? 1 : -1;
      if (!this.move(drag.key, direction)) {
        break;
      }
      drag.rows += direction;
    }
    const offset = Math.max(
      -height / 2,
      Math.min(height / 2, distance + drag.rows * height),
    );
    const track = this.trackFor(drag.key);
    if (track) {
      track.style.transform = `translateY(${offset}px)`;
    }
  };

  private handlePointerUp = (event: PointerEvent) => {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    this.drag = undefined;
    const track = this.trackFor(drag.key);
    if (drag.moved && track) {
      // Settle the column back on the picked row
      const from = track.style.transform;
      track.style.transform = '';
      track.animate([{ transform: from }, { transform: 'translateY(0)' }], {
        duration: 120,
        easing: 'ease-out',
      });
    }
  };

  private handleColumnKeyDown(
    event: KeyboardEvent,
    key: ColumnKey,
    options: ColumnOption[],
  ) {
    const enabled = options.filter(o => !o.disabled);
    switch (event.key) {
      case 'ArrowDown':
        this.move(key, 1);
        break;
      case 'ArrowUp':
        this.move(key, -1);
        break;
      case 'Home':
        if (enabled.length) this.pick(key, enabled[0]);
        break;
      case 'End':
        if (enabled.length) this.pick(key, enabled[enabled.length - 1]);
        break;
      case 'ArrowLeft':
      case 'ArrowRight': {
        event.preventDefault();
        event.stopPropagation();
        const columns = [
          ...this.renderRoot.querySelectorAll<HTMLElement>('.viewport'),
        ];
        const offset = event.key === 'ArrowLeft' ? -1 : 1;
        columns[
          columns.indexOf(event.currentTarget as HTMLElement) + offset
        ]?.focus();
        return;
      }
      case 'Enter':
        event.preventDefault();
        event.stopPropagation();
        this.dispatchEvent(new YatlEvent('done'));
        return;
      default:
        return;
    }

    // Handled here, so a surrounding menu doesn't move focus too
    event.preventDefault();
    event.stopPropagation();
  }
}

/** Rows shown above and below the selected one */
const HALF_ROWS = 3;
/** Rows rendered past the visible ones, so a sliding column has no gap */
const BUFFER_ROWS = 3;
const RENDERED_HALF = HALF_ROWS + BUFFER_ROWS;
/** Wheel distance (px) that moves a row */
const WHEEL_STEP = 30;
/** Distance (px) a touch moves before it's a drag rather than a tap */
const DRAG_THRESHOLD = 6;

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

/**
 * Whether a column wraps around (23, 00, 01). Only columns longer than
 * the visible rows do, so a short one (minutes every 15) never shows an
 * option twice.
 */
function wrapsAround(options: ColumnOption[]) {
  return options.length >= HALF_ROWS * 2 + 1;
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-time-picker': YatlTimePicker;
  }
}
