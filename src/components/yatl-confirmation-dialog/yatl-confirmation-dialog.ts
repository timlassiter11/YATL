import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { YatlBase } from '../yatl-base';
import styles from './yatl-confirmation-dialog.styles';
import {
  YatlConfirmationDialogAcceptEvent,
  YatlConfirmationDialogRejectEvent,
} from '../../events/confirmation-dialog';
import { YatlDialog } from '../yatl-dialog';

@customElement('yatl-confirmation-dialog')
export class YatlConfirmationDialog extends YatlBase {
  public static override styles = [...super.styles, styles];

  @query('yatl-dialog')
  private dialogElement?: YatlDialog;

  @property({ type: Boolean })
  public open = false;

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
    return this.dialogElement!.show();
  }

  public async hide() {
    if (!this.hasUpdated) {
      await this.updateComplete;
    }
    return this.dialogElement!.hide();
  }

  public async confirm() {
    this.open = true;
    const ret = await new Promise<boolean>((resolve, _reject) => {
      this.addEventListener(
        'yatl-confirmation-dialog-accept',
        () => resolve(true),
        {
          once: true,
        },
      );
      this.addEventListener(
        'yatl-confirmation-dialog-reject',
        () => resolve(false),
        {
          once: true,
        },
      );
    });
    return ret;
  }

  public accept() {
    this.open = false;
    const event = new YatlConfirmationDialogAcceptEvent();
    this.dispatchEvent(event);
  }

  public reject() {
    this.open = false;
    const event = new YatlConfirmationDialogRejectEvent();
    this.dispatchEvent(event);
  }

  protected override render() {
    return html`
      <yatl-dialog
        label=${this.label}
        ?open=${this.open}
        @yatl-dialog-close=${this.handleDialogClose}
      >
        <slot></slot>
        <slot name="actions" slot="footer-actions">
          <yatl-button @click=${this.reject}> ${this.rejectText} </yatl-button>
          <yatl-button @click=${this.accept}> ${this.acceptText} </yatl-button>
        </slot>
      </yatl-dialog>
    `;
  }

  private handleDialogClose() {
    if (this.open) {
      this.reject();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-confirmation-dialog': YatlConfirmationDialog;
  }
}
