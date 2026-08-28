import { YatlEvent } from '@timlassiter11/yatl';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlDateSelected } from '../../events';
import { dateConverter } from '../../utils';
import { YatlBase } from '../base/base';
import { YatlDateGridRange } from '../date-grid/date-grid';

import styles from './date-picker.styles';

/**
 * @fires change - Fired when the selected date changes.
 */
@customElement('yatl-date-picker')
export class YatlDatePicker extends YatlBase {
  public static override styles = [...super.styles, styles];

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

  /**
   * The currently selected date.
   * @attr date
   */
  @property({ converter: dateConverter })
  public date?: Date;

  protected override render() {
    const ranges: YatlDateGridRange[] = [];
    if (this.date) {
      ranges.push({
        start: this.date,
        end: this.date,
        color: 'brand',
      });
    }

    return html`
      <yatl-date-grid
        .min=${this.min}
        .max=${this.max}
        .ranges=${ranges}
        @yatl-date-selected=${this.handleDateSelected}
      >
        <slot name="toolbar" slot="toolbar"></slot>
        <slot name="footer" slot="footer"></slot>
      </yatl-date-grid>
    `;
  }

  private handleDateSelected(event: YatlDateSelected) {
    this.date = event.date;
    this.dispatchEvent(new YatlEvent('change'));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-date-picker': YatlDatePicker;
  }
}
