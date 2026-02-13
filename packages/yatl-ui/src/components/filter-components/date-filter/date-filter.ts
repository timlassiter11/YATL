import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import styles from './date-filter.styles';
import { YatlBaseFilter } from '../base-filter/base-filter';
import { live } from 'lit/directives/live.js';
import type { YatlDateInput } from '../../form-controls/date-input/date-input';

@customElement('yatl-date-filter')
export class YatlDateFilter extends YatlBaseFilter<Date> {
  public static override styles = [...super.styles, styles];

  protected override render() {
    return html`
      <yatl-date-input
        name=${this.field}
        label=${this.label}
        .value=${live(this.value)}
        ?disabled=${this.disabled}
        @change=${this.handleChange}
      >
      </yatl-date-input>
    `;
  }

  private handleChange(event: Event) {
    event.stopPropagation();
    const target = event.target as YatlDateInput;
    this.value = target.value ? new Date(target.value) : undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-date-filter': YatlDateFilter;
  }
}
