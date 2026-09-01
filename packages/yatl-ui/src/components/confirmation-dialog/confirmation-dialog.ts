import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import styles from './confirmation-dialog.styles';
import {
  YatlConfirmationDialogAcceptEvent,
  YatlConfirmationDialogRejectEvent,
} from '../../events/confirmation-dialog';
import { type YatlDialog } from '../dialog/dialog';

/**
 * @fires yatl-confirmation-dialog-accept - Fired when the dialog has been accepted.
 * @fires yatl-confirmation-dialog-reject - Fired when the dialog has been rejected.
 */
@customElement('yatl-confirmation-dialog')
export class YatlConfirmationDialog extends YatlBase {
  public static override styles = [...super.styles, styles];

  @query('yatl-dialog')
  private dialogElement?: YatlDialog;

  /**
   * Shows or hides the dialog.
   * @attr open
   */
  @property({ type: Boolean })
  public open = false;

  /**
   * When true, clicking the backdrop or pressing escape will not close the dialog.
   * @attr modal
   */
  @property({ type: Boolean })
  public modal = false;

  /**
   * The dialog's title, displayed in the header.
   * @attr label
   */
  @property({ type: String })
  public label = '';

  /**
   * When true, the close button will be hidden.
   * @attr no-close-button
   */
  @property({ type: Boolean, attribute: 'no-close-button' })
  public noCloseButton = false;

  /**
   * The text displayed on the accept button. Set to an empty string to hide the button.
   * @attr accept-text
   */
  @property({ type: String, attribute: 'accept-text' })
  public acceptText = 'Yes';

  /**
   * The text displayed on the reject button. Set to an empty string to hide the button.
   * @attr reject-text
   */
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
    // Whichever of accept/reject doesn't fire would otherwise stay
    // attached forever (only the one that fires is cleaned up by
    // `once`) - the shared signal removes both once either settles.
    const controller = new AbortController();
    const ret = await new Promise<boolean>((resolve, _reject) => {
      this.addEventListener(
        'yatl-confirmation-dialog-accept',
        () => resolve(true),
        { once: true, signal: controller.signal },
      );
      this.addEventListener(
        'yatl-confirmation-dialog-reject',
        () => resolve(false),
        { once: true, signal: controller.signal },
      );
    });
    controller.abort();
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
    const hideAcceptButton = this.acceptText === '';
    const hideRejectButton = this.rejectText === '';

    return html`
      <yatl-dialog
        exportparts="dialog, body, footer-actions"
        label=${this.label}
        ?open=${this.open}
        ?modal=${this.modal}
        ?no-close-button=${this.noCloseButton}
        @yatl-dialog-show-request=${this.handleDialogShow}
        @yatl-dialog-hide-request=${this.handleDialogHide}
      >
        <slot></slot>
        <slot slot="footer-actions" name="footer-actions">
          <yatl-button @click=${this.reject} ?hidden=${hideRejectButton}>
            ${this.rejectText}
          </yatl-button>
          <yatl-button
            color="brand"
            @click=${this.accept}
            ?hidden=${hideAcceptButton}
          >
            ${this.acceptText}
          </yatl-button>
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
