import { html } from 'lit';
import {
  customElement,
  property,
  queryAssignedElements,
} from 'lit/decorators.js';
import { YatlBase } from '../base/base';

import {
  YatlSelectionChangeEvent,
  YatlSelectionChangeRequest,
} from '../../events/tree';
import { YatlTreeItemSelectEvent } from '../../events/tree-item';
import { YatlSelectionMethod } from '../../types';
import { YatlTreeItem } from '../tree-item/tree-item';
import styles from './tree.styles';

/**
 * @fires yatl-selection-change-request - Before the selected items change
 * @fires yatl-selection-change - When the selected items change
 */
@customElement('yatl-tree')
export class YatlTree extends YatlBase {
  public static override styles = [...super.styles, styles];

  @queryAssignedElements({ flatten: true, slot: 'children' })
  private assignedElements!: Array<HTMLElement>;

  private _selectedItems = new Set<YatlTreeItem>();

  /**
   * The method for item selection
   * @attr selection-method
   */
  @property({ type: String, attribute: 'selection-method' })
  public selectionMethod: YatlSelectionMethod = 'single';

  public get selectedItems() {
    return [...this._selectedItems];
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('yatl-tree-item-select', this.handleItemSelect);
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('yatl-tree-item-select', this.handleItemSelect);
  }

  protected override render() {
    return html`<slot name="children"></slot>`;
  }

  private handleItemSelect(event: YatlTreeItemSelectEvent) {
    const item = event.target as YatlTreeItem;
    if (this.selectionMethod === 'single' && item.selected) {
      return;
    } else if (this.selectionMethod === 'leaf' && item.hasChildItems) {
      return;
    }

    const newState = !item.selected;
    const request = new YatlSelectionChangeRequest(item, newState);
    this.dispatchEvent(request);
    if (request.defaultPrevented) {
      return;
    }

    if (this.selectionMethod === 'single') {
      this._selectedItems.clear();
      this._selectedItems.add(item);
    } else if (this.selectionMethod === 'multi') {
      if (item.selected) {
        this._selectedItems.add(item);
      } else {
        this._selectedItems.delete(item);
      }
    } else {
      // TODO: Handle leaf logic
    }

    this.updateSelectedOptions();
    this.dispatchEvent(new YatlSelectionChangeEvent());
  }

  private updateSelectedOptions() {
    for (const item of this.getAllItems()) {
      item.selected = this._selectedItems.has(item);
    }
  }

  private getAllItems(includeDisabled = true): YatlTreeItem[] {
    return this.assignedElements
      .flatMap(e => {
        return e instanceof YatlTreeItem
          ? [e, ...this.getChildItems(e)]
          : [...e.querySelectorAll('yatl-tree-item')];
      })
      .filter(o => includeDisabled || !o.disabled);
  }

  private getChildItems(item: YatlTreeItem): YatlTreeItem[] {
    const children = [];
    for (const child of item.childItems) {
      children.push(child, ...this.getChildItems(child));
    }
    return children;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-tree': YatlTree;
  }
}
