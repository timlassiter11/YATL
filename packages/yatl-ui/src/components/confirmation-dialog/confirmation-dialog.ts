import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import styles from './confirmation-dialog.styles';
import {
  YatlConfirmationDialogAcceptEvent,
  YatlConfirmationDialogRejectEvent,
} from '../../events/confirmation-dialog';
import { type YatlDialog } from '../dialog/dialog';

@customElement('yatl-confirmation-dialog')
export class YatlConfirmationDialog extends YatlBase {
  public static override styles = [...super.styles, styles];

  @query('yatl-dialog')
  private dialogElement?: YatlDialog;

  @property({ type: Boolean })
  public open = false;

  @property({ type: Boolean })
  public modal = false;

  @property({ type: String })
  public label = '';

  @property({ type: String, attribute: 'accept-text' })
  public acceptText = 'Yes';

  @property({ type: String, attribute: 'reject-text' })
  public rejectText = 'No';

  public async show() {
    if (!this.hasUpdated) {
      await this.updateComplete;
    }
    this.open = true;
    await this.dialogElement!.show();
  }

  public async hide() {
    if (!this.hasUpdated) {
      return;
    }
    this.open = false;
    await this.dialogElement!.hide();
  }

  public async confirm() {
    await this.show();
    const ret = await new Promise<boolean>((resolve, _reject) => {
      this.addEventListener(
        'yatl-confirmation-dialog-accept',
        () => resolve(true),
        { once: true },
      );
      this.addEventListener(
        'yatl-confirmation-dialog-reject',
        () => resolve(false),
        { once: true },
      );
    });
    return ret;
  }

  public async accept() {
    const event = new YatlConfirmationDialogAcceptEvent();
    this.dispatchEvent(event);
    await this.hide();
  }

  public async reject() {
    const event = new YatlConfirmationDialogRejectEvent();
    this.dispatchEvent(event);
    await this.hide();
  }

  protected override render() {
    return html`
      <yatl-dialog
        exportparts="dialog, footer-actions"
        label=${this.label}
        ?open=${this.open}
        ?modal=${this.modal}
        @yatl-dialog-show-request=${this.handleDialogShow}
        @yatl-dialog-hide-request=${this.handleDialogHide}
      >
        <slot></slot>
        <slot slot="footer-actions" name="footer-actions">
          <yatl-button @click=${this.reject}> ${this.rejectText} </yatl-button>
          <yatl-button @click=${this.accept}> ${this.acceptText} </yatl-button>
        </slot>
      </yatl-dialog>
    `;
  }

  private handleDialogShow() {
    this.open = true;
  }

  private handleDialogHide() {
    if (this.open) {
      this.open = false;
      this.reject();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-confirmation-dialog': YatlConfirmationDialog;
  }
}
