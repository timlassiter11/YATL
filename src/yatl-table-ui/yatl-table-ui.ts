import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  YatlColumnToggleRequestEvent,
  YatlToolbarSearchInput,
} from '../events';
import { NestedKeyOf, UnspecifiedRecord } from '../types';
import { YatlTable } from '../yatl-table/yatl-table';

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
    return html`
      <div class="ui-wrapper">
        <yatl-toolbar
          ?showColumnPicker=${this.showColumnPicker}
          ?showExportButton=${this.showExportButton}
          .controller=${this.controller}
          @yatl-toolbar-export-click=${this.handleTableExportClicked}
          ><slot name="toolbar-buttons"></slot
        ></yatl-toolbar>
        ${super.render()}
      </div>
    `;
  }

  private handleTableExportClicked = () => {
    this.export(document.title);
  };
}
