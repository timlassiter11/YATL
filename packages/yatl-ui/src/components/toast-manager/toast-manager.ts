import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { YatlToastHideEvent } from '../../events';
import { ToastRecord, toastStore } from '../../utils/toast-store';
import { YatlBase } from '../base/base';
import styles from './toast-manager.styles';

type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Renders the shared toast store's live (not-yet-dismissed) toasts, above
 * everything else including open dialogs. Toasts are raised via `toast()`
 * (or a `yatl-toast-request` event) and, when dismissed, stay in the store's
 * session history for `yatl-notification-center` to show - mounting that
 * component is optional and requires no changes here.
 */
@customElement('yatl-toast-manager')
export class YatlToastManager extends YatlBase {
  public static override styles = [...super.styles, styles];

  @state() private toasts: ToastRecord[] = [];

  /**
   * The corner of the viewport toasts are anchored to.
   * @attr position
   */
  @property({ type: String, reflect: true })
  public position: ToastPosition = 'bottom-right';

  public override connectedCallback() {
    super.connectedCallback();
    toastStore.addEventListener('change', this.handleStoreChange);
    document.addEventListener('yatl-dialog-show', this.updatePopoverIndex);
    this.popover = 'manual';
    this.handleStoreChange();
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    toastStore.removeEventListener('change', this.handleStoreChange);
    document.removeEventListener('yatl-dialog-show', this.updatePopoverIndex);
  }

  protected override render() {
    return repeat(
      this.toasts,
      toast => toast.id,
      toast => this.renderToast(toast),
    );
  }

  private renderToast(data: ToastRecord) {
    return html`
      <yatl-toast
        id=${data.id}
        label=${ifDefined(data.label)}
        message=${data.message}
        variant=${ifDefined(data.variant)}
        duration=${ifDefined(data.duration)}
        @yatl-toast-hide=${this.handleToastHide}
      ></yatl-toast>
    `;
  }

  private handleStoreChange = () => {
    this.toasts = toastStore.history.filter(t => !t.dismissedAt);
    this.updatePopoverIndex();
  };

  private handleToastHide(event: YatlToastHideEvent) {
    const target = event.target as HTMLElement;
    toastStore.dismiss(target.id, event.reason);
  }

  private updatePopoverIndex = () => {
    if (this.toasts.length) {
      this.hidePopover();
      this.showPopover();
    } else {
      this.hidePopover();
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-toast-manager': YatlToastManager;
  }
}
