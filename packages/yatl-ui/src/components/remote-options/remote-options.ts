import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import { repeat } from 'lit/directives/repeat.js';
import { YatlOptionData } from '../../types';

export type FetchApi = (input: string) => Promise<Response | unknown>;

const promiseCache = new Map<string, Promise<unknown>>();
const refCount = new Map<string, number>();

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
   * @attr uri
   */
  @property({ type: String })
  public uri = '';

  /** A function used to convert the raw fetched data into option data. */
  @property({ attribute: false })
  public parser?: (data: unknown) => YatlOptionData[];

  /** The function used to perform the fetch request. Defaults to `window.fetch`. */
  @property({ attribute: false })
  public fetchClient: FetchApi = uri => window.fetch(uri);

  /**
   * If set to false, fresh data will always be loaded instead of using the cache.
   * @attr no-cache
   */
  @property({ type: Boolean, attribute: 'no-cache' })
  public noCache = false;

  // We don't want this to be shadow DOM
  // so the selects can find the options.
  protected override createRenderRoot() {
    return this;
  }

  public override connectedCallback() {
    super.connectedCallback();
    if (this.uri) {
      updateRefCount(this.uri, 1);
    }
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.uri) {
      updateRefCount(this.uri, -1);
    }
  }

  protected override willUpdate(
    changedProperties: PropertyValues<YatlRemoteOptions>,
  ): void {
    super.willUpdate(changedProperties);

    if (changedProperties.has('uri')) {
      const oldUri = changedProperties.get('uri');
      // If oldUri exists, this is a dynamic property change, not the initial mount.
      // We must decrement the old and increment the new.
      if (oldUri !== undefined) {
        updateRefCount(oldUri, -1);
        if (this.uri) {
          updateRefCount(this.uri, 1);
        }
      }
    }

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
    if (!this.uri) {
      return;
    }

    // Capture the uri this call is for - willUpdate() calls fetchOptions()
    // fire-and-forget on every uri change, so an older, slower call can
    // still be in flight (and resolve later) when a newer one starts.
    const requestUri = this.uri;

    try {
      let data: unknown;
      if (!this.noCache && promiseCache.has(requestUri)) {
        data = await promiseCache.get(requestUri)!;
      } else {
        this.isLoading = true;
        try {
          const promise = this.promiseToJson(requestUri);
          if (!this.noCache) {
            promiseCache.set(requestUri, promise);
          }
          data = await promise;
        } finally {
          if (requestUri === this.uri) {
            this.isLoading = false;
          }
        }
      }

      if (requestUri !== this.uri) {
        // uri changed again while this request was in flight - a newer
        // fetchOptions() call owns the current uri's options now.
        return;
      }

      this._data = data;

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

      await this.updateComplete;
      // We know the select looks for a slot change to update it's options.
      // Just hook into that to let it know new options are available.
      this.dispatchEvent(
        new Event('slotchange', {
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      // fetchOptions() is called fire-and-forget from willUpdate(), so an
      // uncaught rejection here would be unhandled. Leave any previously
      // loaded options in place rather than clearing them.
      console.error(error);
    }
  }

  private async promiseToJson(uri: string) {
    try {
      const response = await this.fetchClient(uri);
      if (response instanceof Response) {
        return await response.json();
      } else {
        return response;
      }
    } catch (error) {
      promiseCache.delete(uri);
      throw error;
    }
  }
}

function updateRefCount(key: string, delta = 1) {
  const count = (refCount.get(key) ?? 0) + delta;
  if (!refCount.has(key) && count > 0) {
    refCount.set(key, delta);
  } else if (count > 0) {
    refCount.set(key, count);
  } else {
    refCount.delete(key);
    promiseCache.delete(key);
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
