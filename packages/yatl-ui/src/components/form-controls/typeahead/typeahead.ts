import {
  deferTemplate,
  UnspecifiedRecord,
  YatlSearchEngine,
  YatlSearchResult,
} from '@timlassiter11/yatl';
import { html, nothing, PropertyValueMap, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import { YatlDropdownSelectEvent } from '../../../events';
import { YatlInput } from '../input/input';
import styles from './typeahead.styles';

/**
 * A hybrid typeahead component that searches local data instantly
 * and falls back to a remote endpoint for asynchronous data fetching.
 * @element yatl-typeahead
 * @fires change - Fired when the selected value changes.
 */
@customElement('yatl-typeahead')
export class YatlTypeahead extends YatlInput {
  public static override styles = [...super.styles, styles];

  private searchDebounceTimer = 0;
  private abortController: AbortController | null = null;

  private cacheDirty = false;
  private cachedData = new Map<string, UnspecifiedRecord>();
  private searchEngine = new YatlSearchEngine<UnspecifiedRecord>({
    tokenizedSearch: true,
    scoredSearch: true,
  });

  @state() private hasFocus = false;
  @state() private userHasSelected = false;
  @state() private state: 'idle' | 'loading' | 'error' = 'idle';
  @state() private searchResults: YatlSearchResult<UnspecifiedRecord>[] = [];

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

  /**
   * When true, the dropdown will always match the width
   * of the input regardless of the contents width.
   * @attr match-width
   */
  @property({ type: Boolean, attribute: 'match-width' })
  public matchWidth = false;

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
  public valueField: string = 'value';

  /**
   * The property key within the data objects to display visually in the dropdown.
   * @attr label-field
   */
  @property({ type: String, attribute: 'label-field' })
  public labelField: string = 'label';

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
  public transformResponse?: (value: unknown) => UnspecifiedRecord[];

  /**
   * A custom render function for dropdown options.
   *
   * **Note on Primitives:** If your data source provides a flat array of strings/numbers,
   * the component automatically wraps them into objects using your `label-field` and
   * `value-field` properties. Your render function will receive this generated object,
   * not the original primitive string.
   */
  @property({ attribute: false })
  public renderOption?: (item: UnspecifiedRecord) => unknown;

  /**
   * An array of pre-loaded objects to search through locally.
   */
  @property({ attribute: false })
  public localData?: unknown[];

  private get hasResults() {
    return this.searchResults.length > 0;
  }

  private get canSearch() {
    return this.value.length >= this.minQueryLength;
  }

  private get canSearchCache() {
    return this.searchEngine.data.length > 0 && this.canSearch;
  }

  private get canSearchRemote() {
    return !!this.uri && this.canSearch;
  }

  private get shouldOpen() {
    return (
      this.hasFocus &&
      this.canSearchCache &&
      !this.userHasSelected &&
      this.state !== 'error'
    );
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
      // Clear cache if the mapping rules or transformer changes
      this.cachedData.clear();
      cacheCleared = true;

      if (changedProperties.has('labelField')) {
        this.searchEngine.searchFields = [{ field: this.labelField }];
      }
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

    if (!this.uri && !this.localData) {
      this.warnMissingUri();
    }
  }

  protected override renderBase(contents: unknown): TemplateResult<1> {
    return html`
      <yatl-dropdown
        .open=${live(this.shouldOpen)}
        ?match-width=${this.matchWidth}
        @yatl-dropdown-select=${this.handleDropdownSelect}
        @yatl-dropdown-toggle-request=${this.handleDropdownToggleRequest}
        @focusin=${this.handleFocusin}
        @focusout=${this.handleFocusout}
      >
        <div slot="trigger">${super.renderBase(contents)}</div>
        ${this.renderDropdownContent()}
      </yatl-dropdown>
    `;
  }

  protected override renderInput() {
    return html`
      ${super.renderInput()}
      <yatl-spinner
        state=${this.state}
        error-duration="0"
        success-duration="0"
        no-overlay
      ></yatl-spinner>
    `;
  }

  protected renderDropdownContent() {
    if (this.value && !this.hasResults) {
      // Only show the no results message if they actually
      // searched and have options to search through.
      return html`
        <slot name="empty-message">
          <span class="message" part="message empty-message"
            >No results found...</span
          >
        </slot>
      `;
    }

    const max = Math.min(this.maxOptions, this.searchResults.length);
    const results = this.searchResults.slice(0, max);
    return repeat(
      results,
      result => result.item,
      result => this.renderResult(result),
    );
  }

  protected renderResult(result: YatlSearchResult<UnspecifiedRecord>) {
    // If the user didn't provide any fields it could mean that the data
    // structure was just a simple list of strings. In that case we
    // create our own internal structure when we add it to the cache.
    const label = result.item[this.labelField];
    const value = result.item[this.valueField];
    const matches = result.matches[this.labelField];
    return html`<yatl-option
      exportparts="base:option-base, start:option-start, end:option-end label:option-label"
      value=${String(value ?? '')}
      label=${String(label ?? '')}
      .highlightIndices=${matches}
    >
      ${this.renderOption?.(result.item) ?? nothing}
    </yatl-option>`;
  }

  protected override handleChange(event: Event) {
    event.stopPropagation();
    const target = event.target as HTMLInputElement;
    if (this.value !== target.value) {
      this.userHasSelected = false;
      this.value = target.value;
      this.updateMatchedOptions();
      this.scheduleFetch();
    }
    this.emitInteraction(event.type as 'change' | 'input');
  }

  private handleDropdownSelect(event: YatlDropdownSelectEvent) {
    event.stopPropagation();

    this.userHasSelected = true;
    if (this.value !== event.item.value) {
      this.value = event.item.value;
      this.emitInteraction('change');
    }
  }

  private handleDropdownToggleRequest(event: Event) {
    // We want complete control of the open state
    event.preventDefault();
  }

  private handleFocusin() {
    this.hasFocus = true;
  }

  private handleFocusout() {
    this.hasFocus = false;
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

    if (this.abortController) {
      this.abortController.abort();
    }

    const abortController = new AbortController();
    this.abortController = abortController;

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
      const response = await fetch(url, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        this.state = 'error';
        return;
      }

      json = await response.json();
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        this.state = 'error';
      }
      return;
    } finally {
      if (this.abortController === abortController) {
        this.abortController = null;
      }
    }

    let normalizedData;
    if (this.transformResponse) {
      normalizedData = this.transformResponse(json);
    } else if (Array.isArray(json)) {
      normalizedData = json;
    } else {
      // TODO: Handle error.
    }

    // Set state first, if addDataToCache fails, it will set an error state.
    this.state = 'idle';
    if (normalizedData) {
      this.addDataToCache(normalizedData);
    }
  }

  private addDataToCache(data: unknown[]) {
    if (!data || data.length === 0) {
      // No data, so nothing to do.
      return;
    }

    for (const rawItem of data) {
      let item: UnspecifiedRecord;
      if (typeof rawItem === 'object' && rawItem !== null) {
        // we have an actual object so we need to check it for the fields
        if (!(this.labelField in rawItem) || !(this.valueField in rawItem)) {
          // Skip objects with missing fields and warn the user.
          this.warnMissingFields(rawItem);
          continue;
        }
        item = rawItem;
      } else if (rawItem != null) {
        // User provided a list of primitives. Convert them to objects
        // for our search engine and internal cache.
        item = {
          [this.valueField]: String(rawItem),
          [this.labelField]: String(rawItem),
        };
      } else {
        // Skip null and undefined values
        continue;
      }

      const value = item[this.valueField];
      if (value !== undefined) {
        this.cacheDirty = true;
        this.cachedData.set(String(value), item);
      }
    }
    this.updateMatchedOptions();
  }

  private updateMatchedOptions() {
    if (this.cacheDirty) {
      this.searchEngine.data = [...this.cachedData.values()];
      this.cacheDirty = false;
    }

    if (this.canSearchCache) {
      this.searchResults = this.searchEngine.search(this.value);
    } else {
      this.searchResults = [];
    }
  }

  private hasWarnedMissingUri = false;
  private warnMissingUri() {
    if (this.hasWarnedMissingUri) return;

    this.hasWarnedMissingUri = true;
    console.warn(this.warnHeader + warnMissingUriMessage, this);
  }

  private hasWarnedMissingFields = false;
  private warnMissingFields(sample: UnspecifiedRecord) {
    if (this.hasWarnedMissingFields) return;
    this.hasWarnedMissingFields = true;
    const availableKeys = Object.keys(sample)
      .map(k => `'${k}'`)
      .join(', ');

    console.warn(
      this.warnHeader +
        warnMissingFieldsMessage(
          this.labelField,
          this.valueField,
          availableKeys || 'None',
        ),
      this,
    );
  }

  private get warnHeader() {
    return this.name
      ? `[yatl-typeahead](name=${this.name}) `
      : '[yatl-typeahed] ';
  }
}

const warnMissingUriMessage = `
No URI or data was provided. Nothing can be searched...

To fix this, either:
1. Add local data via the localData property.
2. Set the remote URI via the uri property.
`;

const warnMissingFieldsMessage = deferTemplate`
Data mapping failed.
The component is looking for a label field ("${0}") and a value field ("${1}"), but they do not exist on the provided data.
Available keys on your data object are: ${2}

To fix this, either:
1. Provide the 'label-field' and 'value-field' attributes to match your data structure,
2. Use 'transformResponse' to map your data to an array of objects with label and value fields.
`;

declare global {
  interface HTMLElementTagNameMap {
    'yatl-typeahead': YatlTypeahead;
  }
}
