import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlFormControl } from '../form-controls/form-control/form-control';
import { YatlBase } from '../base/base';
import { YatlSpinnerState } from '../spinner/spinner';
import { MaybePromise, YatlSize } from '../../types';

import styles from './button.styles';
import sizeStyles from '../../styles/components/size.styles';
import { YatlSpinnerStateChangeEvent } from '../../events';

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
  public static override styles = [...YatlBase.styles, sizeStyles, styles];

  /**
   * The initial, uncontrolled value of the button when form associated.
   * @attr value
   */
  @property({ type: String, attribute: 'value' })
  public defaultValue = this.getAttribute('value') ?? '';

  /** The current, controlled value of the button when form associated. */
  @property({ attribute: false })
  public value = this.getAttribute('value') ?? '';

  /**
   * The native button behavior. Only affects buttons associated with a form.
   * @attr type
   */
  @property({ type: String, reflect: true })
  public type: 'button' | 'submit' | 'reset' = 'button';

  /**
   * The size of the button.
   * @attr size
   */
  @property({ type: String, reflect: true })
  public size: YatlSize = 'medium';

  /**
   * The visual variant of the button.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  public variant: YatlButtonVariant = 'neutral';

  /**
   * The color of the button.
   * @attr color
   */
  @property({ type: String, reflect: true })
  public color: YatlButtonColor = 'neutral';

  /**
   * The current state of the button, shown via the embedded spinner.
   * @attr state
   */
  @property({ type: String, reflect: true })
  public state: YatlSpinnerState = 'idle';

  /**
   * Duration the success state will be displayed before clearing.
   * @attr success-duration
   */
  @property({ type: Number, attribute: 'success-duration' })
  public successDuration = 3000;

  /**
   * Duration the error state will be displayed before clearing.
   * @attr error-duration
   */
  @property({ type: Number, attribute: 'error-duration' })
  public errorDuration = 3000;

  /**
   * A function to run when the button is clicked. If it returns a promise,
   * the button shows a loading state until it resolves, then success or error.
   */
  @property({ attribute: false })
  public action?: () => MaybePromise<unknown>;

  /**
   * Used to override the form owner's `action` attribute.
   * @attr formaction
   */
  @property({ attribute: 'formaction' })
  public formAction?: string;

  /**
   * Used to override the form owner's `enctype` attribute.
   * @attr formenctype
   */
  @property({ attribute: 'formenctype' })
  public formEnctype?:
    | 'application/x-www-form-urlencoded'
    | 'multipart/form-data'
    | 'text/plain';

  /**
   * Used to override the form owner's `method` attribute.
   * @attr formmethod
   */
  @property({ attribute: 'formmethod' })
  public formMethod?: 'post' | 'get';

  /**
   * Used to override the form owner's `novalidate` attribute.
   * @attr formnovalidate
   */
  @property({ attribute: 'formnovalidate', type: Boolean })
  public formNoValidate?: boolean;

  /**
   * Used to override the form owner's `target` attribute.
   * @attr formtarget
   */
  @property({ attribute: 'formtarget' })
  public formTarget?: '_self' | '_blank' | '_parent' | '_top' | string;

  public get formValue() {
    return this.value;
  }

  protected override render() {
    const noOverlay =
      this.color === 'neutral' ||
      this.color === 'raised' ||
      this.variant === 'plain' ||
      this.variant === 'outline';

    return html`
      <button
        part="base"
        type=${this.type}
        ?disabled=${this.disabled || this.state === 'loading'}
        aria-busy=${this.state === 'loading' ? 'true' : 'false'}
        aria-disabled=${this.state === 'loading' ? 'true' : 'false'}
        @click=${this.handleClick}
      >
        <div part="contents">
          <slot name="start"></slot>
          <slot></slot>
          <slot name="end"></slot>
        </div>
        <div class="state-wrapper">
          <yatl-spinner
            state=${this.state}
            class="state-icon"
            part="spinner"
            ?no-overlay=${noOverlay}
            success-duration=${this.successDuration}
            error-duration=${this.errorDuration}
            @yatl-spinner-state-change=${this.handleSpinnerStateChange}
          ></yatl-spinner>
        </div>
      </button>
    `;
  }

  // Satisfy the base class
  protected override renderInput() {}

  private handleSpinnerStateChange(event: YatlSpinnerStateChangeEvent) {
    this.state = event.state;
  }

  private async handleClick(event: MouseEvent) {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    // Only hijack clicks if this is a form associated button.
    if (this.type === 'button') {
      if (this.action) {
        try {
          const action = this.action();
          if (action instanceof Promise) {
            this.state = 'loading';
            await action;
          }

          this.state = 'success';
        } catch (e) {
          this.state = 'error';
          throw e;
        }
      }
      return;
    }

    const form = this.internals.form;
    if (!form) {
      // No form so just let it propagate.
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
