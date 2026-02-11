import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { HasSlotController } from '../../utils/slot-controller';
import { YatlBase } from '../yatl-base';
import styles from './yatl-card.styles';

@customElement('yatl-card')
export class YatlCard extends YatlBase {
  public static override styles = [...super.styles, styles];

  private slotController = new HasSlotController(
    this,
    'header',
    'header-actions',
    'footer',
    'footer-actions',
  );

  protected override render() {
    const hasHeader =
      this.slotController.test('header') ||
      this.slotController.test('header-actions');
    const hasFooter =
      this.slotController.test('footer') ||
      this.slotController.test('footer-actions');

    return html`
      <header part="header" class=${classMap({ hasHeader })}>
        <slot name="header"></slot>
        <slot name="header-actions"></slot>
      </header>

      <slot part="body"></slot>

      <footer part="footer" class=${classMap({ hasFooter })}>
        <slot name="footer"></slot>
        <slot name="footer-actions"></slot>
      </footer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-card': YatlCard;
  }
}
