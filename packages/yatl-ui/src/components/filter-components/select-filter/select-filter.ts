import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { YatlSelect } from '../../form-controls/select/select';
import { YatlBaseFilter } from '../base-filter/base-filter';
import styles from './select-filter.styles';
import { FilterOption } from '@timlassiter11/yatl';

@customElement('yatl-select-filter')
export class YatlSelectFilter extends YatlBaseFilter<string | string[]> {
  // Redeclared with this filter's type, so template type checkers
  // (like lit-analyzer) don't see the base class's generic TValue.
  // It only passes through to YatlBaseFilter's value.
  /**
   * The selected option's value, or the selected values when `multi` is set.
   * @attr value - The initial value. JSON for several values, e.g. `value='["a","b"]'`.
   */
  public override get value(): string | string[] | undefined {
    return super.value;
  }
  public override set value(value: string | string[] | undefined) {
    super.value = value;
  }

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
