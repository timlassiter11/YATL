import { YatlEvent } from '@timlassiter11/yatl';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlDateSelected } from '../../events';
import { dateConverter } from '../../utils';
import { YatlBase } from '../base/base';
import { YatlDateGridRange } from '../date-grid/date-grid';
import styles from './date-range-picker.styles';

@customElement('yatl-date-range-picker')
export class YatlDateRangePicker extends YatlBase {
  public static override styles = [...super.styles, styles];

  @property({ converter: dateConverter })
  public min?: Date;

  @property({ converter: dateConverter })
  public max?: Date;

  /**
   * Start date of range
   * @attr start-date
   */
  @property({ converter: dateConverter, attribute: 'start-date' })
  public startDate?: Date;

  /**
   * End date of range
   * @attr end-date
   */
  @property({ converter: dateConverter, attribute: 'end-date' })
  public endDate?: Date;

  protected override render() {
    const ranges: YatlDateGridRange[] = [];
    ranges.push({
      start: this.startDate,
      end: this.endDate,
      color: 'brand',
    });

    return html`
      <yatl-date-grid
        .min=${this.min}
        .max=${this.max}
        .ranges=${ranges}
        @yatl-date-selected=${this.handleDateSelected}
      ></yatl-date-grid>
    `;
  }

  private handleDateSelected(event: YatlDateSelected) {
    const date = event.date;
    if (!this.startDate || (this.startDate && this.endDate)) {
      // We don't have a start date or we have both a start and end date.
      this.startDate = date;
      this.endDate = undefined;
    } else {
      this.endDate = date;
    }
    this.correctRanges();
    this.dispatchEvent(new YatlEvent('change'));
  }

  private correctRanges() {
    if (
      this.startDate &&
      this.endDate &&
      this.endDate.getTime() < this.startDate.getTime()
    ) {
      // They are inverted so swap them.
      const tmp = this.startDate;
      this.startDate = this.endDate;
      this.endDate = tmp;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-date-range-picker': YatlDateRangePicker;
  }
}
