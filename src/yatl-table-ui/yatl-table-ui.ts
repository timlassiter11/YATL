import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  isDisplayColumn,
  NestedKeyOf,
  UnspecifiedRecord,
  YatlTable,
} from '../yatl-table';
import { ColumnVisibilityToggleState } from '../yatl-toolbar';

@customElement('yatl-table-ui')
export class YatlTableUi<
  T extends object = UnspecifiedRecord,
> extends YatlTable<T> {
  public static override styles = [
    ...YatlTable.styles,
    css`
      :host {
        border-radius: 0;
      }

      .ui-wrapper {
        display: flex;
        flex-direction: column;
        gap: var(--yatl-spacing-m);
        height: 100%;
        width: 100%;
      }

      .wrapper {
        border-radius: var(--yatl-table-radius);
      }
    `,
  ];

  @property({type: Boolean})
  public showColumnPicker = true;

  @property({type: Boolean})
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
    // FIXME: If search query is saved, this doesn't restore the input value.
    return html`
      <div class="ui-wrapper">
        <yatl-toolbar
          ?showColumnPicker=${this.showColumnPicker}
          ?showExportButton=${this.showExportButton}
          .searchQuery=${this.searchQuery}
          .columnVisibilityStates=${columnToggleStates}
          @yatl-column-toggle=${this.handleColumnToggled}
          @yatl-export=${this.handleTableExportClicked}
          @yatl-search-input=${this.handleSearchInput}
          ><slot name="toolbar-buttons"></slot
        ></yatl-toolbar>
        ${super.render()}
      </div>
    `;
  }

  private handleColumnToggled = (
    event: CustomEvent<{ field: string; visible: boolean }>,
  ) => {
    this.setColumnVisibility(
      event.detail.field as NestedKeyOf<T>,
      event.detail.visible,
    );
  };

  private handleTableExportClicked = () => {
    this.export(document.title);
  };

  private handleSearchInput = (event: CustomEvent<{ value: string }>) => {
    this.searchQuery = event.detail.value;
  };
}
