import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { repeat } from 'lit/directives/repeat.js';

import theme from '../theme';
import styles from './yatl-toolbar.styles';
import {
  YatlDropdownSelectEvent,
  YatlToolbarExportClick,
  YatlToolbarSearchChange,
  YatlToolbarSearchInput,
} from '../events';
import { YatlTableController } from '../yatl-table-controller';
import { DisplayColumnOptions, NestedKeyOf, UnspecifiedRecord } from '../types';

/**
 * A table toolbar component with a search input, column picker, and export button.
 *
 * @element yatl-toolbar
 * @summary Provides a cohesive set of controls for searching, exporting, and managing column visibility,
 * along with a flexible slot for custom actions.
 *
 * @slot - Adds contents to the right of the toolbar button group
 * @slot toolbar-button-group - Adds content into the toolbar button group.
 * @slot column-picker-trigger - Replaces the button used to trigger the column picker.
 * @slot column-picker-icon - Replaces the icon for the column picker button.
 * @slot export-button-icon - Replaces the icon for the export button.
 *
 * @fires yatl-toolbar-search-input - Fired synchronously as the user types in the search box. Useful for real-time highlighting or suggestions.
 * @fires yatl-toolbar-search-change - Fired when the user commits a search query (e.g., on 'Enter' or blur). Use this for triggering the actual table filter.
 * @fires yatl-toolbar-export-click - Fired when the export button is clicked. Payload indicates the requested format.
 * @fires yatl-column-toggle-request - Fired when a column's visibility is toggled in the dropdown. The consumer must handle this by updating the table state.
 *
 */
@customElement('yatl-toolbar')
export class YatlToolbar<
  T extends object = UnspecifiedRecord,
> extends LitElement {
  public static override styles = [theme, styles];

  private _controller?: YatlTableController<T>;
  @property({ attribute: false })
  public get controller() {
    return this._controller;
  }
  public set controller(controller) {
    if (this._controller === controller) {
      return;
    }

    this._controller = controller;
    controller?.attach(this);
  }

  @property({ type: Boolean })
  public showColumnPicker = true;

  @property({ type: Boolean })
  public showExportButton = true;

  protected override render() {
    return html`
      <div part="base">
        <yatl-input
          part="search"
          type="search"
          placeholder="Search"
          .value=${this.controller?.searchQuery ?? ''}
          @input=${this.onSearchInput}
          @change=${this.onSearchChange}
        ></yatl-input>
        <yatl-button-group>
          ${this.showColumnPicker ? this.renderColumnPicker() : nothing}
          ${this.showExportButton ? this.renderExportButton() : nothing}
          <slot name="button-group"></slot>
        </yatl-button-group>
        <slot></slot>
      </div>
    `;
  }

  protected renderColumnPicker() {
    return html`
      <yatl-dropdown
        part="column-picker"
        @yatl-dropdown-select=${this.handleDropdownSelect}
      >
        <yatl-button
          slot="trigger"
          part="column-picker-trigger"
          title="Show/hide columns"
        >
          <slot name="column-picker-icon">
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
          </slot>
        </yatl-button>
        ${repeat(
          this.controller?.displayColumns ?? [],
          s => s.field,
          s => this.renderColumnVisibilityToggle(s),
        )}
      </yatl-dropdown>
    `;
  }

  protected renderColumnVisibilityToggle(column: DisplayColumnOptions<T>) {
    const state = this.controller!.getColumnState(column.field);
    return html`
      <yatl-option
        part="column-picker-item"
        checkable
        .checked=${state.visible}
        .value=${state.field}
        >${column.title}
      </yatl-option>
    `;
  }

  private handleDropdownSelect = (event: YatlDropdownSelectEvent) => {
    event.preventDefault();
    this.controller?.toggleColumnVisibility(
      event.item.value as NestedKeyOf<T>,
      event.item.checked,
    );
  };

  protected renderExportButton() {
    return html`
      <yatl-button type="button" @click=${this.onExportClick}>
        <slot name="export-button-icon">
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
        </slot>
      </yatl-button>
    `;
  }

  private onSearchInput = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    this.controller?.search(input.value);
    this.dispatchEvent(new YatlToolbarSearchInput(input.value));
  };

  private onSearchChange = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    this.dispatchEvent(new YatlToolbarSearchChange(input.value));
  };

  private onExportClick = (_event: Event) => {
    this.dispatchEvent(new YatlToolbarExportClick());
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-toolbar': YatlToolbar;
  }
}
