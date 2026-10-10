import { html, nothing, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from 'lit/decorators.js';
import { ContextProvider } from '@lit/context';
import { getTableContext } from '../../context';
import styles from './table-view.styles';
import { UnspecifiedRecord, YatlTable } from '@timlassiter11/yatl';
import {
  YatlTableFetchContext,
  YatlTableFetchReason,
  YatlTableFetchTask,
} from '../../types';
import { YatlTableViewFiltersClearEvent } from '../../events/table-view';
import { YatlSpinnerState } from '../spinner/spinner';
import { HasSlotController } from '../../utils';
import { YatlSplitPanelPositionEvent } from '../../events/split-panel';

const POSITION_POSTFIX = '-panel-position';

/**
 * @inheritdoc
 * @fires yatl-table-view-filters-clear - Fired when the filters clear button is clicked.
 */
@customElement('yatl-table-view')
export class YatlTableView<
  T extends object = UnspecifiedRecord,
> extends YatlTable<T> {
  public static override styles = [...super.styles, styles];

  private tableContext = new ContextProvider(this, {
    context: getTableContext<T>(),
    initialValue: this.controller,
  });

  private slotController = new HasSlotController(
    this,
    'sidebar-start',
    'filters',
    'sidebar-end',
  );

  // Split panel position. No need to make it a state.
  // We'll keep it in sync for re-renders but don't want
  // to trigger re-renders on it.
  private panelPosition?: number;

  /** When the user requests a silent reload, show the loading icon in the button. */
  @state() private buttonState: YatlSpinnerState = 'idle';

  /**
   * Text to be display above the filters slot.
   * @attr filterslabel
   */
  @property({ type: String })
  public filtersLabel = 'Filters';

  /**
   * The placeholder text for the search input.
   * @attr search-placeholder
   */
  @property({ type: String, attribute: 'search-placeholder' })
  public searchPlaceholder = 'Search';

  /**
   * Toggles the visibility of the left filters pane and header. Defaults to `false`.
   * @attr hide-filters
   */
  @property({ type: Boolean, reflect: true, attribute: 'hide-filters' })
  public hideFilters = false;

  /**
   * Toggles the visibility of the filters clear button. Defaults to `false`.
   * @attr hide-filters-clear-button
   */
  @property({
    type: Boolean,
    reflect: true,
    attribute: 'hide-filters-clear-button',
  })
  public hideFiltersClearButton = false;

  /**
   * Toggles the visibility of the column picker button in the toolbar. Defaults to `true`.
   * @attr hide-column-picker
   */
  @property({ type: Boolean, attribute: 'hide-column-picker' })
  public hideColumnPicker = false;

  /**
   * Toggles the visibility of the CSV export button in the toolbar. Defaults to `true`.
   * @attr hide-export-button
   */
  @property({ type: Boolean, attribute: 'hide-export-button' })
  public hideExportButton = false;

  /**
   * Toggles the visibility of the search/sort priority toggle button in the
   * toolbar. Defaults to `true`.
   * @attr hide-search-sort-priority-toggle
   */
  @property({ type: Boolean, attribute: 'hide-search-sort-priority-toggle' })
  public hideSearchSortPriorityToggle = false;

  /**
   * Toggles the visibility of the reload button in the toolbar. Defaults to `true`.
   * @attr hide-reload-button
   */
  @property({ type: Boolean, attribute: 'hide-reload-button' })
  public hideReloadButton = false;

  /**
   * When set, displays the loading indicator inside the table.
   * @attr loading
   */
  @property({ type: Boolean, reflect: true })
  public loading = false;

  /**
   * When set and fetch task was provided, automatically start
   * a fetch request before first render.
   * @attr auto-load
   */
  @property({ type: Boolean, attribute: 'auto-load', hasChanged: () => false })
  public autoLoad?: boolean;

  /**
   * A function used to load data into the table.
   * This will be called when the reload button is presssed or the reloadData method is called.
   * The table will show the loading indicator while this task is running.
   */
  @property({ attribute: false })
  public fetchTask?: YatlTableFetchTask<T>;

  /**
   * Reloads the table data by calling the provided fetch task.
   * @param reason - The reason for the reload. Used as context for the fetch task.
   * @param silent - If true, the loading overlay is not shown and instead the reload button shows a spinner.
   * @returns A promise that resolves when the data is finished being fetched and loaded into the table.
   */
  public async reloadData(
    reason: YatlTableFetchReason = 'reload',
    silent = false,
  ) {
    return this.requestReload({ reason, options: { silent } });
  }

  protected override willUpdate(changedProps: PropertyValues<this>) {
    super.willUpdate(changedProps);
    // Run fetch task before first update if it was provided and data wasn't.
    if (!this.hasUpdated) {
      if (this.fetchTask && this.autoLoad) {
        this.requestReload({ reason: 'init', options: { silent: false } });
      }
    }

    if (changedProps.has('controller')) {
      this.tableContext.setValue(this.controller);
    }

    if (this.panelPosition == null && this.storageOptions) {
      // User hasn't adjusted the panel yet and we have valid storage options.
      // Let's go ahead and try to pull the saved value.
      const storage = this.storageOptions.storage ?? window.localStorage;
      const position = storage.getItem(
        this.storageOptions.key + POSITION_POSTFIX,
      );
      try {
        this.panelPosition = Number(position);
      } catch {
        console.warn('Failed to load the panel position');
      }
    }
  }

  protected override render() {
    // No point in showing the reload button if there is no fetch task
    const showReload = this.fetchTask && !this.hideReloadButton;

    const hideSidebarStart = !this.slotController.test('sidebar-start');
    const hideFilters = !this.slotController.test('filters');
    const hideSidebarEnd = !this.slotController.test('sidebar-end');

    return html`
      <yatl-split-panel
        part="base"
        class="base"
        orientation="horizontal"
        position=${this.panelPosition ?? 10}
        start-min="350"
        @yatl-split-panel-position=${this.handleSplitPositionChange}
      >
        <div slot="start" part="filters-panel" class="filters-panel">
          <div part="sidebar" class="sidebar">
            <div part="sidebar-start" class="panel" ?hidden=${hideSidebarStart}>
              <slot name="sidebar-start"></slot>
            </div>
            <div part="filters" class="panel" ?hidden=${hideFilters}>
              <div part="filters-header" class="filters-header panel-header">
                <slot name="filters-label">
                  <span part="filters-label" class="filters-label">
                    ${this.filtersLabel}
                  </span>
                </slot>
                <yatl-button
                  part="filters-clear-button"
                  class="filters-clear-button"
                  variant="plain"
                  title="Clear Filters"
                  @click=${this.handleClearFiltersClick}
                >
                  <yatl-icon name="close"></yatl-icon>
                </yatl-button>
              </div>
              <slot name="filters"></slot>
            </div>
            <div part="sidebar-end" class="panel" ?hidden=${hideSidebarEnd}>
              <slot name="sidebar-end"></slot>
            </div>
          </div>
        </div>
        <div slot="end" part="table-panel" class="panel table-panel">
          <yatl-toolbar
            part="toolbar"
            class="toolbar panel-header"
            search-placeholder=${this.searchPlaceholder}
            ?hide-column-picker=${this.hideColumnPicker}
            ?hide-export-button=${this.hideExportButton}
            ?hide-search-sort-priority-toggle=${this
              .hideSearchSortPriorityToggle}
            @yatl-toolbar-export-click=${this.handleTableExportClick}
          >
            ${showReload ? this.renderReloadButton() : nothing}
            <slot name="toolbar-button-group" slot="button-group"></slot
            ><slot name="toolbar"></slot
          ></yatl-toolbar>
          ${super.render()}
        </div>
      </yatl-split-panel>
    `;
  }

  protected renderReloadButton() {
    return html`
      <yatl-button
        part="reload-button"
        color="raised"
        slot="button-group"
        title="Reload data"
        ?disabled=${this.loading}
        state=${this.buttonState}
        @click=${() => this.reloadData('reload', true)}
      >
        <yatl-icon name="reload"></yatl-icon>
      </yatl-button>
    `;
  }

  protected override renderBodyContents() {
    return html`
      ${super.renderBodyContents()}
      <yatl-loading-overlay
        part="loading-overlay"
        ?show=${this.loading}
        state=${this.loading ? 'loading' : 'idle'}
      ></yatl-loading-overlay>
    `;
  }

  private handleSplitPositionChange(event: YatlSplitPanelPositionEvent) {
    this.panelPosition = event.position;
    if (!event.dragging) {
      // Save when they are done dragging. Don't spam the storage.
      if (this.storageOptions) {
        const storage = this.storageOptions.storage ?? window.localStorage;
        storage.setItem(
          this.storageOptions.key + POSITION_POSTFIX,
          String(event.position),
        );
      }
    }
  }

  private handleClearFiltersClick() {
    this.filters = null;
    this.searchQuery = '';
    this.dispatchEvent(new YatlTableViewFiltersClearEvent());
  }

  private handleTableExportClick() {
    this.export(document.title);
  }

  // The reload button is only ever disabled during a non-silent reload
  // (see renderReloadButton), so overlapping reloads (e.g. rapid clicks on
  // a silent reload) are always possible. This token makes sure a
  // slower, older request can't clobber a result from a newer one.
  private reloadToken = 0;

  private async requestReload(context: YatlTableFetchContext) {
    if (!this.fetchTask) {
      return;
    }

    const token = ++this.reloadToken;
    const fetchTask = this.fetchTask(context);

    this.buttonState = 'loading';
    if (!context.options.silent) {
      this.loading = true;
    }

    try {
      const data = await fetchTask;
      if (data === undefined) {
        // Trigger error state if fetch task returns undefined
        throw new Error();
      }
      if (token !== this.reloadToken) {
        // A newer reload started while this one was in flight - ignore
        // this now-stale result.
        return;
      }
      this.controller.data = data;
      this.buttonState = 'success';
      setTimeout(() => (this.buttonState = 'idle'), 3000);
      return;
    } catch {
      // TODO: This currently swallows exceptions and I'm not sure it should...
      if (token !== this.reloadToken) {
        return;
      }
      this.buttonState = 'error';
      setTimeout(() => (this.buttonState = 'idle'), 3000);
    } finally {
      if (token === this.reloadToken) {
        this.loading = false;
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-table-view': YatlTableView;
  }
}
