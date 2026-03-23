import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import styles from './date-range-filter.styles';
import { YatlBaseFilter } from '../base-filter/base-filter';
import { live } from 'lit/directives/live.js';
import { YatlDateInput } from '../../form-controls/date-input/date-input';

type FilterFunction = (value: Date) => boolean;

@customElement('yatl-date-range-filter')
export class YatlDateRangeFilter extends YatlBaseFilter<FilterFunction> {
  public static override styles = [...super.styles, styles];

  private startDate?: Date;
  private endDate?: Date;

  protected override render() {
    return html`
      <yatl-date-input
        class="input start"
        part="input start"
        name="start"
        exportparts="base:start-base, input:end-input"
        placeholder="From"
        label=${this.label}
        .value=${live(this.startDate)}
        ?disabled=${this.disabled}
        @change=${this.handleChange}
      ></yatl-date-input>
      <yatl-date-input
        class="input end"
        part="input end"
        name="end"
        exportparts="base:end-base, input:end-input"
        placeholder="To"
        .value=${live(this.endDate)}
        ?disabled=${this.disabled}
        @change=${this.handleChange}
      ></yatl-date-input>
    `;
  }

  protected override reset() {
    this.startDate = undefined;
    this.endDate = undefined;
  }

  private handleChange(event: Event) {
    event.stopPropagation();
    const target = event.target as YatlDateInput;

    if (target.name === 'start') {
      this.startDate = target.value;
    } else if (target.name === 'end') {
      this.endDate = target.value;
    }

    const filterFunction = (value: Date) => {
      const lastModified = value as Date;
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
          startDate.getTime() <= lastModified.getTime() &&
          endDate.getTime() > lastModified.getTime()
        );
      } else if (startDate instanceof Date) {
        return startDate.getTime() <= lastModified.getTime();
      } else if (endDate) {
        return endDate.getTime() >= lastModified.getTime();
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
