import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import styles from './option.styles';
import { YatlOptionToggleRequest } from '../../events/option';
import { highlightText, MatchIndex } from '@timlassiter11/yatl';

/**
 * @fires yatl-option-toggle - Fired before a checkable option's checked state changes. Cancellable.
 */
@customElement('yatl-option')
export class YatlOption extends YatlBase {
  public static override styles = [...super.styles, styles];

  /**
   * The value associated with this option.
   * @attr value
   */
  @property({ type: String, reflect: true })
  public value = 'on';

  /**
   * When true, this option renders a checkmark and can be toggled.
   * @attr checkable
   */
  @property({ type: Boolean, reflect: true })
  public checkable = false;

  /**
   * Reflects whether this option is currently checked. Only applies when `checkable` is true.
   * @attr checked
   */
  @property({ type: Boolean, reflect: true })
  public checked = false;

  /**
   * Disables selection of this option.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  public disabled = false;

  /**
   * The text displayed for this option.
   * @attr label
   */
  @property({ type: String, reflect: true })
  public label = '';

  /** Character ranges within `label` to visually highlight, e.g. for search matches. */
  @property({ attribute: false })
  public highlightIndices?: MatchIndex[];

  protected override render() {
    return html`
      <span part="base">
        ${this.renderCheck()}
        <slot part="start" name="start"></slot>
        ${this.renderLabel()}
        <slot part="end" name="end"></slot>
      </span>
    `;
  }

  protected renderLabel() {
    if (!this.highlightIndices || this.highlightIndices.length === 0) {
      return html`<span part="label">${this.label}</span>`;
    }
    return html`<span part="label"
      >${highlightText(this.label, this.highlightIndices)}</span
    >`;
  }

  protected renderCheck() {
    return this.checkable
      ? html`<yatl-icon part="check" name="check"></yatl-icon>`
      : nothing;
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.handleItemClicked);
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.handleItemClicked);
  }

  private handleItemClicked = (event: Event) => {
    if (this.disabled) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    if (this.checkable) {
      const newState = !this.checked;
      const requestEvent = new YatlOptionToggleRequest(this.value, newState);
      this.dispatchEvent(requestEvent);
      if (requestEvent.defaultPrevented) {
        return;
      }
      this.checked = newState;
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-option': YatlOption;
  }
}
