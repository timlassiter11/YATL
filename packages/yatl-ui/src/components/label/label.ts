import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { YatlBase } from '../base/base';
import styles from './label.styles';

/**
 * A styled label, matching the look of YATL form control labels. Used
 * internally by form controls, and also usable standalone to label custom
 * markup that isn't a form control at all.
 *
 * Note: because this renders in its own shadow root, `for` is resolved
 * manually rather than relying on the native `<label for>` behavior (which
 * can't cross a shadow boundary) - clicking anywhere on the label clicks the
 * referenced element, the same way a native label would.
 * @slot - The label content.
 * @slot end - Trailing content, e.g. a character count.
 */
@customElement('yatl-label')
export class YatlLabel extends YatlBase {
  public static override styles = [...super.styles, styles];

  /**
   * The id of the element this label is for, resolved against whatever
   * document or shadow root this label itself lives in.
   * @attr for
   */
  @property({ type: String, attribute: 'for' })
  public htmlFor = '';

  protected override render() {
    return html`
      <div
        part="base"
        class=${classMap({ base: true, clickable: !!this.htmlFor })}
        @click=${this.handleClick}
      >
        <slot></slot>
        <slot name="end"></slot>
      </div>
    `;
  }

  private handleClick() {
    if (!this.htmlFor) {
      return;
    }
    const root = this.getRootNode() as Document | ShadowRoot;
    const control = root.getElementById(this.htmlFor) as HTMLElement | null;
    // Native <label> activation behavior both focuses and activates
    // (e.g. toggles a checkbox) the labeled control - .click() alone
    // fires the activation but, unlike a real user click, doesn't focus.
    control?.focus();
    control?.click();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-label': YatlLabel;
  }
}
