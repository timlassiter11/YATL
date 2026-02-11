import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { YatlSearchSelect } from '../../form-controls';
import { YatlBaseFilter } from '../yatl-base-filter';
import styles from './yatl-search-filter.styles';

@customElement('yatl-search-filter')
export class YatlSearchFilter extends YatlBaseFilter<string[]> {
  public static override styles = [...super.styles, styles];

  @property({ type: Number })
  public size = 4;

  protected override render() {
    return html`
      <yatl-search-select
        name=${this.field}
        label=${this.label}
        size=${this.size}
        .value=${this.value ?? []}
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
      this.options.entries(),
      ([value, _count]) => value,
      ([value, count]) => this.renderDropdownOption(String(value ?? ''), count),
    );
  }

  protected renderDropdownOption(value: string, count: number) {
    return html`
      <yatl-option value=${value} label=${value} checkable>
        <span part="option-count" slot="end">${count}</span>
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
