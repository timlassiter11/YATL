import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  size,
} from '@floating-ui/dom';
import { html, PropertyValues } from 'lit';
import {
  customElement,
  property,
  query,
  queryAssignedElements,
} from 'lit/decorators.js';

import {
  YatlDropdownCloseEvent,
  YatlDropdownCloseRequest,
  YatlDropdownSelectEvent as YatlDropdownItemSelectEvent,
  YatlDropdownOpenEvent,
  YatlDropdownOpenRequest,
} from '../../events';
import { activeElements } from '../../utils';
import { YatlBase } from '../base/base';
import { YatlOption } from '../option/option';
import styles from './dropdown.styles';

/**
 * @fires yatl-dropdown-select
 * @fires yatl-dropdown-open
 * @fires yatl-dropdown-close
 */
@customElement('yatl-dropdown')
export class YatlDropdown extends YatlBase {
  public static override styles = [...super.styles, styles];

  private autoUpdateCleanup?: () => void;

  @query('[part="menu"]')
  private menuElement!: HTMLElement;
  @query('slot[name="trigger"]')
  private triggerSlot?: HTMLSlotElement;
  @queryAssignedElements({ flatten: true })
  private assignedElements!: Array<HTMLElement>;

  @property({ type: Boolean, reflect: true })
  public open = false;

  @property({ type: Boolean, attribute: 'match-width' })
  public matchWidth = false;

  public getAllOptions(includeDisabled = true): YatlOption[] {
    return this.assignedElements
      .flatMap(e => {
        return e instanceof YatlOption
          ? [e]
          : [...e.querySelectorAll('yatl-option')];
      })
      .filter(o => includeDisabled || !o.disabled);
  }

  // #region Render

  protected override render() {
    return html`
      <div part="base">
        <slot
          name="trigger"
          @click=${this.handleTriggerClick}
          @keydown=${this.handleTriggerKeydown}
        ></slot>
        <div part="menu" @click=${this.handleItemClick}>
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
        this.dispatchEvent(new YatlDropdownOpenEvent());
      } else {
        this.removeListeners();
        this.dispatchEvent(new YatlDropdownCloseEvent());
      }
    }
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeListeners();
  }

  // #endregion
  // #region Event Handlers

  private handleTriggerClick(event: PointerEvent) {
    if (event.pointerId === -1 && this.open) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const requestEvent = this.open
      ? new YatlDropdownCloseRequest()
      : new YatlDropdownOpenRequest();
    if (!this.dispatchEvent(requestEvent)) {
      return;
    }

    this.open = !this.open;
  }

  private handleItemClick(event: Event) {
    const target = event.target as HTMLElement;
    const item = target.closest('yatl-option');
    if (!item) {
      return;
    }

    const selectEvent = new YatlDropdownItemSelectEvent(item);
    this.dispatchEvent(selectEvent);
    if (!selectEvent.defaultPrevented) {
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
        // If we are in a dialog and press escape to close
        // the dropdown we don't want it to close the dialog too.
        event.stopPropagation();
        event.preventDefault();
        this.referenceElement?.focus();
      } else if (
        ['ArrowUp', 'ArrowDown', 'Home', 'End', ' '].includes(event.key)
      ) {
        // Handle keyboard navigation logic
        const items = this.getAllOptions();
        const activeItem = this.getActiveItem(items);
        if (activeItem) {
          activeItem.tabIndex = -1;
        }

        let itemToFocus: YatlOption | undefined;
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
          // Ignore home and end when focus is on the tirgger element.
          // Fixes issues with using inputs as triggers.
          const composedPath = event.composedPath();
          const trigger = this.referenceElement;
          if (trigger && composedPath.includes(trigger)) {
            return;
          }
          itemToFocus =
            event.key === 'Home' ? items[0] : items[items.length - 1];
        } else if (event.key === ' ' && activeItemIndex != -1) {
          // We only want to absorb the space key if we have the active item!
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
    document.addEventListener('pointerdown', this.handleDocumentFocusin);
    document.addEventListener('focusin', this.handleDocumentFocusin);
    document.addEventListener('keydown', this.handleKeydown);
  }

  private removeListeners() {
    this.autoUpdateCleanup?.();
    document.removeEventListener('pointerdown', this.handleDocumentFocusin);
    document.removeEventListener('focusin', this.handleDocumentFocusin);
    document.removeEventListener('keydown', this.handleKeydown);
  }

  private getActiveItem(items: YatlOption[]) {
    const activeElement = [...activeElements()].find(
      i => i instanceof YatlOption,
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
        strategy: 'fixed',
        middleware: [
          offset(4),
          size({
            apply: ({ rects, availableHeight, elements }) => {
              const maxHeight = 400;
              const screenBuffer = 10;
              const actualMaxHeight = Math.min(
                maxHeight,
                availableHeight - screenBuffer,
              );
              const styles: Record<string, string> = {
                'max-height': `${actualMaxHeight}px`,
              };
              if (this.matchWidth) {
                styles['width'] = `${rects.reference.width}px`;
              } else {
                styles['min-width'] = `${rects.reference.width}px`;
              }
              Object.assign(elements.floating.style, styles);
            },
            padding: 10,
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
    return this.triggerSlot?.assignedElements({ flatten: true }).at(0) as
      | HTMLElement
      | undefined;
  }

  // #endregion
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-dropdown': YatlDropdown;
  }
}
