import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { YatlToastVariant } from '../../types';
import { YatlBase } from '../base/base';
import styles from './toast.styles';
import { YatlToastHideEvent } from '../../events';
import { animateWithClass, HasSlotController } from '../../utils';

/**
 * @fires yatl-toast-hide - When the toast is hidden by the user or from the timer expiring
 */
@customElement('yatl-toast')
export class YatlToast extends YatlBase {
  public static override styles = [...super.styles, styles];

  private slotController = new HasSlotController(this, '[default]');

  @state() private running = false;

  @property({ type: String })
  public variant: YatlToastVariant = 'neutral';

  @property({ type: String })
  public label = '';

  @property({ type: String })
  public message = '';

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

  public async hide() {
    await animateWithClass(this, 'closing', 'fade-and-collapse', 1000);
    this.hidden = true;
    this.dispatchEvent(new YatlToastHideEvent());
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.startTimer();
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopTimer();
  }

  protected override render() {
    const hasMessage = this.slotController.test(null) || !!this.message;
    const hasLabel = !!this.label;
    const classes = { 'has-label': hasLabel, 'has-message': hasMessage };
    let icon = '';
    if (this.variant === 'danger') {
      icon = 'close';
    } else if (this.variant === 'warning') {
      // TODO: create exclamation icon
    } else if (this.variant === 'success') {
      icon = 'check';
    }

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
      this.hide();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-toast': YatlToast;
  }
}
