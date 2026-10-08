import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { YatlDetailsToggleEvent } from '../../events/details';
import { YatlBase } from '../base/base';
import styles from './details.styles';

/**
 * @fires yatl-details-toggle - When the details opens or closes
 */
@customElement('yatl-details')
export class YatlDetails extends YatlBase {
  public static override styles = [...super.styles, styles];

  /**
   * Groups details elements so opening one closes the others sharing the same name.
   * @attr name
   */
  @property({ type: String, reflect: true })
  public name = '';

  /**
   * Reflects whether the details is currently expanded.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  public open = false;

  /**
   * The summary text displayed in the header.
   * @attr summary
   */
  @property({ type: String })
  public summary = '';

  @state() private transitioning = false;

  public override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('transitionstart', this.handleTransitionStart);
    this.addEventListener('transitionend', this.handleTransitionEnd);
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('transitionstart', this.handleTransitionStart);
    this.removeEventListener('transitionend', this.handleTransitionEnd);
  }

  protected override willUpdate(
    changedProperties: PropertyValues<YatlDetails>,
  ): void {
    if (changedProperties.has('open')) {
      if (this.open && this.name) {
        // Close others
        (this.getRootNode() as Document | ShadowRoot)
          .querySelectorAll<YatlDetails>(
            `yatl-details[name="${CSS.escape(this.name)}"]`,
          )
          .forEach(element => {
            if (element !== this && element.open) {
              element.open = false;
            }
          });
      }
    }
  }

  protected override render() {
    const bodyClasses = classMap({
      body: true,
      transitioning: this.transitioning,
    });
    return html`
      <details
        class="base"
        part="base"
        ?open=${this.open}
        @toggle=${this.handleDetailsToggle}
      >
        <summary class="header" part="header">
          <slot class="summary" name="summary" part="summary"
            >${this.summary}</slot
          >
          <yatl-icon
            class="arrow-icon"
            part="arrow-icon"
            name="chevron-down"
          ></yatl-icon>
        </summary>
        <div class=${bodyClasses} part="body">
          <slot></slot>
        </div>
      </details>
    `;
  }

  private handleDetailsToggle(event: Event) {
    event.stopPropagation();
    const details = event.target as HTMLDetailsElement;
    this.open = details.open;
    this.dispatchEvent(new YatlDetailsToggleEvent(this.open));
  }

  private handleTransitionStart = (event: TransitionEvent) => {
    if (event.propertyName === 'flex-grow') {
      this.transitioning = true;
    }
  };

  private handleTransitionEnd = (event: TransitionEvent) => {
    if (event.propertyName === 'flex-grow') {
      this.transitioning = false;
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-details': YatlDetails;
  }
}
