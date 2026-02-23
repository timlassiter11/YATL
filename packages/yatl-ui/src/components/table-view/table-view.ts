import { html, nothing, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from 'lit/decorators.js';
import { ContextProvider } from '@lit/context';
import { getTableContext } from '../../context';
import styles from './table-view.styles';
import { UnspecifiedRecord, YatlTable } from '@timlassiter11/yatl';
import { YatlTableFetchContext, YatlTableFetchTask } from '../../types';
import { YatlTableViewFiltersClearEvent } from '../../events/table-view';
import { SpinnerState } from '../spinner/spinner';

@customElement('yatl-table-view')
export class YatlTableView<
  T extends object = UnspecifiedRecord,
> extends YatlTable<T> {
  public static override styles = [...super.styles, styles];

  private tableContext = new ContextProvider(this, {
    context: getTableContext<T>(),
    initialValue: this.controller,
  });

  /** When the user requests a silent reload, show the loading icon in the button. */
  @state() private buttonState: SpinnerState = 'idle';

  /** Text to be display above the filters slot. */
  @property({ type: String })
  public filtersLabel = 'Filters';

  /**
   * Toggles the visibility of the left filters pane and header. Defaults to `false`.
   */
  @property({ type: Boolean, reflect: true, attribute: 'hide-filters' })
  public hideFilters = false;

  /**
   * Toggles the visibility of the column picker button in the toolbar. Defaults to `true`.
   */
  @property({ type: Boolean, attribute: 'hide-column-picker' })
  public hideColumnPicker = false;

  /**
   * Toggles the visibility of the CSV export button in the toolbar. Defaults to `true`.
   */
  @property({ type: Boolean, attribute: 'hide-export-button' })
  public hideExportButton = false;

  /**
   * Toggles the visibility of the reload button in the toolbar. Defaults to `true`.
   */
  @property({ type: Boolean, attribute: 'hide-reload-button' })
  public hideReloadButton = false;

  /**
   * When set, displays the loading indicator inside the table.
   */
  @property({ type: Boolean, reflect: true })
  public loading = false;

  /**
   * When set and fetch task was provided, automatically start
   * a fetch request before first render.
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
   * @param silent - If true, the loading overlay is not shown and instead the reload button shows a spinner.
   * @returns A promise that resolves when the data is finished being fetched and loaded into the table.
   */
  public async reloadData(silent = false) {
    return this.requestReload({ reason: 'reload', options: { silent } });
  }

  protected override willUpdate(
    changedProperties: PropertyValues<YatlTableView>,
  ): void {
    // Run fetch task before first update if it was provided and data wasn't.
    if (!this.hasUpdated) {
      if (this.fetchTask && this.autoLoad) {
        this.requestReload({ reason: 'init', options: { silent: false } });
      }
    }

    if (changedProperties.has('controller')) {
      this.tableContext.setValue(this.controller);
    }
  }

  protected override render() {
    // No point in showing the reload button if there is no fetch task
    const showReload = this.fetchTask && !this.hideReloadButton;

    return html`
      <div part="view">
        <div part="filters-header">
          <slot name="filters-label">
            <span part="filters-label"> ${this.filtersLabel} </span>
          </slot>
          <yatl-button
            variant="plain"
            title="Clear Filters"
            @click=${this.handleClearFiltersClick}
          >
            <yatl-icon name="close"></yatl-icon>
          </yatl-button>
        </div>
        <div part="sidebar">
          <slot name="sidebar-start"></slot>
          <div part="filters">
            <slot name="filters"></slot>
          </div>
          <slot name="sidebar-end"></slot>
        </div>
        <yatl-toolbar
          part="toolbar"
          ?hide-column-picker=${this.hideColumnPicker}
          ?hide-export-button=${this.hideExportButton}
          .controller=${this.controller}
          @yatl-toolbar-export-click=${this.handleTableExportClick}
        >
          ${showReload ? this.renderReloadButton() : nothing}
          <slot name="toolbar-button-group" slot="button-group"></slot
          ><slot name="toolbar"></slot
        ></yatl-toolbar>
        ${super.render()}
      </div>
    `;
  }

  protected renderReloadButton() {
    return html`
      <yatl-button
        color="raised"
        slot="button-group"
        title="Reload data"
        ?disabled=${this.loading}
        state=${this.buttonState}
        @click=${() => this.reloadData(true)}
      >
        <yatl-icon name="reload"></yatl-icon>
      </yatl-button>
    `;
  }

  protected override renderBodyContents() {
    return html`
      ${super.renderBodyContents()}
      <yatl-loading-overlay
        ?show=${this.loading}
        state=${this.loading ? 'loading' : 'idle'}
      ></yatl-loading-overlay>
    `;
  }

  private handleClearFiltersClick() {
    this.filters = null;
    this.dispatchEvent(new YatlTableViewFiltersClearEvent());
  }

  private handleTableExportClick() {
    this.controller.export();
  }

  private async requestReload(context: YatlTableFetchContext) {
    if (!this.fetchTask) {
      return;
    }

    const fetchTask = this.fetchTask(context);

    this.buttonState = 'loading';
    if (!context.options.silent) {
      this.loading = true;
    }

    try {
      const data = await fetchTask;
      if (data) {
        this.controller.data = data;
      }
    } finally {
      this.loading = false;
      this.buttonState = 'success';
      setTimeout(() => (this.buttonState = 'idle'), 3000);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-table-view': YatlTableView;
  }
}
