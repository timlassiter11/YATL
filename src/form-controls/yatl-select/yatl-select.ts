import { customElement, property, query, state } from 'lit/decorators.js';
import { YatlFormControl } from '../yatl-form-control';
import { html } from 'lit';

import styles from './yatl-select.styles';
import { live } from 'lit/directives/live.js';
import { YatlInput } from '../yatl-input';
import { YatlOption } from '../../yatl-option';
import { YatlDropdownSelectEvent } from '../../events';

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

  protected renderInput(id: string) {
    return html`
      <yatl-dropdown @yatl-dropdown-select=${this.onDropdownSelect}>
        <yatl-input
          slot="trigger"
          id=${id}
          placeholder=${this.placeholder}
          .value=${this.displayValue}
          readonly
        ></yatl-input>
        <slot @slotchange=${this.onSlotChange}></slot>
      </yatl-dropdown>
    `;
  }

  private onSlotChange = () => this.updateSelectedOption();

  private onDropdownSelect = (event: YatlDropdownSelectEvent) => {
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

    if (this.multi) {
      const selectedOptions = this.getSelectedOptions();
      if (selectedOptions.length) {
        this.displayValue = `${selectedOptions.length} options selected`;
      } else {
        this.displayValue = '';
      }
    } else if (item.checked) {
      this.displayValue = item.textContent ?? '';
    } else {
      this.displayValue = '';
    }

    this.updateSelectedOption();
    this.setFormValue(this.formValue);
    this.dispatchEvent(new Event('change', { composed: true, bubbles: true }));
  };

  private updateSelectedOption() {
    for (const option of this.getAllOptions()) {
      option.checkable = true;
      option.checked = this.value.includes(option.value);
    }
  }

  private getSelectedOptions() {
    return this.getAllOptions().filter(o => o.checked);
  }

  private getAllOptions() {
    return [...this?.querySelectorAll('yatl-option')];
  }
}
