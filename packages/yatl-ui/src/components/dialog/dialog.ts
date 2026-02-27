import { YatlTable } from '@timlassiter11/yatl';
import { html, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import {
  YatlDialogHideEvent,
  YatlDialogHideRequest,
  YatlDialogShowEvent,
  YatlDialogShowRequest,
} from '../../events';
import {
  animateWithClass,
  getAnimationPromise,
  getEffectiveChildren,
} from '../../utils';
import { YatlBase } from '../base/base';

import styles from './dialog.styles';

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

  @property({ type: String })
  public label = '';

  @property({ type: Boolean })
  public modal = false;

  @property({ type: Boolean, reflect: true })
  public fullscreen = false;

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
      if (this.open && !this.dialogElement!.open) {
        this.show();
      } else if (!this.open && this.dialogElement!.open) {
        this.hide();
      }
    }

    this.requestUpdate('open', oldValue);
  }

  public async show() {
    if (this.isTransitioning) {
      return this.transitionComplete;
    }

    const requestEvent = new YatlDialogShowRequest();
    this.dispatchEvent(requestEvent);
    if (requestEvent.defaultPrevented) {
      this.open = false;
      return;
    }

    if (!this.hasUpdated) {
      await this.updateComplete;
    }

    this.dialogElement!.showModal();
    this.open = true;
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
        if (element instanceof YatlTable && element.enableVirtualScroll) {
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

  protected override render() {
    return html`
      <dialog
        part="dialog"
        ?popover=${this.open}
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
    `;
  }

  private async requestClose(source: HTMLElement) {
    if (!this.hasUpdated) {
      return;
    }

    if (this.isTransitioning) {
      return this.transitionComplete;
    }

    const requestEvent = new YatlDialogHideRequest(source);
    this.dispatchEvent(requestEvent);
    if (requestEvent.defaultPrevented) {
      this.open = true;
      animateWithClass(this.dialogElement!, 'pulse');
      return;
    }

    this.open = false;
    this.dialogElement!.classList.add('hide');
    await this.transitionComplete;
    this.dialogElement!.close();

    const event = new YatlDialogHideEvent();
    this.dispatchEvent(event);
  }

  private handleCloseClick(event: Event) {
    const target = event.target as HTMLElement;
    this.requestClose(target);
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
    'yatl-dialog': YatlDialog;
  }
}
