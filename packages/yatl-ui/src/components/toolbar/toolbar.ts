import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { repeat } from 'lit/directives/repeat.js';

import {
  DisplayColumnOptions,
  NestedKeyOf,
  SearchSortPriority,
  UnspecifiedRecord,
  YatlTableController,
} from '@timlassiter11/yatl';
import {
  YatlColumnToggleRequest,
  YatlDropdownSelectEvent,
  YatlToolbarExportClick,
  YatlToolbarSearchChange,
  YatlToolbarSearchInput,
} from '../../events';
import { YatlBase } from '../base/base';
import styles from './toolbar.styles';

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
> extends YatlBase {
  public static override styles = [...super.styles, styles];

  private searchDebounceTimer = 0;

  private _controller?: YatlTableController<T>;
  /** The table controller this toolbar is attached to. */
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

  /**
   * Hides the column visibility picker button.
   * @attr hide-column-picker
   */
  @property({ type: Boolean, attribute: 'hide-column-picker' })
  public hideColumnPicker = false;

  /**
   * Hides the export button.
   * @attr hide-export-button
   */
  @property({ type: Boolean, attribute: 'hide-export-button' })
  public hideExportButton = false;

  /**
   * Hides the button that toggles whether search relevance or the user's
   * column sort takes priority when both are active. See
   * {@link YatlTableController.searchSortPriority}.
   * @attr hide-search-sort-priority-toggle
   */
  @property({ type: Boolean, attribute: 'hide-search-sort-priority-toggle' })
  public hideSearchSortPriorityToggle = false;

  /**
   * Time in milliseconds to wait after the last keystroke before triggering the search.
   * @attr searchdebounce
   */
  @property({ type: Number })
  public searchDebounce = 250;

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
          ${this.hideSearchSortPriorityToggle
            ? nothing
            : this.renderSearchSortPriorityToggle()}
          ${this.hideColumnPicker ? nothing : this.renderColumnPicker()}
          ${this.hideExportButton ? nothing : this.renderExportButton()}
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
          color="raised"
        >
          <slot name="column-picker-icon">
            <yatl-icon name="columns"></yatl-icon>
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
        label=${column.title ?? column.field}
        .checked=${state.visible}
        .value=${state.field}
      ></yatl-option>
    `;
  }

  protected renderSearchSortPriorityToggle() {
    const priority = this.controller?.searchSortPriority ?? 'score';
    const isSortPriority = priority === 'sort';
    const hasActiveSort =
      this.controller?.columnStates.some(state => state.sort !== null) ?? false;

    const title = !hasActiveSort
      ? 'Search results are ranked by relevance (no active sort to prioritize instead)'
      : isSortPriority
      ? 'Your sort order takes priority over search relevance - click to prioritize relevance instead'
      : 'Search relevance takes priority over your sort order - click to prioritize your sort instead';

    return html`
      <yatl-button
        part="search-sort-priority-toggle"
        type="button"
        color="raised"
        title=${title}
        aria-pressed=${isSortPriority ? 'true' : 'false'}
        ?disabled=${!hasActiveSort}
        @click=${this.onToggleSearchSortPriority}
      >
        <yatl-icon
          name=${isSortPriority ? 'sort-priority' : 'search-priority'}
        ></yatl-icon>
      </yatl-button>
    `;
  }

  protected renderExportButton() {
    return html`
      <yatl-button type="button" color="raised" @click=${this.onExportClick}>
        <slot name="export-button-icon">
          <yatl-icon name="download"></yatl-icon>
        </slot>
      </yatl-button>
    `;
  }

  private handleDropdownSelect = (event: YatlDropdownSelectEvent) => {
    // Stop dropdown from closing on select event
    event.preventDefault();

    const field = event.item.value as NestedKeyOf<T>;
    const visible = event.item.checked;
    const requestEvent = new YatlColumnToggleRequest(field, visible);
    this.dispatchEvent(requestEvent);
    if (requestEvent.defaultPrevented) {
      return;
    }

    this.controller?.toggleColumnVisibility(field, visible);
  };

  private onSearchInput = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = window.setTimeout(() => {
      this.controller?.search(input.value);
    }, this.searchDebounce);
    this.dispatchEvent(new YatlToolbarSearchInput(input.value));
  };

  private onSearchChange = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    clearTimeout(this.searchDebounceTimer);
    this.controller?.search(input.value);
    this.dispatchEvent(new YatlToolbarSearchChange(input.value));
  };

  private onExportClick = (_event: Event) => {
    this.dispatchEvent(new YatlToolbarExportClick());
  };

  private onToggleSearchSortPriority = () => {
    if (!this.controller) {
      return;
    }
    const next: SearchSortPriority =
      this.controller.searchSortPriority === 'sort' ? 'score' : 'sort';
    this.controller.searchSortPriority = next;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-toolbar': YatlToolbar;
  }
}
