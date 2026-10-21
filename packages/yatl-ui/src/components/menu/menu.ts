import { html } from 'lit';
import { customElement, queryAssignedElements } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import styles from './menu.styles';
import { YatlOption } from '../option/option';
import { activeElements } from '../../utils';

/***
 *  Menu component that holds a list of options with keyboard navigation
 */
@customElement('yatl-menu')
export class YatlMenu extends YatlBase {
  public static override styles = [...super.styles, styles];

  @queryAssignedElements({ flatten: true })
  private assignedElements!: Array<HTMLElement>;

  public focusFirst() {
    const items = this.getAllOptions(false);
    return this.setFocus(0, items);
  }

  public focusLast() {
    const items = this.getAllOptions(false);
    return this.setFocus(items.length - 1, items);
  }

  public focusItem(index: number) {
    const items = this.getAllOptions(false);
    return this.setFocus(index, items);
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this.handleKeydown);
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.handleKeydown);
  }

  protected override render() {
    return html`<slot></slot> `;
  }

  private handleKeydown = (event: KeyboardEvent) => {
    const navKeys = ['ArrowUp', 'ArrowDown', 'Home', 'End'];
    const selectKeys = [' ', 'Enter'];
    const allKeys = [...navKeys, ...selectKeys];

    if (!allKeys.includes(event.key)) {
      return;
    }

    // Handle keyboard navigation logic - disabled options aren't
    // interactive (see YatlOption.handleItemClicked), so they
    // shouldn't be reachable via arrow/Home/End navigation either.
    const items = this.getAllOptions(false);
    const activeItem = this.getActiveItem(items);
    let itemToFocus: number | undefined;
    const activeItemIndex = activeItem ? items.indexOf(activeItem) : -1;
    if (event.key === 'ArrowUp') {
      if (activeItemIndex > 0) {
        itemToFocus = activeItemIndex - 1;
      } else {
        itemToFocus = items.length - 1;
      }
    } else if (event.key === 'ArrowDown') {
      if (activeItemIndex !== -1 && activeItemIndex < items.length - 1) {
        itemToFocus = activeItemIndex + 1;
      } else {
        itemToFocus = 0;
      }
    } else if (event.key === 'Home' || event.key === 'End') {
      itemToFocus = event.key === 'Home' ? 0 : items.length - 1;
    } else if (selectKeys.includes(event.key) && activeItemIndex != -1) {
      // We only want to absorb these if we have the active item!
      event.preventDefault();
      event.stopPropagation();
      activeItem?.click();
    }

    if (itemToFocus !== undefined) {
      event.preventDefault();
      event.stopPropagation();
      this.setFocus(itemToFocus, items);
      return;
    }
  };

  private setFocus(index: number, items: YatlOption[]) {
    if (index < 0 || index >= items.length) {
      return false;
    }

    const activeItem = this.getActiveItem(items);
    if (activeItem) {
      // Clear tab index on current item
      activeItem.tabIndex = -1;
    }

    const nextItem = items[index];
    nextItem.tabIndex = 0;
    nextItem.focus();
  }

  private getActiveItem(items: YatlOption[]) {
    const activeElement = [...activeElements()].find(
      i => i instanceof YatlOption,
    );
    return items.find(item => item === activeElement);
  }

  public getAllOptions(includeDisabled = true): YatlOption[] {
    return this.assignedElements
      .flatMap(e => {
        return e instanceof YatlOption
          ? [e]
          : [...e.querySelectorAll('yatl-option')];
      })
      .filter(o => includeDisabled || !o.disabled);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-menu': YatlMenu;
  }
}
