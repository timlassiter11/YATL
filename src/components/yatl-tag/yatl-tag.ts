import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlTagDismissEvent } from '../../events';
import { YatlBase } from '../yatl-base';
import styles from './yatl-tag.styles';

/**
 * @fires yatl-tag-dismiss-request
 * @fires yatl-tag-dismiss
 */
@customElement('yatl-tag')
export class YatlTag extends YatlBase {
  public static override styles = [...super.styles, styles];

  @property({ type: Boolean, reflect: true })
  public dismissable = false;

  protected override render() {
    return html`<slot></slot>${this.renderClearIcon()}`;
  }

  protected renderClearIcon() {
    if (!this.dismissable) {
      return nothing;
    }

    return html`
      <yatl-button part="dismiss-button" @click=${this.dismissClick}>
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
