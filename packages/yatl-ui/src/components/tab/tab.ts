import { html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import styles from './tab.styles';

@customElement('yatl-tab')
export class YatlTab extends YatlBase {
  public static override styles = [...super.styles, styles];

  @property({ type: String })
  public panel = '';

  @property({ type: Boolean, reflect: true })
  public active = false;

  @property({ type: Boolean, reflect: true })
  public disabled = false;

  public override connectedCallback() {
    super.connectedCallback();
    // Auto slot
    this.slot ||= 'tabs';
    this.setAttribute('role', 'tab');
  }

  protected override willUpdate(
    changedProperties: PropertyValues<YatlTab>,
  ): void {
    if (changedProperties.has('active')) {
      this.setAttribute('aria-selected', this.active ? 'true' : 'false');
    }

    if (changedProperties.has('disabled')) {
      this.setAttribute('aria-disabled', this.disabled ? 'true' : 'false');

      if (this.disabled && !this.active) {
        this.tabIndex = -1;
      } else {
        this.tabIndex = 0;
      }
    }
  }

  protected override render() {
    return html` <slot></slot> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-tab': YatlTab;
  }
}
