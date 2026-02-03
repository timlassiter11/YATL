import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { UnspecifiedRecord } from '../types';
import { YatlTable } from '../yatl-table/yatl-table';

import styles from './yatl-table-ui.styles';

/**
 * A "Batteries Included" wrapper for `<yatl-table>` that provides a built-in toolbar.
 *
 * This element extends the core table engine to automatically render UI controls
 * for common user actions, such as toggling column visibility and exporting data.
 *
 * It inherits all properties and events from `<yatl-table>`.
 *
 * @element yatl-table-ui
 *
 * @slot toolbar - Adds contents to the right of the toolbar button group
 * @slot toolbar-button-group - Adds content into the toolbar button group.
 * @slot footer - Inherited from `yatl-table`. Content to display in the table footer area.
 * @slot body - Inherited from `yatl-table`. Custom rendering for the table body.
 */
@customElement('yatl-table-ui')
export class YatlTableUi<
  T extends object = UnspecifiedRecord,
> extends YatlTable<T> {
  public static override styles = [...YatlTable.styles, styles];

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

  protected override render() {
    return html`
      <div class="ui-wrapper">
        <yatl-toolbar
          exportparts="search, "
          ?showColumnPicker=${this.showColumnPicker}
          ?showExportButton=${this.showExportButton}
          .controller=${this.controller}
          @yatl-toolbar-export-click=${this.handleTableExportClicked}
          ><slot name="toolbar-button-group" slot="button-group"></slot
          ><slot name="toolbar"></slot
        ></yatl-toolbar>
        ${super.render()}
      </div>
    `;
  }

  private handleTableExportClicked = () => {
    this.export(document.title);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-table-ui': YatlTableUi;
  }
}
