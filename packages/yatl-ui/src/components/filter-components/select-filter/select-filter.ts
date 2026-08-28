import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { YatlSelect } from '../../form-controls/select/select';
import { YatlBaseFilter } from '../base-filter/base-filter';
import styles from './select-filter.styles';
import { FilterOption } from '@timlassiter11/yatl';

@customElement('yatl-select-filter')
export class YatlSelectFilter extends YatlBaseFilter<string | string[]> {
  public static override styles = [...super.styles, styles];

  /**
   * Placeholder text shown when no option is selected.
   * @attr placeholder
   */
  @property({ type: String })
  public placeholder = '';

  /**
   * The maximum number of selected tags to display.
   * *NOTE*: This only applies when multi is set.
   * @attr max-tags
   */
  @property({ type: Number, attribute: 'max-tags' })
  public maxTags = 3;

  /**
   * When true, multiple options may be selected.
   * @attr multi
   */
  @property({ type: Boolean, reflect: true })
  public multi = false;

  /**
   * When true, a button is shown to clear the selected value.
   * @attr clearable
   */
  @property({ type: Boolean, reflect: true })
  public clearable = false;

  protected override render() {
    return html`
      <yatl-select
        exportparts="base, tags, tag"
        name=${this.field}
        label=${this.label}
        placeholder=${this.placeholder}
        max-tags=${this.maxTags}
        ?multi=${this.multi}
        ?clearable=${this.clearable}
        ?disabled=${this.disabled}
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
    const target = event.target as YatlSelect;
    this.value = target.value.length ? target.value : undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-select-filter': YatlSelectFilter;
  }
}
