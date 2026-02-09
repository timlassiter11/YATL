import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import theme from '../../theme';
import styles from './yatl-select-filter.styles';
import { YatlBaseFilter } from '../yatl-base-filter';
import { repeat } from 'lit/directives/repeat.js';
import { YatlSelect } from '../../form-controls';

@customElement('yatl-select-filter')
export class YatlSelectFilter extends YatlBaseFilter<string[]> {
  public static override styles = [theme, styles];

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