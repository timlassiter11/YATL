import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { YatlDropdownToggleEvent } from '../../events';
import { formatRelativeTime, toastVariantIcon } from '../../utils/common';
import { ToastRecord, toastStore } from '../../utils/toast-store';
import { YatlBase } from '../base/base';
import styles from './notification-center.styles';

/**
 * A bell trigger with an unread-count badge that opens a dropdown of this
 * session's toast history (from `toast()`/`yatl-toast-manager`). Purely
 * additive - drop it in anywhere and it starts working with zero other
 * wiring, whether or not `yatl-toast-manager` is also mounted.
 *
 * @fires yatl-notification-center-clear - When the history is cleared, from the "Clear all" button.
 */
@customElement('yatl-notification-center')
export class YatlNotificationCenter extends YatlBase {
  public static override styles = [...super.styles, styles];

  @state() private history: ToastRecord[] = [];
  // Bumped on an interval while the panel is open so relative timestamps
  // ("2 minutes ago") keep advancing without a toast having to come in.
  @state() private now = Date.now();
  private relativeTimeInterval?: ReturnType<typeof setInterval>;

  /**
   * Once history exceeds this many entries, the oldest dismissed entries
   * are dropped first. Forwarded to the shared toast store.
   * @attr max-history
   */
  @property({ type: Number, attribute: 'max-history' })
  public maxHistory = 50;

  /**
   * Label used for the panel's title and the trigger button's accessible name.
   * @attr label
   */
  @property({ type: String })
  public label = 'Notifications';

  public get unreadCount() {
    return this.history.filter(record => !record.read).length;
  }

  public override connectedCallback() {
    super.connectedCallback();
    toastStore.maxHistory = this.maxHistory;
    toastStore.addEventListener('change', this.handleStoreChange);
    this.handleStoreChange();
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    toastStore.removeEventListener('change', this.handleStoreChange);
    this.stopRelativeTimeRefresh();
  }

  protected override updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('maxHistory')) {
      toastStore.maxHistory = this.maxHistory;
    }
  }

  protected override render() {
    const unread = this.unreadCount;

    return html`
      <yatl-dropdown @yatl-dropdown-toggle=${this.handleDropdownToggle}>
        <div slot="trigger" part="trigger-wrapper">
          <yatl-button part="trigger" variant="plain" aria-label=${this.label}>
            <yatl-icon name="bell"></yatl-icon>
            <span class="sr-only">${this.label}</span>
          </yatl-button>
          ${unread > 0
            ? html`<span part="badge">${unread > 99 ? '99+' : unread}</span>`
            : ''}
        </div>
        <div part="panel">
          <div part="header">
            <span part="title">${this.label}</span>
            <yatl-button
              part="clear-button"
              size="small"
              variant="plain"
              ?disabled=${!this.history.length}
              @click=${this.handleClearClick}
            >
              Clear all
            </yatl-button>
          </div>
          ${this.history.length
            ? html`<div part="list">
                ${repeat(
                  this.history,
                  record => record.id,
                  record => this.renderItem(record),
                )}
              </div>`
            : html`<div part="empty">No notifications</div>`}
        </div>
      </yatl-dropdown>
    `;
  }

  private renderItem(record: ToastRecord) {
    const icon = toastVariantIcon(record.variant);

    return html`
      <div part="item" class=${classMap({ unread: !record.read })}>
        <yatl-icon
          part="item-icon"
          name=${icon}
          data-variant=${record.variant ?? 'neutral'}
        ></yatl-icon>
        <div part="item-body">
          <span part="item-label">${record.label || record.message}</span>
          ${record.label
            ? html`<span part="item-message">${record.message}</span>`
            : ''}
          <span part="item-time"
            >${formatRelativeTime(record.createdAt, this.now)}</span
          >
        </div>
        <yatl-button
          part="item-remove"
          size="small"
          variant="plain"
          aria-label="Remove"
          @click=${() => this.handleRemoveClick(record.id)}
        >
          <yatl-icon name="close"></yatl-icon>
        </yatl-button>
      </div>
    `;
  }

  private handleStoreChange = () => {
    this.history = [...toastStore.history];
  };

  private handleDropdownToggle(event: YatlDropdownToggleEvent) {
    if (event.open) {
      toastStore.markAllRead();
      this.startRelativeTimeRefresh();
    } else {
      this.stopRelativeTimeRefresh();
    }
  }

  private startRelativeTimeRefresh() {
    this.stopRelativeTimeRefresh();
    this.now = Date.now();
    this.relativeTimeInterval = setInterval(() => {
      this.now = Date.now();
    }, 30_000);
  }

  private stopRelativeTimeRefresh() {
    clearInterval(this.relativeTimeInterval);
    this.relativeTimeInterval = undefined;
  }

  private handleClearClick() {
    toastStore.clear();
    this.dispatchEvent(new Event('yatl-notification-center-clear'));
  }

  private handleRemoveClick(id: string) {
    toastStore.remove(id);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-notification-center': YatlNotificationCenter;
  }
}
