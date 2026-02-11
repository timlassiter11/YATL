import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import { YatlDropdownSelectEvent } from '../../../events';
import { YatlFormControl } from '../yatl-form-control';
import styles from './yatl-typeahead.styles';

@customElement('yatl-typeahead')
export class YatlTypeahead extends YatlFormControl {
  public static override styles = [...super.styles, styles];

  private _uri = '';
  private _minQueryLength = 3;
  private _searchParam = 'search';
  private _debounceTimer = 0;

  @state() private loading = false;
  @state() private error = false;
  @state() private options = new Set<string>();
  @state() private open = false;

  @property({ type: String })
  public placeholder = '';

  @property({ type: String, attribute: 'value' })
  public override defaultValue = '';

  @property({ attribute: false })
  public override value: string = '';

  public override get formValue() {
    return this.value;
  }

  @property({ type: String })
  public get uri() {
    return this._uri;
  }
  public set uri(uri) {
    if (this._uri === uri) {
      return;
    }

    const oldValue = this._uri;
    this._uri = uri;
    this.scheduleUpdate();
    this.requestUpdate('uri', oldValue);
  }

  @property({ type: Number, attribute: 'min-query-length' })
  public get minQueryLength() {
    return this._minQueryLength;
  }
  public set minQueryLength(value) {
    if (this._minQueryLength === value) {
      return;
    }

    const oldValue = this._minQueryLength;
    const wasSearching = this.canSearch;
    this._minQueryLength = value;
    if (!wasSearching && this.canSearch) {
      this.scheduleUpdate();
    }
    this.requestUpdate('minQueryLength', oldValue);
  }

  @property({ type: String, attribute: 'search-param' })
  public get searchParam() {
    return this._searchParam;
  }
  public set searchParam(value) {
    if (this._searchParam === value) {
      return;
    }

    const oldValue = this._searchParam;
    this._searchParam = value;
    this.scheduleUpdate();
    this.requestUpdate('searchParam', oldValue);
  }

  @property({ type: Number, attribute: 'search-debounce' })
  public searchDebounce = 200;

  @property({ attribute: false })
  public parser?: (value: unknown) => string[];

  protected get hasOptions() {
    return this.options.size > 0;
  }

  protected get canSearch() {
    return !!this.uri && this.value.length >= this.minQueryLength;
  }

  protected override render() {
    return html`
      ${this.renderLabel()}
      <yatl-dropdown
        .open=${live(this.open)}
        @yatl-dropdown-select=${this.handleDropdownSelect}
        @yatl-dropdown-open-request=${this.handleDropdownRequest}
        @yatl-dropdown-close-request=${this.handleDropdownRequest}
        @yatl-dropdown-close=${this.handleDropdownClose}
      >
        <div slot="trigger" part="base" class="text-input">
          <slot part="start" name="start"></slot>
          <input
            slot="trigger"
            part="input"
            id="input"
            name=${this.name}
            type="text"
            .value=${live(this.value)}
            value=${this.defaultValue}
            placeholder=${this.placeholder}
            ?readonly=${this.readonly}
            ?disabled=${this.disabled}
            ?required=${this.required}
          />
          <slot part="end" name="end"></slot>
        </div>
        ${this.renderDropdownContent()}
      </yatl-dropdown>
      ${this.renderHint()} ${this.renderErrorText()}
    `;
  }

  protected override renderInput() {}

  protected renderDropdownContent() {
    if (this.error) {
      return html`<span class="message" part="error"
        >Failed to get results</span
      >`;
    }

    if (this.loading) {
      return html`<span class="message" part="loading">Loading...</span>`;
    }

    if (this.canSearch && !this.hasOptions) {
      return html`<span class="message" part="empty-options"
        >No results found...</span
      >`;
    }

    if (this.hasOptions) {
      return repeat(this.options, option => this.renderOption(option));
    }

    return nothing;
  }

  protected renderOption(option: string) {
    return html`<yatl-option value=${option} label=${option}></yatl-option>`;
  }

  protected override onValueChange(event: Event): boolean | void {
    // Ignore change events that fire on focus loss
    if (event.type === 'change') {
      return true;
    }

    const target = event.target as HTMLInputElement;
    if (this.value !== target.value) {
      this.value = target.value;
      this.scheduleFetch();
      this.open = this.canSearch;
    }
  }

  private handleDropdownSelect(event: YatlDropdownSelectEvent) {
    this.value = event.item.value;
  }

  private handleDropdownRequest(event: Event) {
    // We want full control on the open state of the dropdown.
    event.preventDefault();
  }

  private handleDropdownClose() {
    // Even though we prevent close requests, we still need to stay in sync
    this.open = false;
  }

  private scheduleFetch() {
    if (!this.canSearch) {
      return;
    }

    // Give the user some indication that we are working
    // even if we are just waiting for them to stop typing
    this.loading = true;
    clearTimeout(this._debounceTimer);
    this._debounceTimer = window.setTimeout(
      () => this.updateOptions(),
      this.searchDebounce,
    );
  }

  private async updateOptions() {
    if (!this.canSearch) {
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
        this.error = true;
        return;
      }

      json = await response.json();
    } catch {
      this.error = true;
      return;
    } finally {
      this.loading = false;
    }

    let options: string[];
    if (this.parser) {
      options = this.parser(json);
    } else if (Array.isArray(json)) {
      options = json.map(o => String(o));
    } else {
      options = [String(json)];
    }

    this.options = new Set(options);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-typeahead': YatlTypeahead;
  }
}
