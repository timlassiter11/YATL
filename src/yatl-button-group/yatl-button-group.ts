import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import theme from '../theme';
import styles from './yatl-button-group.styles';
import { YatlButton } from '../yatl-button/yatl-button';
import { YatlDropdown } from '../yatl-dropdown';
import { getEffectiveChildren } from '../utils';

@customElement('yatl-button-group')
export class YatlButtonGroup extends LitElement {
  static styles = [theme, styles];

  render() {
    return html`
      <div class="group-container">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }

  private handleSlotChange(event: Event) {
    const slot = event.target as HTMLSlotElement;
    const elements = getEffectiveChildren(slot);
    console.log(elements);
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
