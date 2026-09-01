import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { YatlBase } from '../base/base';
import styles from './confirmation-dialog.styles';
import {
  YatlConfirmationDialogAcceptEvent,
  YatlConfirmationDialogCancelEvent,
  YatlConfirmationDialogHideEvent,
  YatlConfirmationDialogRejectEvent,
  YatlConfirmationDialogShowEvent,
} from '../../events/confirmation-dialog';
import { type YatlDialog } from '../dialog/dialog';
import { YatlButtonColor, YatlButtonVariant } from '../button/button';

type ConfirmationOutcome = 'accept' | 'reject' | 'cancel';

/**
 * @fires yatl-confirmation-dialog-accept - Fired when the dialog has been accepted.
 * @fires yatl-confirmation-dialog-reject - Fired when the dialog has been explicitly rejected (the reject button).
 * @fires yatl-confirmation-dialog-cancel - Fired when the dialog was dismissed without an explicit choice (the cancel button, the close button, backdrop click, or Escape).
 * @fires yatl-confirmation-dialog-show - Fired after the dialog has finished showing.
 * @fires yatl-confirmation-dialog-hide - Fired after the dialog has finished hiding, regardless of how it was closed.
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
  @property({ type: Boolean, reflect: true })
  public open = false;

  /**
   * When true, clicking the backdrop or pressing escape will not close the
   * dialog. Defaults to true here (unlike the underlying `yatl-dialog`) -
   * a confirmation dialog is guarding a decision, so accidental dismissal
   * is disabled by default. The close button still works as the one
   * deliberate way to cancel without an explicit choice; set this to
   * false to also allow backdrop/Escape dismissal.
   * @attr modal
   */
  @property({ type: Boolean })
  public modal = true;

  /**
   * When true, the dialog fills the entire viewport.
   * @attr fullscreen
   */
  @property({ type: Boolean, reflect: true })
  public fullscreen = false;

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

  /**
   * The text displayed on the cancel button. Empty by default, which hides
   * the button - set this when "cancel" is a meaningfully different
   * outcome from "reject" (e.g. Save / Don't Save / Cancel).
   * @attr cancel-text
   */
  @property({ type: String, attribute: 'cancel-text' })
  public cancelText = '';

  /**
   * The color of the accept button.
   * @attr accept-color
   */
  @property({ type: String, attribute: 'accept-color' })
  public acceptColor: YatlButtonColor = 'brand';

  /**
   * The visual variant of the accept button.
   * @attr accept-variant
   */
  @property({ type: String, attribute: 'accept-variant' })
  public acceptVariant?: YatlButtonVariant;

  /**
   * The color of the reject button.
   * @attr reject-color
   */
  @property({ type: String, attribute: 'reject-color' })
  public rejectColor: YatlButtonColor = 'neutral';

  /**
   * The visual variant of the reject button.
   * @attr reject-variant
   */
  @property({ type: String, attribute: 'reject-variant' })
  public rejectVariant?: YatlButtonVariant;

  /**
   * The color of the cancel button.
   * @attr cancel-color
   */
  @property({ type: String, attribute: 'cancel-color' })
  public cancelColor: YatlButtonColor = 'neutral';

  /**
   * The visual variant of the cancel button.
   * @attr cancel-variant
   */
  @property({ type: String, attribute: 'cancel-variant' })
  public cancelVariant?: YatlButtonVariant;

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

  /**
   * Shows the dialog and resolves once the user makes a choice.
   * `reject` and `cancel` are both reported as `false` - use
   * `confirmWithCancel()` if you need to tell them apart.
   */
  public async confirm(): Promise<boolean> {
    return this.waitForOutcome({ accept: true, reject: false, cancel: false });
  }

  /**
   * Shows the dialog and resolves once the user makes a choice, keeping
   * `reject` and `cancel` distinct. Useful for a three-way choice like
   * Save / Don't Save / Cancel.
   */
  public async confirmWithCancel(): Promise<ConfirmationOutcome> {
    return this.waitForOutcome({
      accept: 'accept',
      reject: 'reject',
      cancel: 'cancel',
    });
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

  /**
   * Dismisses the dialog without an explicit accept/reject choice. Also
   * fired for you when the dialog is dismissed via the close button,
   * backdrop click, or Escape.
   */
  public async cancel() {
    const event = new YatlConfirmationDialogCancelEvent();
    this.dispatchEvent(event);
    await this.hide();
  }

  private async waitForOutcome<T>(outcomes: {
    accept: T;
    reject: T;
    cancel: T;
  }): Promise<T> {
    await this.show();
    // Whichever outcomes don't fire would otherwise stay attached forever
    // (only the one that fires is cleaned up by `once`) - the shared
    // signal removes all three once any of them settles.
    const controller = new AbortController();
    const ret = await new Promise<T>(resolve => {
      this.addEventListener(
        'yatl-confirmation-dialog-accept',
        () => resolve(outcomes.accept),
        { once: true, signal: controller.signal },
      );
      this.addEventListener(
        'yatl-confirmation-dialog-reject',
        () => resolve(outcomes.reject),
        { once: true, signal: controller.signal },
      );
      this.addEventListener(
        'yatl-confirmation-dialog-cancel',
        () => resolve(outcomes.cancel),
        { once: true, signal: controller.signal },
      );
    });
    controller.abort();
    return ret;
  }

  protected override render() {
    const hideAcceptButton = this.acceptText === '';
    const hideRejectButton = this.rejectText === '';
    const hideCancelButton = this.cancelText === '';

    return html`
      <yatl-dialog
        exportparts="dialog, body, header, header-actions, footer, footer-actions, close-button"
        label=${this.label}
        ?open=${this.open}
        ?modal=${this.modal}
        ?fullscreen=${this.fullscreen}
        ?no-close-button=${this.noCloseButton}
        @yatl-dialog-show-request=${this.handleDialogShow}
        @yatl-dialog-show=${this.handleDialogShown}
        @yatl-dialog-hide-request=${this.handleDialogHide}
        @yatl-dialog-hide=${this.handleDialogHidden}
      >
        <slot name="header" slot="header">
          <h2 part="label">
            ${this.label || ' ' /* Empty character so it doesn't collapse */}
          </h2>
        </slot>
        <slot name="header-actions" slot="header-actions"></slot>
        <slot></slot>
        <slot name="footer" slot="footer"></slot>
        <slot slot="footer-actions" name="footer-actions">
          <yatl-button
            part="cancel-button"
            color=${this.cancelColor}
            variant=${ifDefined(this.cancelVariant)}
            @click=${this.cancel}
            ?hidden=${hideCancelButton}
          >
            ${this.cancelText}
          </yatl-button>
          <yatl-button
            part="reject-button"
            color=${this.rejectColor}
            variant=${ifDefined(this.rejectVariant)}
            @click=${this.reject}
            ?hidden=${hideRejectButton}
          >
            ${this.rejectText}
          </yatl-button>
          <yatl-button
            part="accept-button"
            color=${this.acceptColor}
            variant=${ifDefined(this.acceptVariant)}
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

  private handleDialogShown() {
    this.dispatchEvent(new YatlConfirmationDialogShowEvent());
  }

  private handleDialogHide() {
    if (this.open) {
      this.open = false;
      // The inner dialog is already in the middle of closing itself
      // (that's why this hide-request fired) - just record the outcome.
      // Calling the public cancel()/hide() here would redundantly
      // re-trigger an already-in-progress close and double-fire our
      // show/hide events.
      this.dispatchEvent(new YatlConfirmationDialogCancelEvent());
    }
  }

  private handleDialogHidden() {
    this.dispatchEvent(new YatlConfirmationDialogHideEvent());
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-confirmation-dialog': YatlConfirmationDialog;
  }
}
