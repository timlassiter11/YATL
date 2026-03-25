import { html, PropertyValueMap } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import { YatlDropdownSelectEvent } from '../../../events';
import { YatlFormControl } from '../form-control/form-control';
import styles from './typeahead.styles';
import { YatlSearchEngine, YatlSearchResult } from '@timlassiter11/yatl';
import { YatlOptionData } from '../../../types';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * A hybrid typeahead component that searches local data instantly
 * and falls back to a remote endpoint for asynchronous data fetching.
 * @element yatl-typeahead
 * @fires change - Fired when the selected value changes.
 */
@customElement('yatl-typeahead')
export class YatlTypeahead extends YatlFormControl {
  public static override styles = [...super.styles, styles];

  private hasWarnedMissingFields = false;
  private searchDebounceTimer = 0;

  private cacheDirty = false;
  private cachedOptions = new Map<string, YatlOptionData>();
  private searchEngine = new YatlSearchEngine<YatlOptionData>({
    fields: [{ field: 'label' }],
    tokenizedSearch: true,
    scoredSearch: true,
  });

  @state() private userHasSelected = false;
  @state() private state: 'idle' | 'loading' | 'error' = 'idle';
  @state() private searchResults: YatlSearchResult<YatlOptionData>[] = [];

  /**
   * Placeholder text shown when the input is empty.
   */
  @property({ type: String })
  public placeholder = '';

  /**
   * The initial, uncontrolled value of the typeahead.
   */
  @property({ type: String, attribute: 'value' })
  public override defaultValue = '';

  /**
   * The current, controlled value of the typeahead input.
   */
  @property({ attribute: false })
  public override value: string = '';

  public override get formValue() {
    return this.value;
  }

  /** The minimum length of input that will be considered valid. */
  @property({ type: Number })
  public minlength?: number;

  /** The maximum length of input that will be considered valid. */
  @property({ type: Number })
  public maxlength?: number;

  /**
   * The remote endpoint URL to fetch search results from.
   * If left blank, the component will only search local data.
   */
  @property({ type: String })
  public uri = '';

  /**
   * The property key within the data objects to use as the underlying value.
   * @attr value-field
   */
  @property({ type: String, attribute: 'value-field' })
  public valueField = '';

  /**
   * The property key within the data objects to display visually in the dropdown.
   * @attr label-field
   */
  @property({ type: String, attribute: 'label-field' })
  public labelField = '';

  /**
   * Maximum number of options to display in the dropdown at one time.
   * @attr max-options
   * @default 20
   */
  @property({ type: Number, attribute: 'max-options' })
  public maxOptions = 20;

  /**
   * Minimum number of characters required before firing a remote network request.
   * Note: Local searches trigger instantly regardless of this value.
   * @attr min-query-length
   * @default 3
   */
  @property({ type: Number, attribute: 'min-query-length' })
  public minQueryLength = 3;

  /**
   * The URL query parameter key used to pass the search string to the endpoint.
   * @attr search-param
   * @default "search"
   */
  @property({ type: String, attribute: 'search-param' })
  public searchParam = 'search';

  /**
   * Time in milliseconds to wait after the last keystroke before fetching remote data.
   * @attr search-debounce
   * @default 200
   */
  @property({ type: Number, attribute: 'search-debounce' })
  public searchDebounce = 200;

  /**
   * Optional adapter function to intercept and normalize the raw API response
   * before it is processed by the search engine.
   */
  @property({ attribute: false })
  public transformResponse?: (value: unknown) => unknown[];

  /**
   * An array of pre-loaded objects to search through locally.
   */
  @property({ attribute: false })
  public localData?: unknown[];

  protected get open() {
    return (
      (this.canSearchCache || this.canSearchRemote) && !this.userHasSelected
    );
  }

  protected get hasOptions() {
    return this.searchResults.length > 0;
  }

  public get canSearch() {
    return this.value.length >= this.minQueryLength;
  }

  protected get canSearchCache() {
    return this.searchEngine.data.length > 0 && this.canSearch;
  }

  protected get canSearchRemote() {
    return !!this.uri && this.canSearch;
  }

  protected override willUpdate(
    changedProperties: PropertyValueMap<YatlTypeahead>,
  ) {
    super.willUpdate(changedProperties);

    let cacheCleared = false;
    if (
      changedProperties.has('labelField') ||
      changedProperties.has('valueField') ||
      changedProperties.has('transformResponse')
    ) {
      // Clear cache if the mapping rules or transformers change
      this.cachedOptions.clear();
      cacheCleared = true;
    }

    if (changedProperties.has('localData') || cacheCleared) {
      // Load local data into the search engine cache if its new or was cleared
      if (this.localData) {
        this.addDataToCache(this.localData);
        this.updateMatchedOptions();
      }
    }

    if (
      changedProperties.has('uri') ||
      changedProperties.has('searchParam') ||
      changedProperties.has('minQueryLength')
    ) {
      // If any of the remote configuration properties changed schedule a fetch request
      if (this.canSearchRemote) {
        this.scheduleFetch();
      }
    }
  }

  protected override renderInput() {
    return html`
      <yatl-dropdown
        .open=${live(this.open)}
        @yatl-dropdown-select=${this.handleDropdownSelect}
        @yatl-dropdown-open-request=${this.handleDropdownRequest}
        @yatl-dropdown-close-request=${this.handleDropdownRequest}
      >
        <div slot="trigger" part="base" class="text-input">
          <slot part="start" name="start"></slot>
          <input
            slot="trigger"
            part="input"
            id=${this.inputId}
            name=${this.name}
            type="text"
            autocomplete="off"
            .value=${live(this.value)}
            value=${this.defaultValue}
            placeholder=${this.placeholder}
            minlength=${ifDefined(this.minlength)}
            maxlength=${ifDefined(this.maxlength)}
            ?readonly=${this.readonly}
            ?disabled=${this.disabled}
            ?required=${this.required}
            @input=${this.handleChange}
            @change=${this.handleChange}
          />
          <slot part="end" name="end"></slot>
        </div>
        ${this.renderDropdownContent()}
      </yatl-dropdown>
    `;
  }

  protected renderDropdownContent() {
    if (this.state === 'error') {
      return html`<span class="message" part="error"
        >Failed to get results</span
      >`;
    }

    if (this.state === 'loading') {
      return html`<span class="message" part="loading">Loading...</span>`;
    }

    if (!this.hasOptions && this.canSearchCache && this.value) {
      // Only show the no results message if they actually
      // searched and have options to search through.
      return html`<span class="message" part="empty-options"
        >No results found...</span
      >`;
    }

    const max = Math.min(this.maxOptions, this.searchResults.length);
    const results = this.searchResults.slice(0, max);
    return repeat(
      results,
      result => result.item,
      result => this.renderOption(result),
    );
  }

  protected renderOption(result: YatlSearchResult<YatlOptionData>) {
    return html`<yatl-option
      value=${result.item.value}
      label=${result.item.label}
      .highlightIndices=${result.matches['label']}
    ></yatl-option>`;
  }

  private handleChange(event: Event) {
    event.stopPropagation();
    const target = event.target as HTMLInputElement;
    if (this.value !== target.value) {
      this.userHasSelected = false;
      this.value = target.value;
      this.updateMatchedOptions();
      this.scheduleFetch();
    }
  }

  private handleDropdownSelect(event: YatlDropdownSelectEvent) {
    event.stopPropagation();
    this.value = event.item.value;
    this.userHasSelected = true;
    this.emitInteraction('change');
  }

  private handleDropdownRequest(event: Event) {
    // We want full control on the open state of the dropdown.
    event.preventDefault();
  }

  private scheduleFetch() {
    if (!this.canSearchRemote) {
      return;
    }

    // Give the user some indication that we are working
    // even if we are just waiting for them to stop typing
    this.state = 'loading';
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = window.setTimeout(
      () => this.fetchOptions(),
      this.searchDebounce,
    );
  }

  private async fetchOptions() {
    if (!this.canSearchRemote) {
      return;
    }

    let url: URL;
    try {
      // If they provided a full URL this will work.
      url = new URL(this.uri);
    } catch {
      // If not, use the current location as the base.
      url = new URL(this.uri, window.location.toString());
    }

    let json: unknown;
    url.searchParams.set(this.searchParam, this.value);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        this.state = 'error';
        return;
      }

      json = await response.json();
    } catch {
      this.state = 'error';
      return;
    }

    let normalizedData;
    if (this.transformResponse) {
      normalizedData = this.transformResponse(json);
    } else if (Array.isArray(json)) {
      normalizedData = json;
    } else {
      // TODO: Handle error.
    }

    if (normalizedData) {
      this.addDataToCache(normalizedData);
    }
    this.state = 'idle';
  }

  private addDataToCache(data: unknown[]) {
    this.cacheDirty = true;
    const options = this.getOptionsFromData(data);

    for (const option of options) {
      if (option.value) {
        // Don't add null, undefined, or empty values
        this.cachedOptions.set(option.value, option);
      }
    }
    this.updateMatchedOptions();
  }

  private updateMatchedOptions() {
    if (this.cacheDirty) {
      this.searchEngine.data = [...this.cachedOptions.values()];
      this.cacheDirty = false;
    }

    if (this.canSearchCache) {
      this.searchResults = this.searchEngine.search(this.value);
    } else {
      this.searchResults = [];
    }
  }

  private getOptionsFromData(data: unknown[]) {
    const options: YatlOptionData[] = [];
    const labelField = this.labelField || this.valueField;
    const valueField = this.valueField || this.labelField;
    for (const item of data as Record<string, unknown>[]) {
      if (typeof item === 'string') {
        options.push({ label: item, value: item });
      } else if (labelField in item && valueField in item) {
        const label = String(item[labelField] ?? '');
        const value = String(item[valueField] ?? '');

        options.push({ label: label, value: value });
      } else {
        this.warnMissingFields();
        // Abort and return empty options since we can't trust the data.
        return [];
      }
    }

    return options;
  }

  private warnMissingFields() {
    if (!this.hasWarnedMissingFields) {
      this.hasWarnedMissingFields = true;
      console.warn(warnMissingFieldsMessage, this);
    }
  }
}

const warnMissingFieldsMessage = `
[yatl-typeahead] Cannot parse remote data.
The endpoint returned complex objects, but no 'label-field' or 'value-field' was provided.

To fix this, either:
1. Add mapping attributes (label-field / value-field).
2. Use 'transformResponse' to convert the payload into a flat array of strings.
`;

declare global {
  interface HTMLElementTagNameMap {
    'yatl-typeahead': YatlTypeahead;
  }
}
