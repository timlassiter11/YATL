import { html } from 'lit';
import {
  customElement,
  property,
  queryAssignedElements,
} from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { YatlTreeItemSelectEvent } from '../../events/tree-item';
import { HasSlotController } from '../../utils';
import { YatlBase } from '../base/base';

import styles from './tree-item.styles';

/**
 * @fires yatl-tree-item-select - When this item is selected
 */
@customElement('yatl-tree-item')
export class YatlTreeItem extends YatlBase {
  public static override styles = [...super.styles, styles];

  private slotController = new HasSlotController(this, 'children');

  @queryAssignedElements({ flatten: true, slot: 'children' })
  private assignedElements!: Array<HTMLElement>;

  @property({ type: String })
  public value = '';

  @property({ type: Boolean, reflect: true })
  public open = false;

  @property({ type: Boolean, reflect: true })
  public disabled = false;

  @property({ type: Boolean, reflect: true })
  public selected = false;

  public get childItems() {
    return this.assignedElements.flatMap(e => {
      return e instanceof YatlTreeItem
        ? [e]
        : [...e.querySelectorAll('yatl-tree-item')];
    });
  }

  public get hasChildItems() {
    return this.slotController.test('children');
  }

  public get isLeaf() {
    // This is just for readability
    return !this.hasChildItems;
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.slot ||= 'children';
  }

  protected override render() {
    const open = !this.hasChildItems ? false : this.open;

    return html`
      <details
        id=${this.value}
        class=${classMap({ 'has-children': this.hasChildItems })}
        ?open=${open}
        @toggle=${this.handleDetailsToggle}
        @click=${this.handleDetailsClick}
      >
        <summary>
          <yatl-button
            variant="plain"
            size="small"
            @click=${this.handleToggleButtonClick}
          >
            <yatl-icon part="arrow-icon" name="chevron-down"></yatl-icon>
          </yatl-button>
          <slot slot="summary"></slot>
        </summary>
        <div part="children">
          <slot name="children"></slot>
        </div>
      </details>
    `;
  }

  private handleDetailsToggle(event: Event) {
    event.stopPropagation();
    const details = event.target as HTMLDetailsElement;
    this.open = details.open;
  }

  private handleDetailsClick(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (this.disabled) {
      return;
    }

    this.dispatchEvent(new YatlTreeItemSelectEvent());
  }

  private handleToggleButtonClick(event: Event) {
    event.stopPropagation();
    if (this.disabled) {
      return;
    }

    this.open = !this.open;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-tree-item': YatlTreeItem;
  }
}
