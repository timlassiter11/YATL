import { html, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type { YatlSize } from '../../types';
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

  /**
   * When set, disables all child controls. Leave unset to let children manage their own disabled state.
   * @attr disabled
   */
  @property({ type: Boolean })
  public disabled?: boolean;

  /**
   * When set, sets the size of all child buttons. Leave unset to let each
   * button keep its own size.
   * @attr size
   */
  @property({ type: String })
  public size?: YatlSize;

  protected override willUpdate(
    changedProperties: PropertyValues<YatlButtonGroup>,
  ): void {
    if (changedProperties.has('disabled') || changedProperties.has('size')) {
      this.updateChildStates();
    }
  }

  protected override render() {
    return html`
      <div part="base">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }

  private handleSlotChange() {
    const elements = this.getAllChildren();
    const count = elements.length;
    elements.forEach((element, index) => {
      let position = 'middle';
      if (count === 1) position = 'single';
      else if (index === 0) position = 'first';
      else if (index === count - 1) position = 'last';
      element.setAttribute('data-group-position', position);
    });
    this.updateChildStates();
  }

  private updateChildStates() {
    // Before the first render, slotchange applies these once there's a slot
    if (!this.defaultSlot) {
      return;
    }
    for (const child of this.getAllChildren()) {
      if (this.disabled !== undefined && 'disabled' in child) {
        child.disabled = this.disabled;
      }
      if (this.size !== undefined && child instanceof YatlButton) {
        child.size = this.size;
      }
    }
  }

  private getAllChildren() {
    return getEffectiveChildren(this.defaultSlot).map(element => {
      // This is annoying but it handles when dropdowns are in the button group.
      // Kinda important since the toolbar has the column picker in here...
      if (element instanceof YatlDropdown) {
        const trigger = element.querySelector('[slot="trigger"]');
        if (trigger) {
          const children = getEffectiveChildren(trigger);
          element = children.find(c => c instanceof YatlButton) ?? element;
        }
      }
      return element;
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-button-group': YatlButtonGroup;
  }
}
