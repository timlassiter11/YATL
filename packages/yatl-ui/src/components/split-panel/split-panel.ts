import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { YatlSplitPanelPositionEvent } from '../../events/split-panel';
import { YatlBase } from '../base/base';
import styles from './split-panel.styles';

export type SplitPanelOrientation = 'horizontal' | 'vertical';

/**
 * Two resizable panels with a draggable divider.
 *
 * ```html
 * <yatl-split-panel orientation="horizontal" position="28" start-min="220" end-min="320">
 *   <yatl-card slot="start">...</yatl-card>
 *   <yatl-table slot="end"></yatl-table>
 * </yatl-split-panel>
 * ```
 *
 * `orientation` describes how the PANELS sit, not the divider: `horizontal`
 * puts them side by side with a vertical divider between them.
 *
 * @fires yatl-split-panel-position - When the panel position changes
 */
@customElement('yatl-split-panel')
export class YatlSplitPanel extends YatlBase {
  public static override styles = [styles];

  /** `horizontal` = panels side by side. `vertical` = panels stacked. */
  @property({ reflect: true })
  public orientation: SplitPanelOrientation = 'horizontal';

  /** Start panel size, as a percentage of the space left after the divider. */
  @property({ type: Number })
  public position = 50;

  /** Smallest the start panel may get, in pixels. */
  @property({ type: Number, attribute: 'start-min' })
  public startMin = 0;

  /** Smallest the end panel may get, in pixels. */
  @property({ type: Number, attribute: 'end-min' })
  public endMin = 0;

  /** Percentage restored on double-click. Defaults to the initial `position`. */
  @property({ type: Number, attribute: 'default-position' })
  public defaultPosition?: number;

  /** Keyboard step, in percent. Shift multiplies it by 5. */
  @property({ type: Number })
  public step = 2;

  @property({ type: Boolean, reflect: true })
  public disabled = false;

  @property({ attribute: 'divider-label' })
  public dividerLabel = 'Resize panels';

  @property({ type: Boolean, reflect: true })
  private dragging = false;

  /** Host size along the split axis. Kept in state so resizing re-clamps. */
  @state()
  private hostSize = 0;

  @query('.divider')
  private divider!: HTMLDivElement;

  private resizeObserver?: ResizeObserver;
  private pointerId?: number;

  private get isHorizontal() {
    return this.orientation === 'horizontal';
  }

  /** Space the panels actually share, with the divider track taken out. */
  private get available() {
    const divider = this.isHorizontal
      ? this.divider?.offsetWidth
      : this.divider?.offsetHeight;
    return Math.max(this.hostSize - (divider ?? 0), 0);
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.resizeObserver = new ResizeObserver(() => this.measure());
    this.resizeObserver.observe(this);
  }

  public override disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    super.disconnectedCallback();
  }

  protected override firstUpdated() {
    this.defaultPosition ??= this.position;
    this.measure();
  }

  protected override render() {
    // Clamp at render time rather than mutating `position`, so a window resize
    // that squeezes the start panel doesn't destroy the user's preference.
    const percent = this.clamp(this.position);

    return html`
      <div part="panel start" class="panel">
        <slot name="start"></slot>
      </div>

      <div
        part="divider"
        class="divider"
        role="separator"
        tabindex=${this.disabled ? -1 : 0}
        aria-label=${this.dividerLabel}
        aria-orientation=${this.isHorizontal ? 'vertical' : 'horizontal'}
        aria-valuenow=${Math.round(percent)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-disabled=${this.disabled ? 'true' : 'false'}
        style=${`--split-position:${percent}%`}
        @pointerdown=${this.handlePointerDown}
        @pointermove=${this.handlePointerMove}
        @pointerup=${this.handlePointerUp}
        @pointercancel=${this.handlePointerUp}
        @lostpointercapture=${this.handlePointerUp}
        @dblclick=${this.handleDoubleClick}
        @keydown=${this.handleKeyDown}
      >
        <div part="handle" class="handle">
          <span></span><span></span><span></span>
        </div>
      </div>

      <div part="panel end" class="panel">
        <slot name="end"></slot>
      </div>
    `;
  }

  protected override updated() {
    // The grid track lives on the host, so it can't be set from the template.
    this.style.setProperty('--split-position', `${this.clamp(this.position)}%`);
  }

  private measure() {
    const size = this.isHorizontal ? this.clientWidth : this.clientHeight;
    if (size !== this.hostSize) {
      this.hostSize = size;
    }
  }

  /** Percent in, clamped percent out, honouring both panels' minimums. */
  private clamp(percent: number) {
    const available = this.available;
    if (available <= 0) {
      return Math.min(100, Math.max(0, percent));
    }

    let px = (percent / 100) * available;
    // Start's minimum wins when the two can't both be satisfied, so the pane
    // the user is dragging stays predictable in a cramped container.
    px = Math.min(px, available - this.endMin);
    px = Math.max(px, this.startMin);
    px = Math.min(Math.max(px, 0), available);

    return (px / available) * 100;
  }

  private setPosition(percent: number, dragging: boolean) {
    const next = this.clamp(percent);
    const changed = next !== this.position;
    this.position = next;

    if (changed || !dragging) {
      this.dispatchEvent(new YatlSplitPanelPositionEvent(next, dragging));
    }
  }

  private handlePointerDown = (event: PointerEvent) => {
    if (this.disabled || event.button !== 0) {
      return;
    }
    // Capture so the drag survives the pointer crossing into either panel,
    // over an iframe, or outside the window entirely.
    this.divider.setPointerCapture(event.pointerId);
    this.pointerId = event.pointerId;
    this.dragging = true;
    this.divider.focus();
    event.preventDefault();
  };

  private handlePointerMove = (event: PointerEvent) => {
    if (!this.dragging || event.pointerId !== this.pointerId) {
      return;
    }

    const rect = this.getBoundingClientRect();
    const available = this.available;
    if (available <= 0) {
      return;
    }

    const dividerSize = this.isHorizontal
      ? this.divider.offsetWidth
      : this.divider.offsetHeight;

    let offset = this.isHorizontal
      ? event.clientX - rect.left
      : event.clientY - rect.top;

    if (this.isHorizontal && getComputedStyle(this).direction === 'rtl') {
      offset = rect.width - offset;
    }

    // Centre the cursor on the handle rather than its leading edge.
    this.setPosition(((offset - dividerSize / 2) / available) * 100, true);
  };

  private handlePointerUp = (event: PointerEvent) => {
    if (!this.dragging || event.pointerId !== this.pointerId) {
      return;
    }
    this.dragging = false;
    this.pointerId = undefined;
    if (this.divider.hasPointerCapture(event.pointerId)) {
      this.divider.releasePointerCapture(event.pointerId);
    }
    // Final event with dragging:false — the one worth persisting.
    this.setPosition(this.position, false);
  };

  private handleDoubleClick = () => {
    if (this.disabled || this.defaultPosition === undefined) {
      return;
    }
    this.setPosition(this.defaultPosition, false);
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (this.disabled) {
      return;
    }

    const decrease = this.isHorizontal ? 'ArrowLeft' : 'ArrowUp';
    const increase = this.isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const step = event.shiftKey ? this.step * 5 : this.step;

    let next: number | undefined;
    if (event.key === decrease) {
      next = this.position - step;
    } else if (event.key === increase) {
      next = this.position + step;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = 100;
    } else if (event.key === 'Enter' && this.defaultPosition !== undefined) {
      next = this.defaultPosition;
    }

    if (next !== undefined) {
      event.preventDefault();
      this.setPosition(next, false);
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-split-panel': YatlSplitPanel;
  }

  interface GlobalEventHandlersEventMap {
    [YatlSplitPanelPositionEvent.EVENT_NAME]: YatlSplitPanelPositionEvent;
  }
}
