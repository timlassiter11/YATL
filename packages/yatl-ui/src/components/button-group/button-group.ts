import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { getEffectiveChildren } from '../../utils';
import { YatlBase } from '../base/base';
import { YatlButton } from '../button/button';
import { YatlDropdown } from '../dropdown/dropdown';
import styles from './button-group.styles';

@customElement('yatl-button-group')
export class YatlButtonGroup extends YatlBase {
  public static override styles = [...super.styles, styles];

  @query('slot')
  private defaultSlot!: HTMLSlotElement;

  protected override render() {
    return html`
      <div part="base">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }

  private handleSlotChange() {
    const elements = getEffectiveChildren(this.defaultSlot);
    const count = elements.length;
    elements.forEach((element, index) => {
      // This is annoying but it handles when dropdowns are in the button group.
      // Kinda important since the toolbar has the column picker in here...
      if (element instanceof YatlDropdown) {
        const trigger = element.querySelector('[slot="trigger"]');
        if (trigger) {
          const children = getEffectiveChildren(trigger);
          element = children.find(c => c instanceof YatlButton) ?? element;
        }
      }

      let position = 'middle';
      if (count === 1) position = 'single';
      else if (index === 0) position = 'first';
      else if (index === count - 1) position = 'last';
      element.setAttribute('data-group-position', position);
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-button-group': YatlButtonGroup;
  }
}
