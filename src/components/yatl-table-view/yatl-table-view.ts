import { html, PropertyValues } from 'lit';
import { customElement } from 'lit/decorators.js';
import { YatlTableUi } from '../yatl-table-ui';
import { ContextProvider } from '@lit/context';
import { tableContext } from '../../context';
import styles from './yatl-table-view.styles';

@customElement('yatl-table-view')
export class YatlTableView extends YatlTableUi {
  public static override styles = [...YatlTableUi.styles, styles];

  private tableContext = new ContextProvider(this, {
    context: tableContext,
    initialValue: this.controller,
  });

  protected override willUpdate(
    changedProperties: PropertyValues<YatlTableView>,
  ): void {
    if (changedProperties.has('controller')) {
      this.tableContext.setValue(this.controller);
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
        <main>${super.render()}</main>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-table-view': YatlTableView;
  }
}
