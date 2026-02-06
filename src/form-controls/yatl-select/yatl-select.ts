import { customElement, property, query, state } from 'lit/decorators.js';
import { YatlFormControl } from '../yatl-form-control';
import { html, nothing } from 'lit';

import styles from './yatl-select.styles';
import { YatlInput } from '../yatl-input';
import { YatlDropdownSelectEvent } from '../../events';
import { YatlDropdown } from '../../yatl-dropdown';

@customElement('yatl-select')
export class YatlSelect extends YatlFormControl<string[], YatlFormControl> {
  public static override styles = [...YatlFormControl.styles, styles];

  @query('yatl-input')
  protected displayInput?: YatlInput;

  @property({ type: String })
  public placeholder = '';

  @property({ type: Boolean, reflect: true })
  public multi = false;

  @property({ type: Array, attribute: 'value' })
  public defaultValue = [];

  @property({ type: Boolean, reflect: true })
  public open = false;

  @property({ type: Boolean, reflect: true })
  public clearable = false;

  // Mutable value types need to be copied
  // so the user's changes don't mess things up.
  private _value: string[] = [];
  @property({ attribute: false })
  public get value() {
    return [...this._value];
  }
  public set value(value) {
    const oldValue = this.value;
    if (oldValue === value) {
      return;
    }
    this._value = [...value];
    this.updateSelectedOptions();
    this.requestUpdate('value', oldValue);
  }

  public get formValue() {
    const data = new FormData();
    for (const value of this.value) {
      data.append(this.name, value);
    }
    return data;
  }

  @state()
  private displayValue = '';

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
        <div class="text-input" slot="trigger" tabindex="0">
          <span part="input">${this.displayValue || this.placeholder}</span>
          ${this.renderClearIcon()} ${this.renderArrowIcon()}
        </div>
        <slot @slotchange=${this.handleSlotChange}></slot>
      </yatl-dropdown>
    `;
  }

  protected renderClearIcon() {
    if (!this.clearable || this.value.length === 0) {
      return nothing;
    }

    return html`
      <button
        part="clear-icon"
        slot="end"
        @click=${this.handleClearButtonClick}
      >
        <yatl-icon name="close"></yatl-icon>
      </button>
    `;
  }

  protected renderArrowIcon() {
    return html`
      <yatl-icon part="arrow-icon" name="chevron-down"></yatl-icon>
    `;
  }

  private handleSlotChange() {
    this.updateSelectedOptions();
  }

  private handleClearButtonClick(event: Event) {
    event.stopPropagation();
    this.value = [];
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

  private handleDropdownSelect(event: YatlDropdownSelectEvent) {
    // Stop the dropdown from closing
    if (this.multi) {
      event.preventDefault();
    }

    const item = event.item;

    // Clear all values if not multi
    const newValue = new Set<string>(this.multi ? this.value : []);
    if (item.checked) {
      newValue.add(item.value);
    } else {
      newValue.delete(item.value);
    }

    this.value = [...newValue];
    this.setFormValue(this.formValue);
    this.dispatchEvent(new Event('change', { composed: true, bubbles: true }));
  }

  private updateSelectedOptions() {
    for (const option of this.getAllOptions()) {
      option.checkable = true;
      option.checked = this.value.includes(option.value);
    }

    if (this.multi) {
      if (this.value.length) {
        this.displayValue = `${this.value.length} options selected`;
      } else {
        this.displayValue = '';
      }
    } else {
      const selectedOption = this.getSelectedOptions().at(0);
      this.displayValue = selectedOption?.textContent ?? '';
    }
  }

  private getSelectedOptions() {
    return this.getAllOptions().filter(o => o.checked);
  }

  private getAllOptions() {
    return [...this.querySelectorAll('yatl-option')];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-select': YatlSelect;
  }
}
