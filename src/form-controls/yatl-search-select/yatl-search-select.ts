import { html, nothing } from 'lit';
import { customElement, property, queryAll } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { YatlDropdownSelectEvent } from '../../events';
import { YatlDropdown } from '../../yatl-dropdown';
import { YatlOption } from '../../yatl-option';
import { YatlFormControl } from '../yatl-form-control';

import theme from '../../theme';
import formStyles from '../yatl-form-control/yatl-form-control.styles';
import styles from './yatl-search-select.styles';
import { YatlInput } from '../yatl-input';
import { getNestedValue } from '../../utils';

@customElement('yatl-search-select')
export class YatlSearchSelect extends YatlFormControl<string[]> {
  public static override styles = [theme, formStyles, styles];

  @queryAll('yatl-option')
  private controllerOptions!: NodeListOf<YatlOption>;

  @property({ type: Boolean, reflect: true })
  public open = false;

  @property({ type: Number, reflect: true })
  public size = 4;

  @property({ type: Array, attribute: 'value' })
  public defaultValue = [];

  private _value: string[] = [];
  @property({ attribute: false })
  public get value() {
    return [...this._value];
  }
  public set value(value) {
    const oldValue = this._value;
    this._value = [...value];
    this.setFormValue(this.formValue);
    this.requestUpdate('value', oldValue);
  }

  public get formValue() {
    const data = new FormData();
    for (const value of this.value) {
      data.append(this.name, value);
    }
    return data;
  }

  public toggleOption(value: string, state?: boolean) {
    const newValue = new Set<string>(this.value);
    if (state === undefined) {
      state = !this.value.includes(value);
    }

    if (state) {
      newValue.add(value);
    } else {
      newValue.delete(value);
    }

    this.value = [...newValue];
  }

  protected override render() {
    return html`
      ${this.renderLabel()}
      <div part="base">${this.renderInput()}</div>
      ${this.renderHint()}${this.renderErrorText()}
    `;
  }

  protected renderInput() {
    return html`
      <yatl-dropdown
        .open=${this.open}
        @yatl-dropdown-select=${this.handleDropdownSelect}
        @yatl-dropdown-open=${this.handleDropdownToggle}
        @yatl-dropdown-close=${this.handleDropdownToggle}
      >
        <yatl-input
          style=${`--size: ${this.size};`}
          part="search"
          type="search"
          slot="trigger"
          placeholder="Search"
          @input=${this.handleInput}
        ></yatl-input>
        <slot @slotchange=${this.handleSlotChange}>
          ${this.renderControllerOptions()}
        </slot>
      </yatl-dropdown>
      <div class="text-input">${this.renderSelectedOptions()}</div>
    `;
  }

  protected renderControllerOptions() {
    if (!this.controller) {
      return nothing;
    }

    const values = new Set<string>();
    const data = this.value.length
      ? this.controller.data
      : this.controller.filteredData;
      
    for (const row of data) {
      const value = getNestedValue(row, this.name);
      if (value) {
        values.add(String(value));
      }
    }

    return repeat(
      values,
      value => value,
      value => this.renderDropdownOption(value),
    );
  }

  protected renderDropdownOption(value: string) {
    return html` <yatl-option value=${value} checkable>${value}</yatl-option> `;
  }

  protected renderSelectedOptions() {
    const options = this.getSelectedOptions();
    return repeat(
      options,
      option => option.value,
      option => this.renderOption(option),
    );
  }

  protected renderOption(option: YatlOption) {
    return html`
      <yatl-option value=${option.value}>
        ${option.textContent ?? ''}
        <yatl-button slot="end" variant="icon">
          <yatl-icon name="close"></yatl-icon>
        </yatl-button>
      </yatl-option>
    `;
  }

  private handleDropdownSelect(event: YatlDropdownSelectEvent) {
    event.preventDefault();
    const item = event.item;
    this.toggleOption(item.value, item.checked);
    this.dispatchChange();
  }

  private handleDropdownToggle(event: Event) {
    const target = event.target as YatlDropdown;
    if (target.open) {
      this.states.add('open');
    } else {
      this.states.delete('open');
    }
    this.open = target.open;
  }

  private handleInput(event: Event) {
    event.stopPropagation();
    const query = (event.target as YatlInput).value.toLocaleLowerCase();
    this.updateVisibleOptions(query);
  }

  private handleSlotChange() {
    this.updateSelectedOptions();
  }

  private updateVisibleOptions(query: string) {
    for (const option of this.getAllOptions()) {
      if (!query) {
        option.hidden = false;
        continue;
      }

      const text = option.textContent?.toLocaleLowerCase();
      const match = text?.includes(query) ?? false;
      option.hidden = !match;
    }
  }

  private updateSelectedOptions() {
    for (const option of this.getAllOptions()) {
      option.checkable = true;
      option.checked = this.value.includes(option.value);
    }
  }

  private getSelectedOptions() {
    const options = this.getAllOptions().filter(o => o.checked);
    const optionMap = new Map(options.map(o => [o.value, o]));
    // Map this.value to keep the order they were added
    return this.value.map(v => optionMap.get(v)).filter(o => o !== undefined);
  }

  private getAllOptions() {
    const slottedOptions = [...this.querySelectorAll('yatl-option')];
    if (!this.controller || slottedOptions.length) {
      return slottedOptions;
    } else {
      return [...this.controllerOptions];
    }
  }

  private dispatchChange() {
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-search-select': YatlSearchSelect;
  }
}
