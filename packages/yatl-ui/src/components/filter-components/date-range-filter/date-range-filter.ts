import { html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBaseFilter } from '../base-filter/base-filter';
import { NestedKeyOf, UnspecifiedRecord } from '@timlassiter11/yatl';

import { dateConverter } from '../../../utils';
import { YatlDateRangeInput } from '../../form-controls/date-range-input/date-range-input';
import styles from './date-range-filter.styles';

type FilterFunction = (value: Date) => boolean;

@customElement('yatl-date-range-filter')
export class YatlDateRangeFilter extends YatlBaseFilter<FilterFunction> {
  public static override styles = [...super.styles, styles];

  // Store original dates for reset
  private originalStartDate?: Date;
  private originalEndDate?: Date;

  // The selectable min/max for the field, derived from the actual data.
  private _dateRange?: { min?: Date; max?: Date };

  private computeDateRange(): { min?: Date; max?: Date } {
    if (!this.controller || !this.field) {
      return {};
    }

    let min: Date | undefined;
    let max: Date | undefined;
    for (const option of this.controller.getColumnFilterValues(
      this.field as NestedKeyOf<UnspecifiedRecord>,
    )) {
      const date =
        option.value instanceof Date
          ? option.value
          : new Date(option.value as string | number);
      if (isNaN(date.getTime())) {
        continue;
      }
      if (!min || date.getTime() < min.getTime()) {
        min = date;
      }
      if (!max || date.getTime() > max.getTime()) {
        max = date;
      }
    }

    return { min, max };
  }

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

    // Capture the field's real min/max *before* updateValue() below may
    // (re)apply our own filter to the controller - otherwise our own
    // selection would narrow the range it's shown against. Keep it live
    // while nothing is picked yet, so it still tracks whatever other
    // filters are active; freeze it the first time a start/end date is
    // set (whether from an initial attribute or later interaction).
    if (!this._dateRange || (!this.startDate && !this.endDate)) {
      this._dateRange = this.computeDateRange();
    }

    if (
      changedProperties.has('startDate') ||
      changedProperties.has('endDate')
    ) {
      this.correctRanges();
      this.updateValue();
    }
  }

  protected override render() {
    const { min, max } = this._dateRange ?? {};
    return html`
      <yatl-date-range-input
        name=${this.field}
        label=${this.label}
        .min=${min}
        .max=${max}
        .startDate=${this.startDate}
        .endDate=${this.endDate}
        ?disabled=${this.disabled}
        @change=${this.handleChange}
      ></yatl-date-range-input>
    `;
  }

  protected override reset() {
    this.startDate = this.originalStartDate;
    this.endDate = this.originalEndDate;
    this.updateValue();
  }

  private handleChange(event: Event) {
    event.stopPropagation();
    const target = event.target as YatlDateRangeInput;
    this.startDate = target.startDate;
    this.endDate = target.endDate;
    this.updateValue();
  }

  private correctRanges() {
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
    if (!this.startDate && !this.endDate) {
      // Clear the function if we have no range.
      this.value = undefined;
      return;
    }

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
