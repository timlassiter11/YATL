import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { YatlSelect } from '../../form-controls/select/select';
import { YatlBaseFilter } from '../base-filter/base-filter';
import styles from './select-filter.styles';

@customElement('yatl-select-filter')
export class YatlSelectFilter extends YatlBaseFilter<string[]> {
  public static override styles = [...super.styles, styles];

  @property({ type: String })
  public placeholder = '';

  @property({ type: Number, attribute: 'max-tags' })
  public maxTags = 3;

  @property({ type: Boolean, reflect: true })
  public multi = false;

  @property({ type: Boolean, reflect: true })
  public clearable = false;

  protected override render() {
    return html`
      <yatl-select
        name=${this.field}
        label=${this.label}
        placeholder=${this.placeholder}
        max-tags=${this.maxTags}
        ?multi=${this.multi}
        ?clearable=${this.clearable}
        .value=${this.value ?? []}
        @change=${this.handleSelectChange}
      >
        ${this.renderSelectOptions()}
      </yatl-select>
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
    const target = event.target as YatlSelect;
    this.value = target.value.length ? target.value : undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-select-filter': YatlSelectFilter;
  }
}
