import { html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import type { YatlDropdown } from '../../dropdown/dropdown';
import {
  formatTime,
  localeHourCycle,
  parseTime,
  type YatlHourCycle,
  type YatlTimePicker,
} from '../../time-picker/time-picker';
import {
  type FieldPart,
  type FieldSegment,
  type SegmentValues,
  YatlSegmentedField,
} from '../segmented-field/segmented-field';

import styles from './time-input.styles';

/**
 * A time of day, typed in parts (hour, minute and AM/PM in the locale's
 * order and clock) or picked from columns of hours and minutes.
 *
 * The value is "HH:MM" in 24 hour time, like a native time input, or ""
 * when empty. It has no date or time zone.
 *
 * @fires input - Fired on every edit.
 * @fires change - Fired when a time is picked, or focus leaves with a
 *  different time than it had.
 */
@customElement('yatl-time-input')
export class YatlTimeInput extends YatlSegmentedField<string> {
  public static override styles = [...super.styles, styles];

  @state() private open = false;

  /**
   * The earliest allowed time, "HH:MM".
   * @attr min
   */
  @property({ type: String })
  public min?: string;

  /**
   * The latest allowed time, "HH:MM".
   * @attr max
   */
  @property({ type: String })
  public max?: string;

  /**
   * Allowed minutes between times, counted from `min` (or midnight).
   * The minute arrows move by it too.
   * @attr step
   */
  @property({ type: Number })
  public step = 1;

  /**
   * 12 hour (h12, with AM/PM) or 24 hour (h23). Defaults to the locale's.
   * @attr hour-cycle
   */
  @property({ type: String, attribute: 'hour-cycle' })
  public hourCycle?: YatlHourCycle;

  /**
   * Hides the button that opens the time picker.
   * @attr no-picker
   */
  @property({ type: Boolean, attribute: 'no-picker' })
  public noPicker = false;

  /**
   * The initial, uncontrolled value, "HH:MM".
   * @attr value
   */
  @property({ type: String, attribute: 'value' })
  public defaultValue = '';

  /** The current, controlled value, "HH:MM" or "" when empty. */
  @property({ attribute: false })
  public value!: string;

  public get formValue() {
    return this.value || null;
  }

  private get is12Hour() {
    return (this.hourCycle ?? localeHourCycle()) === 'h12';
  }

  protected override willUpdate(changedProps: PropertyValues<this>) {
    super.willUpdate(changedProps);
    // The segments are split for one clock: 14:30 is 02 + PM on a 12 hour
    // clock but 14 on a 24 hour one, so split the value again
    if (changedProps.has('hourCycle') && this.hasUpdated) {
      this.segmentValues = this.toSegments(this.value);
    }
  }

  /** Formats a time for people, in the field's clock */
  private formatForDisplay(minutes: number) {
    const date = new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60);
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hourCycle: this.is12Hour ? 'h12' : 'h23',
    }).format(date);
  }

  protected override get parts(): FieldPart[] {
    const is12Hour = this.is12Hour;
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: is12Hour ? 'h12' : 'h23',
    });
    // 1 PM, so the AM/PM text and order come from the locale
    const sample = formatter.formatToParts(new Date(2000, 0, 1, 13, 5));
    const periods = [
      formatter
        .formatToParts(new Date(2000, 0, 1, 1, 5))
        .find(p => p.type === 'dayPeriod')?.value ?? 'AM',
      sample.find(p => p.type === 'dayPeriod')?.value ?? 'PM',
    ];

    const segments: Record<string, FieldSegment> = {
      hour: is12Hour
        ? {
            key: 'hour',
            label: 'Hour',
            placeholder: '--',
            min: 1,
            max: 12,
            digits: 2,
          }
        : {
            key: 'hour',
            label: 'Hour',
            placeholder: '--',
            min: 0,
            max: 23,
            digits: 2,
          },
      minute: {
        key: 'minute',
        label: 'Minute',
        placeholder: '--',
        min: 0,
        max: 59,
        digits: 2,
        step: this.step > 1 ? this.step : 1,
      },
      dayPeriod: {
        key: 'period',
        label: 'AM or PM',
        placeholder: '--',
        min: 0,
        max: 1,
        digits: 1,
        format: value => periods[value],
        letters: {
          [periods[0][0].toLowerCase()]: 0,
          [periods[1][0].toLowerCase()]: 1,
        },
      },
    };

    const parts: FieldPart[] = [];
    for (const part of sample) {
      const segment = segments[part.type];
      if (segment) {
        parts.push({ type: 'segment', segment });
      } else if (part.type === 'literal') {
        parts.push({ type: 'literal', text: part.value });
      }
    }
    return parts;
  }

  protected override get emptyValue() {
    return '';
  }

  protected override valueKey(value: string | undefined) {
    return value || null;
  }

  protected override toSegments(value: string | undefined): SegmentValues {
    const minutes = parseTime(value);
    if (minutes === undefined) {
      return { hour: null, minute: null, period: null };
    }
    const hours = Math.floor(minutes / 60);
    if (this.is12Hour) {
      return {
        hour: hours % 12 || 12,
        minute: minutes % 60,
        period: hours >= 12 ? 1 : 0,
      };
    }
    return { hour: hours, minute: minutes % 60, period: null };
  }

  protected override fromSegmentValues(values: Record<string, number>) {
    let hours = values.hour;
    if (this.is12Hour) {
      if (hours < 1 || hours > 12) return undefined;
      hours = (hours % 12) + values.period * 12;
    }
    if (hours > 23 || values.minute > 59) return undefined;
    return formatTime(hours * 60 + values.minute);
  }

  protected override renderBase(contents: unknown) {
    return html`
      <div part="input" class="input">
        <slot part="start" class="input-start" name="start"></slot>
        ${contents} ${this.renderPicker()}
        <slot part="end" class="input-end" name="end"></slot>
      </div>
    `;
  }

  /** The value when the picker opened, to fire change when it closes */
  private valueOnOpen = '';

  private renderPicker() {
    if (this.noPicker) {
      return nothing;
    }
    const disabled = this.isDisabled || this.readonly;
    return html`
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
          title="Pick a time"
          aria-label="Pick a time"
          ?disabled=${disabled}
        >
          <yatl-icon name="clock"></yatl-icon>
        </button>
        <yatl-time-picker
          .value=${this.value}
          .hourCycle=${this.hourCycle}
          .step=${this.step}
          .min=${this.min}
          .max=${this.max}
          @change=${this.handlePickerChange}
          @done=${this.handlePickerDone}
        ></yatl-time-picker>
      </yatl-dropdown>
    `;
  }

  private get picker() {
    return this.renderRoot.querySelector('yatl-time-picker');
  }

  private handleDropdownToggle(event: Event) {
    this.open = (event.target as YatlDropdown).open;
    if (this.open) {
      this.valueOnOpen = this.value;
      // So the arrow keys work in the columns right away
      this.picker?.focusPicker();
    } else if (this.value !== this.valueOnOpen) {
      // Each pick fires input. Change waits until the picker closes.
      this.commitChange();
    }
  }

  private handlePickerChange(event: Event) {
    event.stopPropagation();
    if (this.isDisabled || this.readonly) {
      return;
    }
    this.setFromPicker((event.target as YatlTimePicker).value);
  }

  private handlePickerDone() {
    this.open = false;
  }

  protected override updateValueValidity() {
    const minutes = parseTime(this.value);
    if (minutes === undefined) {
      return;
    }
    const min = parseTime(this.min);
    const max = parseTime(this.max);
    if (min !== undefined && minutes < min) {
      this.setValidity(
        { rangeUnderflow: true },
        `Time must be at or after ${this.formatForDisplay(min)}.`,
      );
    } else if (max !== undefined && minutes > max) {
      this.setValidity(
        { rangeOverflow: true },
        `Time must be at or before ${this.formatForDisplay(max)}.`,
      );
    } else if (this.step > 1 && (minutes - (min ?? 0)) % this.step !== 0) {
      this.setValidity(
        { stepMismatch: true },
        `Time must be in ${this.step} minute steps.`,
      );
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-time-input': YatlTimeInput;
  }
}
