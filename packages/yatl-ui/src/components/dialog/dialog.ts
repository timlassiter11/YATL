import { YatlTable } from '@timlassiter11/yatl';
import { html, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import {
  YatlDialogHideEvent,
  YatlDialogHideRequest,
  YatlDialogShowEvent,
  YatlDialogShowRequest,
  YatlDialogFullscreenEvent,
} from '../../events';
import {
  animateWithClass,
  getAnimationPromise,
  getEffectiveChildren,
} from '../../utils';
import { YatlBase } from '../base/base';

import styles from './dialog.styles';

/**
 * @fires yatl-dialog-show-request - Fired before the dialog is shown. Cancellable
 * @fires yatl-dialog-show - Fired after the dialog is shown.
 * @fires yatl-dialog-hide-request - Fired before the dialog is hidden. Cancellable
 * @fires yatl-dialog-hide - Fired after the dialog is hidden.
 * @fires yatl-dialog-fullscreen - Fired when the `fullscreen` property changes.
 */
@customElement('yatl-dialog')
export class YatlDialog extends YatlBase {
  public static override styles = [...super.styles, styles];

  private _open = false;
  private _transitionPromise?: Promise<void>;
  private get transitionComplete() {
    if (!this._transitionPromise && this.dialogElement) {
      this._transitionPromise = getAnimationPromise(
        this.dialogElement!,
        'show-dialog',
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
   * The dialog's title, displayed in the header.
   * @attr label
   */
  @property({ type: String })
  public label = '';

  /**
   * When true, clicking the backdrop or pressing escape will not close the dialog.
   * @attr modal
   */
  @property({ type: Boolean })
  public modal = false;

  /**
   * When true, the dialog fills the entire viewport.
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

  // Guards against show()/requestClose() re-entering themselves: they set
  // `this.open` as part of work they're already doing, and without this
  // the setter's own show()/hide() call below would kick off a second,
  // fully independent run of the same show/hide logic (each dispatching
  // its own request/complete events) for a single user action.
  private applyingOpenChange = false;

  /**
   * Shows or hides the dialog.
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

    if (this.hasUpdated && !this.applyingOpenChange) {
      if (this.open) {
        this.show();
      } else {
        this.hide();
      }
    }

    this.requestUpdate('open', oldValue);
  }

  private setOpenInternal(value: boolean) {
    this.applyingOpenChange = true;
    this.open = value;
    this.applyingOpenChange = false;
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

    const requestEvent = new YatlDialogShowRequest();
    this.dispatchEvent(requestEvent);
    if (requestEvent.defaultPrevented) {
      this.setOpenInternal(false);
      return;
    }

    if (!this.hasUpdated) {
      await this.updateComplete;
    }

    this.dialogElement!.showPopover();
    this.setOpenInternal(true);
    this.dialogElement!.classList.add('show');
    await this.transitionComplete;
    const event = new YatlDialogShowEvent();
    this.dispatchEvent(event);

    if (!this.defaultSlot) {
      return;
    }

    // This is fixes an issue where row heights are incorrect
    // when a virtual scroll table is in a dialog. The problem is
    // that the dialog animation scales (which means its contents scale)
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
    changedProperties: PropertyValues<YatlDialog>,
  ): void {
    // TODO: This should really only be fired from user interaction...
    // It might be best to remove this and let the user handle it in their button logic.
    if (changedProperties.has('fullscreen')) {
      const event = new YatlDialogFullscreenEvent(this.fullscreen);
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

    const requestEvent = new YatlDialogHideRequest(source);
    this.dispatchEvent(requestEvent);
    if (requestEvent.defaultPrevented) {
      this.setOpenInternal(true);
      animateWithClass(this.dialogElement!, 'pulse');
      return;
    }

    this.setOpenInternal(false);
    this.dialogElement!.classList.add('hide');
    await this.transitionComplete;
    this.dialogElement!.hidePopover();

    const event = new YatlDialogHideEvent();
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

  private handleGlobalEvents = (event: Event) => {
    event.stopPropagation();
    event.preventDefault();
    if (!event.composedPath().includes(this.dialogElement!)) {
      this.requestClose(this.dialogElement!);
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-dialog': YatlDialog;
  }
}
