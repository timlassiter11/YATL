import { YatlTable } from '@timlassiter11/yatl';
import { html, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import {
  YatlFlyoutFullscreenEvent,
  YatlFlyoutHideEvent,
  YatlFlyoutHideRequest,
  YatlFlyoutShowEvent,
  YatlFlyoutShowRequest,
} from '../../events';
import {
  animateWithClass,
  getAnimationPromise,
  getEffectiveChildren,
} from '../../utils';
import { YatlBase } from '../base/base';

import styles from './flyout.styles';

export type YatlFlyoutPlacement = 'start' | 'end' | 'top' | 'bottom';

/**
 * @fires yatl-flyout-show-request - Fired before the flyout is shown. Cancellable
 * @fires yatl-flyout-show - Fired after the flyout is shown.
 * @fires yatl-flyout-hide-request - Fired before the flyout is hidden. Cancellable
 * @fires yatl-flyout-hide - Fired after the flyout is hidden.
 * @fires yatl-flyout-fullscreen - Fired when the `fullscreen` property changes.
 */
@customElement('yatl-flyout')
export class YatlFlyout extends YatlBase {
  public static override styles = [...super.styles, styles];

  private _open = false;
  private _transitionPromise?: Promise<void>;
  private get transitionComplete() {
    if (!this._transitionPromise && this.dialogElement) {
      this._transitionPromise = getAnimationPromise(
        this.dialogElement!,
        'show-flyout',
      );
      this._transitionPromise.finally(() => {
        this.dialogElement?.classList.remove('show', 'hide');
        this._transitionPromise = undefined;
      });
    }
    return this._transitionPromise;
  }

  public get isTransitioning() {
    return (
      this.dialogElement?.classList.contains('show') ||
      this.dialogElement?.classList.contains('hide')
    );
  }

  @query('slot:not([name])')
  private defaultSlot?: HTMLSlotElement;

  @query('dialog')
  private dialogElement?: HTMLDialogElement;

  /**
   * The flyout's title, displayed in the header.
   * @attr label
   */
  @property({ type: String })
  public label = '';

  /**
   * The edge of the viewport the flyout slides in from.
   * @attr placement
   */
  @property({ type: String, reflect: true })
  public placement: YatlFlyoutPlacement = 'end';

  /**
   * When true, clicking the backdrop or pressing escape will not close the flyout.
   * @attr modal
   */
  @property({ type: Boolean })
  public modal = false;

  /**
   * When true, the flyout fills the entire viewport.
   * @attr fullscreen
   */
  @property({ type: Boolean, reflect: true })
  public fullscreen = false;

  /**
   * When true, the close button will be hidden.
   * @attr no-close-button
   */
  @property({ type: Boolean, attribute: 'no-close-button' })
  public noCloseButton = false;

  /**
   * Shows or hides the flyout.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  public get open() {
    return this._open;
  }
  public set open(value) {
    if (this._open === value) {
      return;
    }

    const oldValue = this._open;
    this._open = value;

    if (this.hasUpdated) {
      if (this.open) {
        this.show();
      } else {
        this.hide();
      }
    }

    this.requestUpdate('open', oldValue);
  }

  public async show() {
    if (this.isTransitioning) {
      await this.transitionComplete;
      // Our target state may have flipped (e.g. hide() was requested)
      // while we were waiting on the previous transition.
      if (!this.open) {
        return;
      }
      if (this.dialogElement?.matches(':popover-open')) {
        // Already open - whatever we were waiting on got us there.
        return;
      }
    }

    const requestEvent = new YatlFlyoutShowRequest();
    this.dispatchEvent(requestEvent);
    if (requestEvent.defaultPrevented) {
      this.open = false;
      return;
    }

    if (!this.hasUpdated) {
      await this.updateComplete;
    }

    this.dialogElement!.showPopover();
    this.open = true;
    this.dialogElement!.classList.add('show');
    await this.transitionComplete;
    const event = new YatlFlyoutShowEvent();
    this.dispatchEvent(event);

    if (!this.defaultSlot) {
      return;
    }

    // This fixes an issue where row heights are incorrect
    // when a virtual scroll table is in a flyout. The problem is
    // that the flyout animation scales (which means its contents scale)
    // so the virtualizer incorrectly calculates row heights.
    // We just wait until the animation is done and force a reflow.
    for (const child of getEffectiveChildren(this.defaultSlot)) {
      for (const element of child.querySelectorAll('*')) {
        if (element instanceof YatlTable && element.virtualScroll) {
          if (element.data.length > 0) {
            element.reflowVirtualizer();
          }
        }
      }
    }
  }

  public async hide() {
    await this.requestClose(this.dialogElement!);
  }

  protected override firstUpdated(_changedProperties: PropertyValues): void {
    if (this.open) {
      this.show();
    }
  }

  protected override updated(
    changedProperties: PropertyValues<YatlFlyout>,
  ): void {
    // TODO: This should really only be fired from user interaction...
    // It might be best to remove this and let the user handle it in their button logic.
    if (changedProperties.has('fullscreen')) {
      const event = new YatlFlyoutFullscreenEvent(this.fullscreen);
      this.dispatchEvent(event);
    }
  }

  protected override render() {
    return html`
      <dialog
        part="dialog"
        popover="manual"
        @cancel=${this.handleDialogCancel}
        @pointerdown=${this.handleDialogPointerdown}
      >
        <yatl-card part="base">
          <slot part="header" name="header" slot="header-start">
            <h2 part="label">
              ${this.label || ' ' /* Empty character so it doesn't collapse */}
            </h2>
          </slot>
          <slot
            part="header-actions"
            name="header-actions"
            slot="header-end"
          ></slot>
          <yatl-button
            slot="header-end"
            variant="plain"
            part="close-button"
            ?hidden=${this.noCloseButton}
            @click=${this.handleCloseClick}
            ><yatl-icon name="close"></yatl-icon
          ></yatl-button>
          <div part="body">
            <slot></slot>
          </div>
          <slot part="footer" name="footer" slot="footer-start"></slot>
          <slot
            part="footer-actions"
            name="footer-actions"
            slot="footer-end"
          ></slot>
        </yatl-card>
      </dialog>
      <div class="backdrop" @click=${this.handleBackdropClick}></div>
    `;
  }

  private async requestClose(source: HTMLElement) {
    if (!this.hasUpdated) {
      return;
    }

    if (this.isTransitioning) {
      await this.transitionComplete;
      // Our target state may have flipped (e.g. show() was requested)
      // while we were waiting on the previous transition.
      if (this.open) {
        return;
      }
      if (!this.dialogElement?.matches(':popover-open')) {
        // Already closed - whatever we were waiting on got us there.
        return;
      }
    }

    const requestEvent = new YatlFlyoutHideRequest(source);
    this.dispatchEvent(requestEvent);
    if (requestEvent.defaultPrevented) {
      this.open = true;
      animateWithClass(this.dialogElement!, 'pulse');
      return;
    }

    this.open = false;
    this.dialogElement!.classList.add('hide');
    await this.transitionComplete;
    this.dialogElement!.hidePopover();

    const event = new YatlFlyoutHideEvent();
    this.dispatchEvent(event);
  }

  private handleCloseClick(event: Event) {
    const target = event.target as HTMLElement;
    this.requestClose(target);
  }

  private handleBackdropClick(event: Event) {
    if (this.modal) {
      animateWithClass(this.dialogElement!, 'pulse');
    } else {
      this.handleCloseClick(event);
    }
  }

  private handleDialogPointerdown(event: PointerEvent) {
    // Detect when the backdrop is clicked
    if (event.target === this.dialogElement) {
      if (!this.modal) {
        this.requestClose(this.dialogElement!);
      } else {
        animateWithClass(this.dialogElement!, 'pulse');
      }
    }
  }

  private handleDialogCancel(event: Event) {
    // Escape was pressed
    event.preventDefault();
    if (!this.isTransitioning && event.target === this.dialogElement) {
      this.requestClose(this.dialogElement);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-flyout': YatlFlyout;
  }
}
