import { html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import styles from './tab-panel.styles';

@customElement('yatl-tab-panel')
export class YatlTabPanel extends YatlBase {
  public static override styles = [...super.styles, styles];

  @property({ type: String })
  public name = '';

  @property({ type: Boolean, reflect: true })
  public active = false;

  public override connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'tabpanel');
  }

  protected override willUpdate(
    changedProperties: PropertyValues<YatlTabPanel>,
  ): void {
    if (changedProperties.has('active')) {
      this.setAttribute('aria-hidden', this.active ? 'false' : 'true');
    }
  }

  protected override render() {
    return html`<div part="base"><slot></slot></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-tab-panel': YatlTabPanel;
  }
}
