import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { YatlOption } from '../../option/option';
import { YatlFormControl } from '../form-control/form-control';
import { YatlInput } from '../input/input';
import styles from './search-select.styles';
import { YatlSearchEngine, YatlSearchResult } from '@timlassiter11/yatl';
import { YatlOptionData } from '../../../types';
import { classMap } from 'lit/directives/class-map.js';

@customElement('yatl-search-select')
export class YatlSearchSelect extends YatlFormControl<string[]> {
  public static override styles = [...super.styles, styles];
  public static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    // We have to use manual focus delegation for this one
    // or else when the user tries to clear a selection option
    // it sends focus to the input and shows all the options.
    delegatesFocus: false,
  };

  private optionObserver = new MutationObserver(() => this.handleMutation());

  private query = '';
  private searchEngine = new YatlSearchEngine<YatlOptionData>({
    fields: [{ field: 'label' }],
    tokenizedSearch: true,
    scoredSearch: true,
  });

  // Don't make this a state to improve performance
  @state() private hasQuery = false;
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
  public get value() {
    return [...this._value];
  }

  @property({ attribute: false })
  public set value(value) {
    this._value = [...value];
    this.setFormValue(this.formValue);
    this.updateSelectedOptions();
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
    document.addEventListener('pointerdown', this.handleFocus);
    this.optionObserver.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['label', 'value'],
    });
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this.handleFocus);
    this.optionObserver.disconnect();
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
          id=${this.inputId}
          type="search"
          placeholder=${this.placeholder}
          autocomplete="off"
          @input=${this.handleInput}
        />
        ${this.renderContents()}
      </div>
    `;
  }

  protected renderContents() {
    if ((this.hasFocus || !this.hasSelection) && !this.noMatch) {
      const classes = { 'has-query': this.hasQuery };
      return html`<slot part="options" class=${classMap(classes)}></slot>`;
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
      this.emitInteraction('change');
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
    const target = event.target as YatlInput;
    this.query = target.value.toLocaleLowerCase();
    this.hasQuery = !!this.query;
    this.updateVisibleOptions();
  }

  private handleSelectedOptionClick(event: Event) {
    event.stopPropagation();
    const target = event.currentTarget as YatlOption;
    this.toggleOption(target.value, false);
    target.remove();
    this.emitInteraction('change');
  }

  private handleMutation() {
    this.updateSelectedOptions();
    this.updateVisibleOptions();
  }

  private updateVisibleOptions() {
    const options = this.getAllOptions();

    // No query, everything is visible
    if (!this.query) {
      this.noMatch = false;
      options.forEach(o => {
        o.hidden = false;
        o.highlightIndices = undefined;
        o.style.order = '';
      });
      return;
    }

    const results = this.searchEngine.search(this.query);
    this.noMatch = results.length === 0;

    const resultsMap = new Map<string, YatlSearchResult<YatlOptionData>>();
    for (const result of results) {
      resultsMap.set(result.item.value, result);
    }

    for (const option of options) {
      const result = resultsMap.get(option.value);
      option.hidden = result === undefined;
      option.highlightIndices = result?.matches['label'];
      option.style.order = String(result?.rank ?? '');
    }
  }

  private updateSelectedOptions() {
    const optionData: YatlOptionData[] = [];
    for (const option of this.getAllOptions()) {
      optionData.push({ label: option.label, value: option.value });
      option.checkable = true;
      option.checked = this.value.includes(option.value);
    }
    this.searchEngine.data = optionData;
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
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-search-select': YatlSearchSelect;
  }
}
