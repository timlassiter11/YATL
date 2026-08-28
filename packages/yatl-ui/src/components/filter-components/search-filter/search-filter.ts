import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { YatlSearchSelect } from '../../form-controls/search-select/search-select';
import { YatlBaseFilter } from '../base-filter/base-filter';
import styles from './search-filter.styles';
import { FilterOption } from '@timlassiter11/yatl';

@customElement('yatl-search-filter')
export class YatlSearchFilter extends YatlBaseFilter<string[]> {
  public static override styles = [...super.styles, styles];

  /**
   * The number of options visible at once without scrolling.
   * @attr size
   */
  @property({ type: Number })
  public size = 4;

  protected override render() {
    return html`
      <yatl-search-select
        name=${this.field}
        label=${this.label}
        size=${this.size}
        .value=${this.value ?? []}
        ?disabled=${this.disabled}
        @change=${this.handleSelectChange}
      >
        ${this.renderSelectOptions()}
      </yatl-search-select>
    `;
  }

  protected renderSelectOptions() {
    if (!this.controller || !this.field) {
      return nothing;
    }

    return repeat(
      this.options,
      option => option.value,
      option => this.renderDropdownOption(option),
    );
  }

  protected renderDropdownOption(option: FilterOption) {
    const value = option.value ?? '';
    const label = option.label ?? '';
    return html`
      <yatl-option value=${String(value)} label=${label} checkable>
        <span part="option-count" slot="end">${option.count}</span>
      </yatl-option>
    `;
  }

  private handleSelectChange(event: Event) {
    const target = event.target as YatlSearchSelect;
    this.value = target.value.length ? target.value : undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-search-filter': YatlSearchFilter;
  }
}
