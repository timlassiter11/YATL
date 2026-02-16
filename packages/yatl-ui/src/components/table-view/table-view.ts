import { html, nothing, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from 'lit/decorators.js';
import { ContextProvider } from '@lit/context';
import { getTableContext } from '../../context';
import styles from './table-view.styles';
import { UnspecifiedRecord, YatlTable } from '@timlassiter11/yatl';

export type FetchReason = 'init' | 'reload';

@customElement('yatl-table-view')
export class YatlTableView<
  T extends object = UnspecifiedRecord,
> extends YatlTable<T> {
  public static override styles = [...super.styles, styles];

  private tableContext = new ContextProvider(this, {
    context: getTableContext<T>(),
    initialValue: this.controller,
  });

  private _fetchTask?: (
    reason: FetchReason,
  ) => Promise<T[] | undefined> | undefined;
  @state() private isButtonLoading = false;

  /**
   * Toggles the visibility of the column picker button in the toolbar. Defaults to `true`.
   */
  @property({ type: Boolean })
  public showColumnPicker = true;

  /**
   * Toggles the visibility of the CSV export button in the toolbar. Defaults to `true`.
   */
  @property({ type: Boolean })
  public showExportButton = true;

  /**
   * Toggles the visibility of the reload button in the toolbar. Defaults to `true`.
   */
  @property({ type: Boolean })
  public showReloadButton = true;

  /**
   * When set, displays the loading indicator inside the table.
   */
  @property({ type: Boolean, reflect: true })
  public loading = false;

  /**
   * A function used to load data into the table.
   * This will be called when the reload button is presssed or the reloadData method is called.
   * The table will show the loading indicator while this task is running.
   */
  public get fetchTask() {
    return this._fetchTask;
  }

  @property({ attribute: false })
  public set fetchTask(value) {
    this._fetchTask = value;
    this._reloadData('init');
  }

  public async reloadData(silent = false) {
    return this._reloadData('reload', silent);
  }

  private async _reloadData(reason: FetchReason, silent = false) {
    if (!this.fetchTask) {
      return;
    }

    if (!silent) {
      this.loading = true;
    }

    try {
      const data = await this.fetchTask(reason);
      if (data) {
        this.controller.data = data;
      }
    } finally {
      this.loading = false;
    }
  }

  protected override willUpdate(
    changedProperties: PropertyValues<YatlTableView>,
  ): void {
    if (changedProperties.has('controller')) {
      this.tableContext.setValue(this.controller);
      if (this.data.length === 0) {
        this._reloadData('init');
      }
    }
  }

  protected override render() {
    return html`
      <div part="view">
        <aside part="sidebar">
          <slot name="sidebar-start"></slot>
          <slot part="filters" name="filters"></slot>
          <slot name="sidebar-end"></slot>
        </aside>
        <main>
          <div part="shell">
            <yatl-toolbar
              ?showColumnPicker=${this.showColumnPicker}
              ?showExportButton=${this.showExportButton}
              .controller=${this.controller}
              @yatl-toolbar-export-click=${this.handleTableExportClick}
            >
              ${this.showReloadButton ? this.renderReloadButton() : nothing}
              <slot name="toolbar-button-group" slot="button-group"></slot
              ><slot name="toolbar"></slot
            ></yatl-toolbar>
            ${super.render()}
          </div>
        </main>
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
        ?loading=${this.isButtonLoading}
        @click=${this.handleReloadClick}
      >
        <yatl-icon name="reload"></yatl-icon>
      </yatl-button>
    `;
  }

  protected override renderBodyContents() {
    return html`
      ${super.renderBodyContents()}
      <yatl-loading-overlay ?show=${this.loading}></yatl-loading-overlay>
    `;
  }

  private handleReloadClick() {
    this.reloadData();
  }

  private handleTableExportClick() {
    this.controller.export();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-table-view': YatlTableView;
  }
}
