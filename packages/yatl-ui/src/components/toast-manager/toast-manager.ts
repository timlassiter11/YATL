import { html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { YatlToastRequest } from '../../events/toast';
import { YatlToastData } from '../../types';
import { YatlBase } from '../base/base';
import styles from './toast-manager.styles';

type ToastData = YatlToastData & { id: string };

@customElement('yatl-toast-manager')
export class YatlToastManager extends YatlBase {
  public static override styles = [...super.styles, styles];

  @state() private toasts: ToastData[] = [];

  public override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('yatl-toast-request', this.handleToastRequest);
    document.addEventListener('yatl-dialog-show', this.updatePopoverIndex);
    this.popover = 'manual';
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('yatl-toast-request', this.handleToastRequest);
    document.removeEventListener('yatl-dialog-show', this.updatePopoverIndex);
  }

  protected override render() {
    return repeat(
      this.toasts,
      toast => toast.id,
      toast => this.renderToast(toast),
    );
  }

  private renderToast(data: ToastData) {
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

  private handleToastRequest = (event: YatlToastRequest) => {
    this.toasts = [{ id: crypto.randomUUID(), ...event.data }, ...this.toasts];
    this.updatePopoverIndex();
  };

  private handleToastHide(event: Event) {
    const target = event.target as HTMLElement;
    const index = this.toasts.findIndex(t => t.id === target.id);
    if (index >= 0) {
      const toasts = [...this.toasts];
      toasts.splice(index, 1);
      this.toasts = toasts;
    }
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
