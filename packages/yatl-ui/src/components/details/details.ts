import { html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import styles from './details.styles';

@customElement('yatl-details')
export class YatlDetails extends YatlBase {
  public static override styles = [...super.styles, styles];

  @property({ type: String, reflect: true })
  public name = '';

  @property({ type: Boolean, reflect: true })
  public open = false;

  @property({ type: String })
  public summary = '';

  protected override willUpdate(
    changedProperties: PropertyValues<YatlDetails>,
  ): void {
    if (changedProperties.has('open') && this.open && this.name) {
      document
        .querySelectorAll<YatlDetails>(`yatl-details[name="${this.name}"]`)
        .forEach(element => (element.open = false));
    }
  }

  protected override render() {
    return html`
      <details
        part="base"
        ?open=${this.open}
        @toggle=${this.handleDetailsToggle}
      >
        <summary part="header">
          <slot name="summary" part="summary">${this.summary}</slot>
          <yatl-icon part="arrow-icon" name="chevron-down"></yatl-icon>
        </summary>
        <div part="body">
          <slot></slot>
        </div>
      </details>
    `;
  }

  private handleDetailsToggle(event: Event) {
    const details = event.target as HTMLDetailsElement;
    this.open = details.open;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-details': YatlDetails;
  }
}
