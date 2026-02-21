import { html, nothing, PropertyValueMap } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './button.styles';
import { YatlFormControl } from '../form-controls/form-control/form-control';
import { YatlBase } from '../base/base';

export type YatlButtonVariant = 'neutral' | 'outline' | 'plain';
export type YatlButtonColor =
  | 'neutral'
  | 'brand'
  | 'danger'
  | 'warning'
  | 'success'
  | 'raised'
  | 'muted';

@customElement('yatl-button')
export class YatlButton extends YatlFormControl {
  // We don't need the form control styles but we still want the base styles
  public static override styles = [...YatlBase.styles, styles];

  @property({ type: String, attribute: 'value' })
  public defaultValue = this.getAttribute('value') ?? '';

  @property({ attribute: false })
  public value = this.getAttribute('value') ?? '';

  @property({ type: String, reflect: true })
  public type: 'button' | 'submit' | 'reset' = 'button';

  @property({ type: String, reflect: true })
  public variant: YatlButtonVariant = 'neutral';

  @property({ type: String, reflect: true })
  public color: YatlButtonColor = 'neutral';

  @property({ type: String, reflect: true })
  public state: 'idle' | 'loading' | 'success' = 'idle';

  @property({ type: Number, attribute: 'success-duration' })
  public successDuration = 2000;

  /** Used to override the form owner's `action` attribute. */
  @property({ attribute: 'formaction' })
  public formAction?: string;

  /** Used to override the form owner's `enctype` attribute.  */
  @property({ attribute: 'formenctype' })
  public formEnctype?:
    | 'application/x-www-form-urlencoded'
    | 'multipart/form-data'
    | 'text/plain';

  /** Used to override the form owner's `method` attribute.  */
  @property({ attribute: 'formmethod' })
  public formMethod?: 'post' | 'get';

  /** Used to override the form owner's `novalidate` attribute. */
  @property({ attribute: 'formnovalidate', type: Boolean })
  public formNoValidate?: boolean;

  /** Used to override the form owner's `target` attribute. */
  @property({ attribute: 'formtarget' })
  public formTarget?: '_self' | '_blank' | '_parent' | '_top' | string;

  public get formValue() {
    return this.value;
  }

  protected override willUpdate(
    changedProperties: PropertyValueMap<YatlButton>,
  ): void {
    if (changedProperties.has('state')) {
      if (this.state === 'success') {
        setTimeout(() => (this.state = 'idle'), this.successDuration);
      }
    }
  }

  protected override render() {
    return html`
      <button
        part="base"
        type=${this.type}
        ?disabled=${this.disabled || this.state === 'loading'}
        aria-busy=${this.state === 'loading' ? 'true' : 'false'}
        aria-disabled=${this.state === 'loading' ? 'true' : 'false'}
        @click=${this.handleClick}
      >
        <slot name="start"></slot>
        <slot></slot>
        <slot name="end"></slot>
        <div class="state-icon">
          <yatl-spinner class="icon spinner" part="spinner"></yatl-spinner>
          <svg
            class="icon checkmark"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </button>
    `;
  }

  // Satisfy the base class
  protected override renderInput() {}

  private handleClick(event: MouseEvent) {
    // We only need to hijack clicks if this is a
    // form associated button that is not disabled.
    if (this.disabled || this.type === 'button') {
      return;
    }

    // No form so just let it propagate.
    const form = this.internals.form;
    if (!form) {
      return;
    }

    // Stop the default click so we can handle it
    event.preventDefault();
    event.stopPropagation();

    // Handle Reset
    if (this.type === 'reset') {
      form.reset();
      return;
    }

    // This is a really annoying hack but it's how Web Awesome does it.
    // Basically we have to build a button, add it to our form, and click it.
    if (this.type === 'submit') {
      const button = document.createElement('button');
      button.type = 'submit';
      button.style.display = 'none';

      // Copy over form data attributes
      [
        'name',
        'value',
        'formaction',
        'formenctype',
        'formmethod',
        'formnovalidate',
        'formtarget',
      ].forEach(attr => {
        if (this.hasAttribute(attr)) {
          button.setAttribute(attr, this.getAttribute(attr)!);
        }
      });

      // Add button to form then click it and remove it.
      form.appendChild(button);
      button.click();
      button.remove();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-button': YatlButton;
  }
}
