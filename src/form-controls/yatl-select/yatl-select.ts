import { customElement, property, query, state } from 'lit/decorators.js';
import { YatlFormControl } from '../yatl-form-control';
import { html } from 'lit';

import styles from './yatl-select.styles';
import { live } from 'lit/directives/live.js';
import { YatlInput } from '../yatl-input';
import { YatlOption } from '../../yatl-option';
import { YatlDropdownSelectEvent } from '../../events';

@customElement('yatl-select')
export class YatlSelect extends YatlFormControl<string, YatlFormControl> {
  public static override styles = [...YatlFormControl.styles, styles];

  @query('yatl-input')
  protected displayInput?: YatlInput;

  @property({ type: String })
  public placeholder = '';

  public get typedValue(): string | null {
    return this.value || null;
  }

  public set typedValue(value: string | null) {
    this.value = value ?? '';
  }

  @state()
  private selectedItem?: YatlOption;

  @state()
  private open = false;

  protected renderInput(id: string) {
    return html`
      <yatl-dropdown
        .open=${live(this.open)}
        @yatl-dropdown-select=${this.onDropdownSelect}
      >
        <yatl-input
          slot="trigger"
          id=${id}
          placeholder=${this.placeholder}
          .value=${live(this.selectedItem?.textContent ?? '')}
          readonly
        ></yatl-input>
        <slot @slotchange=${this.onSlotChange}></slot>
      </yatl-dropdown>
      <input .value=${live(this.value)} type="hidden" />
    `;
  }

  private onSlotChange = () => this.updateSelectedOption();

  private onDropdownSelect = (event: YatlDropdownSelectEvent) => {
    const item = event.item;

    if (item === this.selectedItem) {
      this.selectedItem = undefined;
    } else {
      this.selectedItem = item;
    }

    this.open = false;
    this.formControl!.value = this.selectedItem?.value ?? '';
    this.updateSelectedOption();

    // Dispatch on the form control so the base class gets it
    this.formControl?.dispatchEvent(
      new Event('change', { composed: true, bubbles: true }),
    );
  };

  private updateSelectedOption() {
    for (const option of this.getAllOptions()) {
      option.checkable = true;
      option.checked = option.value === this.formControl!.value;
    }
  }

  private getAllOptions() {
    return this?.querySelectorAll('yatl-option') ?? [];
  }
}
