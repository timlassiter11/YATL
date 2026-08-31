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
        @pointerdown=${this.handlePointerDown}
        @click=${this.handleClick}
      >
        <slot></slot>
        <slot name="end"></slot>
      </div>
    `;
  }

  private handlePointerDown(event: PointerEvent) {
    if (!this.htmlFor) {
      return;
    }
    // A press on the label is about to be redirected to the labeled
    // control (see handleClick()) - stop it here so anything listening
    // for "outside" presses (e.g. a dropdown's click-away-to-close
    // handler) doesn't mistake it for one, since the label lives outside
    // the control's own DOM subtree even though it's acting on its
    // behalf. Without this, a dropdown control sees the press as
    // external and closes itself before the forwarded click reopens it.
    event.stopPropagation();
  }

  private handleClick(event: Event) {
    if (!this.htmlFor) {
      return;
    }
    const root = this.getRootNode() as Document | ShadowRoot;
    const control = root.getElementById(this.htmlFor) as HTMLElement | null;
    if (!control) {
      return;
    }
    // Native <label> activation behavior both focuses and activates
    // (e.g. toggles a checkbox) the labeled control - dispatching a click
    // event does that too (the browser still runs the control's default
    // action, e.g. toggling a checkbox, as long as the event isn't
    // cancelled), but unlike a real user click it doesn't focus.
    control.focus();
    // Deliberately dispatch our own click rather than call control.click():
    // that always stamps a synthetic pointerId of -1, which some controls
    // (e.g. yatl-dropdown's trigger) specifically read as "not a real
    // pointer click" and ignore while already open - so a second label
    // click could open a dropdown but never close it. Reuse the id from
    // the pointer that actually clicked the label when there is one, so
    // this reads as a genuine pointer click to code that inspects it.
    const pointerId = event instanceof PointerEvent ? event.pointerId : 1;
    control.dispatchEvent(
      new PointerEvent('click', {
        bubbles: true,
        composed: true,
        cancelable: true,
        pointerId,
        isPrimary: true,
        button: 0,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-label': YatlLabel;
  }
}
