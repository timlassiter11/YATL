import { YatlEvent } from '@timlassiter11/yatl';
import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { YatlDateSelected } from '../../events';
import { dateConverter, datesEqual } from '../../utils';
import { YatlBase } from '../base/base';
import { YatlDateGridRange } from '../date-grid/date-grid';
import styles from './date-range-picker.styles';

@customElement('yatl-date-range-picker')
export class YatlDateRangePicker extends YatlBase {
  public static override styles = [...super.styles, styles];

  @state() private currentSelection: 'start' | 'end' = 'start';

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

  protected override willUpdate(
    changedProps: PropertyValues<YatlDateRangePicker>,
  ) {
    if (changedProps.has('startDate') || changedProps.has('endDate')) {
      if (this.startDate && !this.endDate) {
        this.currentSelection = 'end';
      } else {
        this.currentSelection = 'start';
      }
    }
  }

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
      >
        <div class="toolbar" slot="toolbar">
          <yatl-button-group>
            <yatl-button
              size="small"
              color=${this.currentSelection === 'start' ? 'brand' : 'neutral'}
              @click=${() => this.setSelectionMode('start')}
              >Start</yatl-button
            >
            <yatl-button
              size="small"
              color=${this.currentSelection === 'end' ? 'brand' : 'neutral'}
              @click=${() => this.setSelectionMode('end')}
              >End</yatl-button
            >
          </yatl-button-group>
        </div>
        <slot name="footer" slot="footer"></slot>
      </yatl-date-grid>
    `;
  }

  private handleDateSelected(event: YatlDateSelected) {
    const date = event.date;
    if (this.currentSelection === 'start') {
      if (datesEqual(date, this.startDate)) {
        // Clear on click of same date
        this.startDate = undefined;
      } else {
        this.startDate = date;
        this.endDate = undefined;
      }
    } else {
      if (datesEqual(date, this.endDate)) {
        // Clear on click of same date
        this.endDate = undefined;
      } else {
        this.endDate = date;
      }
    }

    this.correctRanges();
    this.dispatchEvent(new YatlEvent('change'));
  }

  private setSelectionMode(mode: 'start' | 'end') {
    this.currentSelection = mode;
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
