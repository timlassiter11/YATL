import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import theme from '../theme';
import { YatlDropdownToggleEvent } from '../yatl-dropdown-item';
import { repeat } from 'lit/directives/repeat.js';

export interface ColumnVisibilityToggleState {
  field: string;
  title: string;
  visible: boolean;
}

@customElement('yatl-toolbar')
export class YatlToolbar extends LitElement {
  public static override styles = [
    theme,
    css`
      :host {
        box-sizing: border-box;
      }

      .toolbar {
        display: flex;
        flex-direction: row;
        gap: 10px;
      }

      .search {
        flex-grow: 1;
        border-radius: var(--yatl-input-radius);
        background-color: var(--bg-subtle);
        line-height: 1;
        border: none;
        font-size: large;
        padding: var(--yatl-input-padding);
      }

      .search:focus,
      .search:focus-visible {
        outline: 3px solid var(--yatl-brand-color);
        outline-offset: -3px;
      }

      yatl-button-group yatl-button {
        height: 100%;
      }
    `,
  ];

  @property({ type: Boolean })
  public showColumnPicker = true;

  @property({ type: Boolean })
  public showExportButton = true;

  @property({ attribute: false })
  public columnVisibilityStates: ColumnVisibilityToggleState[] = [];

  @property({ type: String })
  public searchQuery = '';

  protected override render() {
    return html`
      <div class="toolbar">
        <input
          part="search"
          class="search"
          type="search"
          placeholder="Search"
          value=${this.searchQuery}
          @input=${this.onSearchInput}
          @change=${this.onSearchChange}
        />
        <yatl-button-group>
          ${this.showColumnPicker ? this.renderColumnPicker() : nothing}
          ${this.showExportButton ? this.renderExportButton() : nothing}
          <slot></slot>
        </yatl-button-group>
      </div>
    `;
  }

  protected renderColumnPicker() {
    return html`
      <yatl-dropdown @yatl-dropdown-toggle=${this.handleDropdownToggle}>
        <yatl-button slot="trigger" title="Show/hide columns">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"
            />
          </svg>
        </yatl-button>
        ${repeat(
          this.columnVisibilityStates,
          s => s.field,
          s => this.renderColumnVisibilityToggle(s),
        )}
      </yatl-dropdown>
    `;
  }

  protected renderColumnVisibilityToggle(state: ColumnVisibilityToggleState) {
    return html`
      <yatl-dropdown-item .checked=${state.visible} .value=${state.field}
        >${state.title}</yatl-dropdown-item
      >
    `;
  }

  private handleDropdownToggle = (event: YatlDropdownToggleEvent) => {
    this.dispatchEvent(
      new CustomEvent<YatlColumnToggleDetail>('yatl-column-toggle', {
        composed: true,
        bubbles: true,
        detail: {
          field: event.detail.value,
          visible: event.detail.checked,
        },
      }),
    );
  };

  protected renderExportButton() {
    return html`
      <yatl-button type="button" @click=${this.onExportClick}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </yatl-button>
    `;
  }

  private onSearchInput = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent('yatl-search-input', {
        composed: true,
        bubbles: true,
        detail: {
          value: input.value,
        },
      }),
    );
  };

  private onSearchChange = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent('yatl-search-change', {
        composed: true,
        bubbles: true,
        detail: {
          value: input.value,
        },
      }),
    );
  };

  private onExportClick = (event: Event) => {
    this.dispatchEvent(
      new CustomEvent('yatl-export', {
        composed: true,
        bubbles: true,
      }),
    );
  };
}

interface YatlColumnToggleDetail {
  field: string;
  visible: boolean;
}

export type YatlColumnToggleEvent = CustomEvent<YatlColumnToggleDetail>;
