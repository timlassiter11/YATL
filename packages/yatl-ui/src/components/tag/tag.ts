import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlTagDismissEvent } from '../../events';
import { YatlBase } from '../base/base';
import styles from './tag.styles';

/**
 * @fires yatl-tag-dismiss - Fired when the dismiss button is clicked.
 */
@customElement('yatl-tag')
export class YatlTag extends YatlBase {
  public static override styles = [...super.styles, styles];

  /**
   * When true, a dismiss button is rendered.
   * @attr dismissable
   */
  @property({ type: Boolean, reflect: true })
  public dismissable = false;

  protected override render() {
    return html`
      <span part="text" class="text">
        <slot></slot>
      </span>
      ${this.renderClearIcon()}
    `;
  }

  protected renderClearIcon() {
    if (!this.dismissable) {
      return nothing;
    }

    return html`
      <yatl-button
        variant="plain"
        color="muted"
        part="dismiss-button"
        class="dismiss-button"
        size="small"
        @click=${this.dismissClick}
      >
        <yatl-icon name="close"></yatl-icon>
      </yatl-button>
    `;
  }

  private dismissClick(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.dispatchEvent(new YatlTagDismissEvent());
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-tag': YatlTag;
  }
}
