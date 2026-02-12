import { html, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { YatlBase } from '../yatl-base';
import styles from './yatl-dialog.styles';
import {
  YatlDialogHideEvent,
  YatlDialogHideRequest,
  YatlDialogShowEvent,
  YatlDialogShowRequest,
} from '../../events';
import { animateWithClass } from '../../utils';

@customElement('yatl-dialog')
export class YatlDialog extends YatlBase {
  public static override styles = [...super.styles, styles];

  private _open = false;

  @query('dialog')
  private dialogElement?: HTMLDialogElement;

  @property({ type: String })
  public label = '';

  @property({ type: Boolean })
  public modal = false;

  @property({ type: Boolean })
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
    await animateWithClass(this.dialogElement!, 'show');

    const event = new YatlDialogShowEvent();
    this.dispatchEvent(event);
  }

  public async hide() {
    await this.requestClose(this.dialogElement!);
  }

  protected override firstUpdated(_changedProperties: PropertyValues): void {
    if (this.open) {
      this.dialogElement?.showModal();
    }
  }

  protected override render() {
    return html`
      <dialog
        popover
        @cancel=${this.handleDialogCancel}
        @pointerdown=${this.handleDialogPointerdown}
      >
        <yatl-card part="base">
          <slot part="header" name="header" slot="header-start">
            <h2 part="label">${this.label || ' '}</h2>
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
    if (!this.hasUpdated || !this.open) {
      return;
    }

    const requestEvent = new YatlDialogHideRequest(source);
    this.dispatchEvent(requestEvent);
    if (requestEvent.defaultPrevented) {
      this.open = true;
      animateWithClass(this.dialogElement!, 'pulse');
      return;
    }

    await animateWithClass(this.dialogElement!, 'hide');
    this.open = false;
    this.dialogElement!.close();

    const event = new YatlDialogHideEvent();
    this.dispatchEvent(event);
  }

  private handleCloseClick(event: Event) {
    const target = event.target as HTMLElement;
    this.requestClose(target)
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
    if (
      !this.dialogElement!.classList.contains('hide') &&
      event.target === this.dialogElement
    ) {
      this.requestClose(this.dialogElement);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-dialog': YatlDialog;
  }
}
