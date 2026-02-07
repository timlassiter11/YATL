import { customElement, property, query } from 'lit/decorators.js';
import { YatlFormControl } from '../yatl-form-control';
import { html, nothing } from 'lit';

import styles from './yatl-select.styles';
import { YatlInput } from '../yatl-input';
import { YatlDropdownSelectEvent } from '../../events';
import { YatlDropdown } from '../../yatl-dropdown';
import { YatlOption } from '../../yatl-option';
import { repeat } from 'lit/directives/repeat.js';

@customElement('yatl-select')
export class YatlSelect extends YatlFormControl<string[], YatlFormControl> {
  public static override styles = [...YatlFormControl.styles, styles];

  @query('yatl-input')
  protected displayInput?: YatlInput;

  @property({ type: String })
  public placeholder = '';

  @property({ type: Boolean, reflect: true })
  public multi = false;

  @property({ type: Number, attribute: 'max-tags' })
  public maxTags = 3;

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
    // Clear all values if not multi
    const newValue = new Set<string>(this.multi ? this.value : []);

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
        <div class="text-input" slot="trigger" tabindex="0">
          <div class="input-row">
            ${this.renderDisplayValue()}${this.renderTags()}
            ${this.renderClearIcon()} ${this.renderArrowIcon()}
          </div>
        </div>
        <slot @slotchange=${this.handleSlotChange}></slot>
      </yatl-dropdown>
    `;
  }

  protected renderDisplayValue() {
    if (this.multi) {
      return nothing;
    }
    
    const selectedOption = this.getSelectedOptions().at(0);
    const displayValue = selectedOption?.textContent;
    return html`
      <span part="input">${displayValue ?? this.placeholder}</span>
    `;
  }

  protected renderTags() {
    if (!this.multi) {
      return nothing;
    }

    let extraTag: unknown = nothing;
    const selectedOptions = this.getSelectedOptions();
    if (selectedOptions.length > this.maxTags) {
      extraTag = html`<yatl-tag
        >+${selectedOptions.length - this.maxTags}</yatl-tag
      >`;
    }

    return html`
      <div part="tags">
        ${repeat(
          selectedOptions.slice(0, this.maxTags),
          option => option.value,
          option => this.renderTag(option),
        )}
        ${extraTag}
      </div>
    `;
  }

  protected renderTag(option: YatlOption) {
    return html`<yatl-tag
      dismissable
      @yatl-tag-dismiss=${(event: Event) =>
        this.handleTagDissmiss(option, event)}
      >${option.textContent}</yatl-tag
    >`;
  }

  protected renderClearIcon() {
    if (!this.clearable || this.value.length === 0) {
      return nothing;
    }

    return html`
      <yatl-button
        part="clear-icon"
        slot="end"
        @click=${this.handleClearButtonClick}
      >
        <yatl-icon name="close"></yatl-icon>
      </yatl-button>
    `;
  }

  protected renderArrowIcon() {
    return html`
      <yatl-icon part="arrow-icon" name="chevron-down"></yatl-icon>
    `;
  }

  private handleTagDissmiss(option: YatlOption, event: Event) {
    (event.target as HTMLElement).remove();
    this.toggleOption(option.value, false);
    this.dispatchChange();
  }

  private handleSlotChange() {
    this.updateSelectedOptions();
  }

  private handleClearButtonClick(event: Event) {
    event.stopPropagation();
    this.value = [];
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

  private handleDropdownSelect(event: YatlDropdownSelectEvent) {
    // Stop the dropdown from closing
    if (this.multi) {
      event.preventDefault();
    }

    const item = event.item;
    this.toggleOption(item.value, item.checked);
    this.dispatchChange();
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
    return [...this.querySelectorAll('yatl-option')];
  }

  private dispatchChange() {
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-select': YatlSelect;
  }
}
