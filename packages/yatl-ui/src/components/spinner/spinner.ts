import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import { icons } from '../../icons';

import styles from './spinner.styles';
import { YatlSpinnerStateChangeEvent } from '../../events/spinner';
import { ifDefined } from 'lit/directives/if-defined.js';
import { classMap } from 'lit/directives/class-map.js';

export type YatlSpinnerState = 'idle' | 'loading' | 'success' | 'error';

/**
 * @fires yatl-spinner-state-change - When the state changes
 */
@customElement('yatl-spinner')
export class YatlSpinner extends YatlBase {
  public static override styles = [...super.styles, styles];

  // Decouple internal state from external so we can animate smoothly
  @state() private internalState?: 'success' | 'error';
  @state() private showOverlay = false;

  @property({ type: String, reflect: true })
  public state: YatlSpinnerState = 'loading';

  /** Duration the success state will be displayed before clearing */
  @property({ type: Number, attribute: 'success-duration' })
  public successDuration = 3000;

  /** Duration the error state will be displayed before clearing */
  @property({ type: Number, attribute: 'error-duration' })
  public errorDuration = 3000;

  @property({ type: Number, attribute: 'overlay-duration' })
  public overlayDuration = 3000;

  @property({ type: Boolean, attribute: 'no-overlay' })
  public noOverlay = false;

  protected override willUpdate(
    changedProperties: PropertyValues<YatlSpinner>,
  ) {
    super.willUpdate(changedProperties);

    if (changedProperties.has('state')) {
      if (this.state === 'success' && this.successDuration) {
        setTimeout(() => (this.state = 'idle'), this.successDuration);
      }
      if (this.state === 'error' && this.errorDuration) {
        setTimeout(() => (this.state = 'idle'), this.errorDuration);
      }

      if (this.state === 'success' || this.state === 'error') {
        // Store the current state internally so when the state changes
        // back to idle, we keep our colors for the animation.
        this.internalState = this.state;
        if (!this.noOverlay) {
          this.showOverlay = true;
          if (this.overlayDuration) {
            setTimeout(() => (this.showOverlay = false), this.overlayDuration);
          }
          this.updateAnimationOrigin();
        }
      }

      this.dispatchEvent(new YatlSpinnerStateChangeEvent(this.state));
    }
  }

  public override render() {
    const spinnerIcon = icons['spinner'];
    const checkIcon = icons['check'];
    const closeIcon = icons['close'];
    const classes = {
      'show-overlay': this.showOverlay,
    };
    return html`
      <div
        part="base"
        role="status"
        class=${classMap(classes)}
        data-state=${ifDefined(this.internalState)}
        aria-busy=${this.state === 'loading'}
      >
        <svg part="svg" viewBox="0 0 24 24" fill="none">
          <!-- put check first so the animation looks better -->
          ${checkIcon} ${closeIcon} ${spinnerIcon}
        </svg>
        <span class="sr-only">Loading...</span>
        <div
          part="state-overlay"
          @transitionend=${this.handleStateTransitionend}
        ></div>
      </div>
    `;
  }

  private updateAnimationOrigin() {
    const parent = this.offsetParent;
    if (!parent) return;

    const hostRect = this.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    const centerX = hostRect.left - parentRect.left + hostRect.width / 2;
    const centerY = hostRect.top - parentRect.top + hostRect.height / 2;
    const xPercent = (centerX / parentRect.width) * 100;
    const yPercent = (centerY / parentRect.height) * 100;
    this.style.setProperty('--origin-x', `${xPercent}%`);
    this.style.setProperty('--origin-y', `${yPercent}%`);
  }

  private handleStateTransitionend() {
    if (this.state !== 'success' && this.state !== 'error') {
      this.internalState = undefined;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-spinner': YatlSpinner;
  }
}
