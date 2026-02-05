import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import {
  computePosition,
  autoUpdate,
  flip,
  shift,
  offset,
  size,
} from '@floating-ui/dom';

import styles from './yatl-dropdown.styles';
import theme from '../theme';
import { YatlDropdownItem } from '../yatl-dropdown-item';
import { activeElements } from '../utils';
import { YatlDropdownSelectEvent as YatlDropdownItemSelectEvent } from '../events';

@customElement('yatl-dropdown')
export class YatlDropdown extends LitElement {
  public static override styles = [theme, styles];

  private autoUpdateCleanup?: () => void;

  @query('[part="menu"]')
  private menuElement!: HTMLElement;
  @query('slot[name="trigger"]')
  private triggerSlot?: HTMLSlotElement;
  @query('slot:not([name])')
  private defaultSlot?: HTMLSlotElement;

  @property({ type: Boolean, reflect: true })
  public open = false;

  // #region Render

  protected override render() {
    return html`
      <div part="base">
        <div part="trigger">
          <slot
            name="trigger"
            @click=${this.handleTriggerClick}
            @keydown=${this.handleTriggerKeydown}
          ></slot>
        </div>
        <div part="menu" @yatl-dropdown-click=${this.handleItemClick}>
          <slot></slot>
        </div>
      </div>
    `;
  }

  // #endregion
  // #region Lifecycle

  protected override updated(changedProperties: PropertyValues<YatlDropdown>) {
    super.updated(changedProperties);

    if (changedProperties.has('open')) {
      if (this.open) {
        this.addListeners();
      } else {
        this.removeListeners();
      }
    }
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    this.removeListeners();
  }

  // #endregion
  // #region Event Handlers

  private handleTriggerClick() {
    console.log('trigger click');
    this.open = !this.open;
  }

  private handleItemClick(event: Event) {
    const item = event.target as YatlDropdownItem;
    const selectEvent = new YatlDropdownItemSelectEvent(item.value, item.checked);
    if (this.dispatchEvent(selectEvent)) {
      this.open = false;
    }
  }

  private handleTriggerKeydown(event: KeyboardEvent) {
    // Open when the user presses the spacebar on the trigger element
    if (!this.open && event.key === ' ') {
      this.open = true;
      event.preventDefault();
      event.stopPropagation();
    }
  }

  private handleKeydown = (event: KeyboardEvent) => {
    if (this.open) {
      if (event.key === 'Escape') {
        this.open = false;
        this.referenceElement?.focus();
      } else if (
        ['ArrowUp', 'ArrowDown', 'Home', 'End', ' '].includes(event.key)
      ) {
        // Handle keyboard navigation logic
        const items = this.getItems();
        const activeItem = this.getActiveItem(items);
        if (activeItem) {
          activeItem.tabIndex = -1;
        }

        let itemToFocus: YatlDropdownItem | undefined;
        const activeItemIndex = activeItem ? items.indexOf(activeItem) : -1;
        if (event.key === 'ArrowUp') {
          if (activeItemIndex > 0) {
            itemToFocus = items[activeItemIndex - 1];
          } else {
            itemToFocus = items[items.length - 1];
          }
        } else if (event.key === 'ArrowDown') {
          if (activeItemIndex !== -1 && activeItemIndex < items.length - 1) {
            itemToFocus = items[activeItemIndex + 1];
          } else {
            itemToFocus = items[0];
          }
        } else if (event.key === 'Home' || event.key === 'End') {
          itemToFocus =
            event.key === 'Home' ? items[0] : items[items.length - 1];
        } else if (event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          activeItem?.click();
        }

        if (itemToFocus) {
          event.preventDefault();
          event.stopPropagation();
          itemToFocus.tabIndex = 0;
          itemToFocus.focus();
          return;
        }
      }
    }
  };

  private handleDocumentFocusin = (event: Event) => {
    const path = event.composedPath();
    if (!path.includes(this)) {
      this.open = false;
    }
  };

  // #endregion
  // #region Utilities
  private addListeners() {
    this.startPositioning();
    document.addEventListener('click', this.handleDocumentFocusin);
    document.addEventListener('focusin', this.handleDocumentFocusin);
    document.addEventListener('keydown', this.handleKeydown);
  }

  private removeListeners() {
    this.autoUpdateCleanup?.();
    document.removeEventListener('click', this.handleDocumentFocusin);
    document.removeEventListener('focusin', this.handleDocumentFocusin);
    document.removeEventListener('keydown', this.handleKeydown);
  }

  private getItems(includeDisabled = false) {
    const items =
      this.defaultSlot
        ?.assignedElements({ flatten: true })
        .filter(i => i instanceof YatlDropdownItem) ?? [];

    return includeDisabled ? items : items.filter(i => !i.disabled);
  }

  private getActiveItem(items: YatlDropdownItem[]) {
    const activeElement = [...activeElements()].find(
      i => i instanceof YatlDropdownItem,
    );
    return items.find(item => item === activeElement);
  }

  private async startPositioning() {
    const menu = this.menuElement;
    const trigger = this.referenceElement;
    if (!trigger) {
      return;
    }

    this.autoUpdateCleanup = autoUpdate(trigger, menu, () => {
      computePosition(trigger, menu, {
        placement: 'bottom-start',
        middleware: [
          offset(4),
          size({
            apply({ rects, elements }) {
              Object.assign(elements.floating.style, {
                'min-width': `${rects.reference.width}px`,
              });
            },
          }),
          flip(),
          shift({ padding: 5 }),
        ],
      }).then(({ x, y }) => {
        Object.assign(menu.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      });
    });
  }

  private get referenceElement() {
    const nodes = this.triggerSlot?.assignedElements({ flatten: true });
    if (nodes?.length) {
      return nodes[0] as HTMLElement;
    }
  }

  // #endregion
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-dropdown': YatlDropdown;
  }
}
