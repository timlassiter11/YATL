import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  isDisplayColumn,
  NestedKeyOf,
  UnspecifiedRecord,
  YatlColumnToggleRequestEvent,
  YatlTable,
  YatlToolbarSearchInput,
} from '../yatl-table';
import { ColumnVisibilityToggleState } from '../yatl-toolbar';

import styles from './yatl-table-ui.styles';

@customElement('yatl-table-ui')
export class YatlTableUi<
  T extends object = UnspecifiedRecord,
> extends YatlTable<T> {
  public static override styles = [...YatlTable.styles, styles];

  @property({ type: Boolean })
  public showColumnPicker = true;

  @property({ type: Boolean })
  public showExportButton = true;

  protected override render() {
    const columnToggleStates: ColumnVisibilityToggleState[] = [];
    for (const column of this.columns.filter(isDisplayColumn)) {
      const state = this.columnStates.find(s => s.field === column.field);
      columnToggleStates.push({
        field: column.field,
        title: column.title ?? column.field,
        visible: state?.visible ?? true,
      });
    }

    return html`
      <div class="ui-wrapper">
        <yatl-toolbar
          ?showColumnPicker=${this.showColumnPicker}
          ?showExportButton=${this.showExportButton}
          .searchQuery=${this.searchQuery}
          .columnVisibilityStates=${columnToggleStates}
          @yatl-column-toggle-request=${this.handleColumnToggled}
          @yatl-toolbar-export-click=${this.handleTableExportClicked}
          @yatl-toolbar-search-input=${this.handleSearchInput}
          ><slot name="toolbar-buttons"></slot
        ></yatl-toolbar>
        ${super.render()}
      </div>
    `;
  }

  private handleColumnToggled = (event: YatlColumnToggleRequestEvent) => {
    this.toggleColumnVisibility(
      event.field as NestedKeyOf<T>,
      event.visibility,
    );
  };

  private handleTableExportClicked = () => {
    this.export(document.title);
  };

  private handleSearchInput = (event: YatlToolbarSearchInput) => {
    this.searchQuery = event.value;
  };
}
