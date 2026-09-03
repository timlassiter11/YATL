import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { YatlToastVariant } from '../../types';
import { YatlBase } from '../base/base';
import styles from './toast.styles';
import { YatlToastHideEvent, YatlToastHideReason } from '../../events';
import {
  animateWithClass,
  HasSlotController,
  toastVariantIcon,
} from '../../utils';

/**
 * @fires yatl-toast-hide - When the toast is hidden by the user or from the timer expiring. `event.reason` is 'user' or 'timeout'.
 */
@customElement('yatl-toast')
export class YatlToast extends YatlBase {
  public static override styles = [...super.styles, styles];

  private slotController = new HasSlotController(this, '[default]', 'label');
  // Skips the redundant startTimer() call that would otherwise fire from
  // updated() on the very same cycle connectedCallback() already started it.
  private isFirstUpdate = true;

  @state() private running = false;

  /**
   * The visual style of the toast.
   * @attr variant
   */
  @property({ type: String })
  public variant: YatlToastVariant = 'neutral';

  /**
   * The toast's title. Falls back to `message` if not set.
   * @attr label
   */
  @property({ type: String })
  public label = '';

  /**
   * The body text of the toast.
   * @attr message
   */
  @property({ type: String })
  public message = '';

  /**
   * Time in milliseconds before the toast automatically hides. Set to `0` to disable auto-hide.
   * @attr duration
   */
  @property({ type: Number, reflect: true })
  public duration = 0;

  public stopTimer() {
    this.running = false;
  }

  public async startTimer() {
    this.stopTimer();

    const duration = this.duration ?? 0;
    if (duration) {
      if (this.running) {
        // We need to toggle the class to restart the animation
        this.running = false;
        await this.updateComplete;
      }
      this.running = true;
    } else {
      this.running = false;
    }
  }

  public show() {
    this.hidden = false;
  }

  public async hide(reason: YatlToastHideReason = 'user') {
    await animateWithClass(this, 'closing', 'fade-and-collapse', 1000);
    this.hidden = true;
    this.dispatchEvent(new YatlToastHideEvent(reason));
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.startTimer();
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopTimer();
  }

  protected override updated(changedProperties: PropertyValues<this>) {
    // A toast updated in place via toast({ id, ... }) (see YatlToastManager)
    // should get a fresh countdown, same as if it were shown for the first time.
    if (!this.isFirstUpdate && changedProperties.has('duration')) {
      this.startTimer();
    }
    this.isFirstUpdate = false;
  }

  protected override render() {
    const hasMessage = this.slotController.test(null) || !!this.message;
    const hasLabel = this.slotController.test('label') || !!this.label;
    const classes = { 'has-label': hasLabel, 'has-message': hasMessage };
    const icon = toastVariantIcon(this.variant);

    return html`
      <div
        part="base"
        class=${classMap(classes)}
        style="--duration: ${this.duration}ms;"
      >
        <div part="label-row">
          <yatl-icon part="status-icon" name=${icon}></yatl-icon>
          <span part="label">
            <slot name="label"> ${this.label || this.message} </slot>
          </span>
          <yatl-button
            part="close"
            size="small"
            variant="plain"
            @click=${this.handleCloseClick}
          >
            <yatl-icon name="close"></yatl-icon>
          </yatl-button>
        </div>
        <slot>
          <span part="message"> ${this.message} </span>
        </slot>
        <div class="timer-wrapper">
          <div
            part="timer"
            class=${classMap({ running: this.running })}
            @animationend=${this.handleAnimationEnd}
          ></div>
        </div>
      </div>
    `;
  }

  private handleCloseClick() {
    this.hide();
  }

  private handleAnimationEnd(event: AnimationEvent) {
    if (event.animationName === 'toast-timer') {
      this.hide('timeout');
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-toast': YatlToast;
  }
}
