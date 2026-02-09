import { html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { YatlDropdownSelectEvent } from '../../events';
import { YatlOption } from '../../yatl-option';
import { YatlFormControl } from '../yatl-form-control';

import theme from '../../theme';
import formStyles from '../yatl-form-control/yatl-form-control.styles';
import styles from './yatl-search-select.styles';
import { YatlInput } from '../yatl-input';
import { YatlDropdown } from '../../yatl-dropdown';

@customElement('yatl-search-select')
export class YatlSearchSelect extends YatlFormControl<string[]> {
  public static override styles = [theme, formStyles, styles];

  @query('slot:not([name])')
  private defaultSlot?: HTMLSlotElement;

  @state()
  private noMatch = false;

  @property({ type: String, attribute: 'no-results-text' })
  public noResultsText = 'No matching options...';

  @property({ type: Boolean, reflect: true })
  public open = false;

  @property({ type: Boolean, attribute: 'match-width' })
  public matchWidth = true;

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
        .matchWidth=${this.matchWidth}
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
        <slot @slotchange=${this.handleSlotChange}></slot>
        ${this.renderDropdownContents()}
      </yatl-dropdown>
      <div class="text-input">${this.renderSelectedOptions()}</div>
    `;
  }

  protected renderDropdownContents() {
    return this.noMatch
      ? html`<span part="empty-options">${this.noResultsText}</span>`
      : nothing;
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
      <yatl-option
        value=${option.value}
        label=${option.label}
        @click=${this.handleSelectedOptionClick}
      >
        <yatl-icon
          part="selected-trash-icon"
          slot="end"
          name="trash"
        ></yatl-icon>
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

  private handleSelectedOptionClick(event: Event) {
    const target = event.currentTarget as YatlOption;
    this.toggleOption(target.value, false);
    target.remove();
    this.dispatchChange();
  }

  private updateVisibleOptions(query: string) {
    // If we don't have a query we automatically have a match
    let noMatch = query ? true : false;
    for (const option of this.getAllOptions()) {
      if (!query) {
        option.hidden = false;
        continue;
      }

      const text = option.label.toLocaleLowerCase();
      const match = text?.includes(query) ?? false;
      option.hidden = !match;
      if (match) {
        noMatch = false;
      }
    }

    this.noMatch = noMatch;
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
    const slottedOptions =
      this.defaultSlot
        ?.assignedElements({ flatten: true })
        .filter(e => e instanceof YatlOption) ?? [];
    return [...slottedOptions];
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
