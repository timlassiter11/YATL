import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { YatlOption } from '../../yatl-option';
import { YatlFormControl } from '../yatl-form-control';
import { YatlInput } from '../yatl-input';

import styles from './yatl-search-select.styles';

@customElement('yatl-search-select')
export class YatlSearchSelect extends YatlFormControl<string[]> {
  public static override styles = [...YatlFormControl.styles, styles];
  public static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    // We have to use manual focus delegation for this one
    // or else when the user tries to clear a selection option
    // it sends focus to the input and shows all the options.
    delegatesFocus: false,
  };

  @state() private noMatch = false;
  @state() private hasFocus = false;

  @property({ type: String })
  public placeholder = 'Search';

  @property({ type: String, attribute: 'no-results-text' })
  public noResultsText = 'No matching options...';

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

  public get hasSelection() {
    return this.value.length > 0;
  }

  constructor() {
    super();
    this.addEventListener('click', this.handleOptionClick);
  }

  public override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('focusin', this.handleFocus);
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('focusin', this.handleFocus);
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
      <div class="text-input" style=${`--size: ${this.size + 1}`}>
        <input
          part="search"
          type="search"
          placeholder=${this.placeholder}
          @input=${this.handleInput}
        />
        ${this.renderContents()}
      </div>
    `;
  }

  protected renderContents() {
    if ((this.hasFocus || !this.hasSelection) && !this.noMatch) {
      return html`<slot
        part="options"
        @slotchange=${this.handleSlotChange}
      ></slot>`;
    } else if (this.noMatch) {
      return html`<span part="empty-options">${this.noResultsText}</span>`;
    }

    return this.renderSelectedOptions();
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
    // Make them checkable so the text indentation matches.
    // We'll make sure to hide the icon with CSS.
    return html`
      <yatl-option
        value=${option.value}
        label=${option.label}
        checkable
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

  private handleOptionClick = (event: Event) => {
    if (event.target instanceof YatlOption) {
      this.hasFocus = true;
      event.preventDefault();
      event.stopPropagation();
      this.toggleOption(event.target.value, event.target.checked);
      this.dispatchChange();
    }
  };

  private handleFocus = (event: FocusEvent) => {
    const path = event.composedPath();
    if (!path.includes(this)) {
      this.hasFocus = false;
    } else if (this.formControl && path.includes(this.formControl)) {
      this.hasFocus = true;
    }
  };

  private handleInput(event: Event) {
    event.stopPropagation();
    const query = (event.target as YatlInput).value.toLocaleLowerCase();
    this.updateVisibleOptions(query);
  }

  private handleSlotChange() {
    this.updateSelectedOptions();
  }

  private handleSelectedOptionClick(event: Event) {
    event.stopPropagation();
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

  private getAllOptions(includeDisabled = false) {
    const options = [...this.querySelectorAll<YatlOption>(':not([slot])')];
    return includeDisabled ? options : options.filter(o => !o.disabled);
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
