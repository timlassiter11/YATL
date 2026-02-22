import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import styles from './option.styles';
import { YatlOptionToggleRequest } from '../../events/option';

@customElement('yatl-option')
export class YatlOption extends YatlBase {
  public static override styles = [...super.styles, styles];

  @property({ type: String, reflect: true })
  public value = 'on';

  @property({ type: Boolean, reflect: true })
  public checkable = false;

  @property({ type: Boolean, reflect: true })
  public checked = false;

  @property({ type: Boolean, reflect: true })
  public disabled = false;

  @property({ type: String, reflect: true })
  public label = '';

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
    return html`<span part="label">${this.label}</span>`;
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
