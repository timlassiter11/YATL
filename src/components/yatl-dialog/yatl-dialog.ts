import { html, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { YatlBase } from '../yatl-base';
import styles from './yatl-dialog.styles';
import {
  YatlDialogCloseEvent,
  YatlDialogCloseRequest,
  YatlDialogShowEvent,
  YatlDialogShowRequest,
} from '../../events';

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
    if (value) {
      this.dialogElement?.showModal();
    } else {
      this.dialogElement?.close();
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

    this.open = true;
    await this.updateComplete;

    const event = new YatlDialogShowEvent();
    this.dispatchEvent(event);
  }

  public async hide() {
    await this.requestClose();
    await new Promise<void>(resolve => {
      const dialog = this.dialogElement!;
      const fallbackTimeout = setTimeout(() => {
        dialog.removeEventListener('transitionend', handler);
        resolve();
      }, 350);

      const handler = (e: TransitionEvent) => {
        // Ignore transitions bubbling up from child elements inside the dialog
        if (e.target !== dialog) return;
        if (e.propertyName === 'opacity' || e.propertyName === 'display') {
          clearTimeout(fallbackTimeout); // Cancel the safety net
          dialog.removeEventListener('transitionend', handler);
          resolve();
        }
      };

      dialog.addEventListener('transitionend', handler);
    });
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
            @click=${this.requestClose}
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

  private async requestClose() {
    const requestEvent = new YatlDialogCloseRequest();
    this.dispatchEvent(requestEvent);
    if (requestEvent.defaultPrevented) {
      this.open = true;
      return;
    }

    this.open = false;

    await this.updateComplete;

    const event = new YatlDialogCloseEvent();
    this.dispatchEvent(event);
  }

  private handleDialogPointerdown(event: PointerEvent) {
    // Detect when the backdrop is clicked
    if (event.target === this.dialogElement) {
      if (!this.modal) {
        this.requestClose();
      }
    }
  }

  private handleDialogCancel(event: Event) {
    event.preventDefault();
    this.requestClose();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-dialog': YatlDialog;
  }
}
