import {
  autoUpdate,
  computePosition,
  flip,
  hide,
  offset,
  shift,
  size,
} from '@floating-ui/dom';
import { html, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import {
  YatlDropdownSelectEvent,
  YatlDropdownToggleEvent,
  YatlDropdownToggleRequest,
} from '../../events';
import { YatlBase } from '../base/base';
import styles from './dropdown.styles';
import { YatlMenu } from '../menu/menu';

/**
 * @fires yatl-dropdown-select
 * @fires yatl-dropdown-toggle-request
 * @fires yatl-dropdown-toggle
 */
@customElement('yatl-dropdown')
export class YatlDropdown extends YatlBase {
  public static override styles = [...super.styles, styles];

  private autoUpdateCleanup?: () => void;

  @query('yatl-menu')
  private menuElement!: YatlMenu;
  @query('slot[name="trigger"]')
  private triggerSlot?: HTMLSlotElement;

  /**
   * Shows or hides the dropdown menu.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  public open = false;

  /**
   * When true, the wdith of the dropdown will always match the width of the trigger.
   * @attr match-width
   */
  @property({ type: Boolean, attribute: 'match-width' })
  public matchWidth = false;

  // #region Render

  protected override render() {
    return html`
      <div part="base">
        <slot
          name="trigger"
          @click=${this.handleTriggerClick}
          @keydown=${this.handleTriggerKeydown}
        ></slot>
        <yatl-menu
          part="menu"
          popover="manual"
          @click=${this.handleItemClick}
          @keydown=${this.handleMenuKeydown}
        >
          <slot></slot>
        </yatl-menu>
      </div>
    `;
  }

  // #endregion
  // #region Lifecycle

  protected override updated(changedProperties: PropertyValues<YatlDropdown>) {
    super.updated(changedProperties);

    if (changedProperties.has('open')) {
      if (this.open) {
        this.showMenu();
        this.addListeners();
      } else {
        this.hideMenu();
        this.removeListeners();
      }
      this.dispatchEvent(new YatlDropdownToggleEvent(this.open));
    }
  }

  public override connectedCallback() {
    super.connectedCallback();
    // If we're reconnected while still open (e.g. a parent moved us to a
    // new location in the DOM), our document-level listeners were torn
    // down by disconnectedCallback and never restored - restore them.
    // Removing a popover from the document also hides it, so the menu has
    // to be put back in the top layer too.
    if (this.open) {
      this.showMenu();
      this.addListeners();
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

    this.requestState(!this.open);
  }

  private handleItemClick(event: Event) {
    const target = event.target as HTMLElement;
    const item = target.closest('yatl-option');
    if (!item) {
      return;
    }

    const selectEvent = new YatlDropdownSelectEvent(item);
    this.dispatchEvent(selectEvent);
    if (!selectEvent.defaultPrevented) {
      this.requestState(false);
    }
  }

  private handleTriggerKeydown(event: KeyboardEvent) {
    const navKeys = ['Escape', 'ArrowDown', 'ArrowUp'];
    // Open when the user presses the spacebar on the trigger element
    if (!this.open && event.key === ' ') {
      this.requestState(true);
      if (this.open) {
        // If our open request was accepted, absorb this event
        event.preventDefault();
        event.stopPropagation();
      }
    } else if (this.open && navKeys.includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();

      if (event.key === 'Escape') {
        this.requestState(false);
      } else if (event.key === 'ArrowDown') {
        this.menuElement.focusFirst();
      } else if (event.key === 'ArrowUp') {
        this.menuElement.focusLast();
      }
    }
  }

  private handleMenuKeydown(event: KeyboardEvent) {
    if (this.open && event.key === 'Escape') {
      this.requestState(false);
    }
  }

  private handleDocumentFocusin = (event: Event) => {
    const path = event.composedPath();
    if (!path.includes(this)) {
      this.requestState(false);
    }
  };

  // #endregion
  // #region Utilities

  // The menu element doesn't exist until the first render, so this has to
  // tolerate being called before then (e.g. from connectedCallback).
  private showMenu() {
    const menu = this.menuElement as HTMLElement | null;
    if (menu && !menu.matches(':popover-open')) {
      menu.showPopover();
    }
  }

  // Merely hiding the menu with CSS isn't enough: a popover left showing
  // keeps its (old) place in the top layer, so the next time it opens it
  // can end up underneath anything that was shown in the meantime -
  // e.g. the yatl-dialog the dropdown lives in.
  private hideMenu() {
    const menu = this.menuElement as HTMLElement | null;
    if (menu?.matches(':popover-open')) {
      menu.hidePopover();
    }
  }

  private addListeners() {
    if (this.autoUpdateCleanup) {
      // Already listening - both connectedCallback and the first
      // updated() can call this for an element that starts out open, and
      // re-running startPositioning() would leak the first autoUpdate
      // binding by overwriting its cleanup before it's ever called.
      return;
    }

    this.startPositioning();
    document.addEventListener('pointerdown', this.handleDocumentFocusin);
    document.addEventListener('focusin', this.handleDocumentFocusin);
  }

  private removeListeners() {
    this.autoUpdateCleanup?.();
    this.autoUpdateCleanup = undefined;
    document.removeEventListener('pointerdown', this.handleDocumentFocusin);
    document.removeEventListener('focusin', this.handleDocumentFocusin);
  }

  private requestState(state: boolean) {
    if (state === this.open) {
      return;
    }

    const requestEvent = new YatlDropdownToggleRequest(state);
    this.dispatchEvent(requestEvent);
    if (requestEvent.defaultPrevented) {
      return;
    }

    this.open = state;
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
          flip({
            fallbackStrategy: 'initialPlacement',
            rootBoundary: 'viewport',
          }),
          shift({ padding: 5 }),
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
          hide(),
        ],
      }).then(({ x, y, middlewareData }) => {
        if (middlewareData.hide?.referenceHidden) {
          // The trigger scrolled out of view. Close the menu
          this.requestState(false);
          return;
        }
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
