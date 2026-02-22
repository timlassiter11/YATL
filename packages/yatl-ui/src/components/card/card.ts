import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { HasSlotController } from '../../utils/slot-controller';
import { YatlBase } from '../base/base';
import styles from './card.styles';

@customElement('yatl-card')
export class YatlCard extends YatlBase {
  public static override styles = [...super.styles, styles];

  private slotController = new HasSlotController(
    this,
    'header-start',
    'header-end',
    'footer-start',
    'footer-end',
  );

  protected override render() {
    const hasHeader =
      this.slotController.test('header-start') ||
      this.slotController.test('header-end');
    const hasFooter =
      this.slotController.test('footer-start') ||
      this.slotController.test('footer-end');

    return html`
      <header part="header" class=${classMap({ 'has-header': hasHeader })}>
        <slot name="header-start"></slot>
        <slot name="header">
          <div class="divider"></div>
        </slot>
        <slot name="header-end"></slot>
      </header>

      <div part="body">
        <slot></slot>
      </div>

      <footer part="footer" class=${classMap({ 'has-footer': hasFooter })}>
        <slot name="footer-start"></slot>
        <slot name="footer">
          <div class="divider"></div>
        </slot>
        <slot name="footer-end"></slot>
      </footer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-card': YatlCard;
  }
}
