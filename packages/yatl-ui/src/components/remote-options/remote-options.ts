import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import { repeat } from 'lit/directives/repeat.js';

export interface YatlOptionData {
  value: string;
  label: string;
}

export type FetchApi = (input: string) => Promise<Response | unknown>;

@customElement('yatl-remote-options')
export class YatlRemoteOptions extends YatlBase {
  @state() private isLoading = false;
  @state() private options: YatlOptionData[] = [];

  private _data?: unknown;
  /** The raw JSON data returned from the API */
  public get data() {
    return this._data;
  }

  /**
   * The URI used to fetch the data
   */
  @property({ type: String })
  public uri = '';

  @property({ attribute: false })
  public parser?: (data: unknown) => YatlOptionData[];

  @property({ attribute: false })
  public fetchClient: FetchApi = fetch;

  // We don't want this to be shadow DOM
  // so the selects can find the options.
  protected override createRenderRoot() {
    return this;
  }

  protected override willUpdate(
    changedProperties: PropertyValues<YatlRemoteOptions>,
  ): void {
    super.willUpdate(changedProperties);

    if (changedProperties.has('uri') || changedProperties.has('parser')) {
      this.fetchOptions();
    }
  }

  protected override render() {
    if (this.isLoading) {
      return html`<yatl-option label="Loading..." disabled></yatl-option>`;
    }

    return repeat(
      this.options,
      option => option.value,
      option => this.renderOption(option),
    );
  }

  protected renderOption(option: YatlOptionData) {
    return html`<yatl-option
      value=${option.value}
      label=${option.label}
    ></yatl-option>`;
  }

  private async fetchOptions() {
    this.isLoading = true;
    try {
      const response = await this.fetchClient(this.uri);

      if (response instanceof Response) {
        this._data = await response.json();
      } else {
        this._data = response;
      }

      if (this.parser) {
        this.options = [...this.parser(this.data)];
      } else if (Array.isArray(this.data)) {
        this.options = this.data.map(v => {
          if (isOptionData(v)) {
            return {
              value: String(v.value),
              label: String(v.label),
            };
          }
          return {
            value: String(v),
            label: String(v),
          };
        });
      } else {
        // This shouldn't happen but if we only get one value back
        // we will just treat it as a single option. Maybe warn user?
        this.options = [{ value: String(this.data), label: String(this.data) }];
      }

      // We have to set this before we await the update
      // since it prevents the children from being rendered.
      this.isLoading = false;
      await this.updateComplete;
      // We know the select looks for a slot change to update it's options.
      // Just hook into that to let it know new options are available.
      this.dispatchEvent(
        new Event('slotchange', {
          bubbles: true,
          composed: true,
        }),
      );
    } finally {
      this.isLoading = false;
    }
  }
}

function isOptionData(value: unknown): value is YatlOptionData {
  return (
    value != null &&
    typeof value === 'object' &&
    'value' in value &&
    'label' in value
  );
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-remote-options': YatlRemoteOptions;
  }
}
