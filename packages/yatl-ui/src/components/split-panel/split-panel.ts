import { html, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { YatlSplitPanelPositionEvent } from '../../events/split-panel';
import { YatlBase } from '../base/base';
import styles from './split-panel.styles';

export type SplitPanelOrientation = 'horizontal' | 'vertical';
export type SplitPanelSizePolicy = 'ratio' | 'fixed';

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
  public static override styles = [...super.styles, styles];

  /** `horizontal` = panels side by side. `vertical` = panels stacked. */
  @property({ reflect: true })
  public orientation: SplitPanelOrientation = 'horizontal';

  /**
   * The size policy to use for the split
   * `ratio` = precentage
   * `fixed` = pixels
   * @attr size-policy
   */
  @property({ type: String, attribute: 'size-policy' })
  public sizePolicy: SplitPanelSizePolicy = 'ratio';

  /** Start panel size either in px or percentage based on the size policy */
  @property({ type: Number })
  public position = 50;

  /**
   * Smallest the start panel may get, in pixels.
   * @attr start-min
   */
  @property({ type: Number, attribute: 'start-min' })
  public startMin = 0;

  /**
   * Smallest the end panel may get, in pixels.
   * @attr end-min
   */
  @property({ type: Number, attribute: 'end-min' })
  public endMin = 0;

  /**
   * Position restored on double-click. Defaults to the initial `position`.
   * @attr default-position
   */
  @property({ type: Number, attribute: 'default-position' })
  public defaultPosition?: number;

  /** Keyboard step, in percent. Shift multiplies it by 5. */
  @property({ type: Number })
  public step = 2;

  @property({ type: Boolean, reflect: true })
  public disabled = false;

  /**
   * The aria label for the divider
   * @attr divider-label
   */
  @property({ attribute: 'divider-label' })
  public dividerLabel = 'Resize panels';

  @property({ type: Boolean, reflect: true })
  private dragging = false;

  @query('.divider')
  private divider!: HTMLDivElement;

  private pointerId?: number;

  private get isHorizontal() {
    return this.orientation === 'horizontal';
  }

  private get hostSize() {
    return this.isHorizontal ? this.clientWidth : this.clientHeight;
  }

  /** Space the panels actually share, with the divider track taken out. */
  private get available() {
    const divider = this.isHorizontal
      ? this.divider?.offsetWidth
      : this.divider?.offsetHeight;
    return Math.max(this.hostSize - (divider ?? 0), 0);
  }

  private get clampedPosition() {
    return this.clamp(this.position);
  }

  protected override willUpdate(changedProps: PropertyValues<this>) {
    super.willUpdate(changedProps);

    if (!this.hasUpdated) {
      this.defaultPosition ??= this.position;
    }

    const oldPolicy = changedProps.get('sizePolicy');
    if (oldPolicy) {
      // Size policy changed, make sure the position matches.
      const position = this.normalizePosition(
        this.position,
        oldPolicy,
        this.sizePolicy,
      );
      this.setPosition(position, false);
      if (this.defaultPosition != null) {
        this.defaultPosition = this.normalizePosition(
          this.defaultPosition,
          oldPolicy,
          this.sizePolicy,
        );
      }
    }
  }

  protected override render() {
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
        aria-valuenow=${Math.round(this.clampedPosition)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-disabled=${this.disabled ? 'true' : 'false'}
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
    const units = this.sizePolicy === 'ratio' ? '%' : 'px';
    this.style.setProperty(
      '--split-position',
      `${this.clampedPosition}${units}`,
    );
  }

  /** Percent or pixels in based on size policy,
   * clamped percent out, honouring both panels' minimums. */
  private clamp(position: number) {
    const available = this.available;
    const percent = this.normalizePosition(position, this.sizePolicy, 'ratio');

    let clamped;
    if (available <= 0) {
      clamped = Math.min(100, Math.max(0, percent));
    } else {
      let px = (percent / 100) * available;
      // Start's minimum wins when the two can't both be satisfied, so the pane
      // the user is dragging stays predictable in a cramped container.
      px = Math.min(px, available - this.endMin);
      px = Math.max(px, this.startMin);
      px = Math.min(Math.max(px, 0), available);
      clamped = (px / available) * 100;
    }

    if (this.sizePolicy === 'fixed') {
      clamped = (clamped / 100) * available;
    }

    return clamped;
  }

  private setPosition(position: number, dragging: boolean) {
    const next = this.clamp(position);
    const changed = next !== this.position;
    this.position = next;

    if (changed || !dragging) {
      this.dispatchEvent(new YatlSplitPanelPositionEvent(next, dragging));
    }
  }

  private normalizePosition(
    value: number,
    input: SplitPanelSizePolicy,
    output: SplitPanelSizePolicy,
  ) {
    if (input === output) {
      return value;
    } else if (input === 'ratio') {
      return (value / 100) * this.available;
    } else {
      return (value * 100) / this.available;
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
    const percent = ((offset - dividerSize / 2) / available) * 100;
    const position = this.normalizePosition(percent, 'ratio', this.sizePolicy);
    this.setPosition(position, true);
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
    const percent = this.normalizePosition(
      this.position,
      this.sizePolicy,
      'ratio',
    );

    let next: number | undefined;
    if (event.key === decrease) {
      next = percent - step;
    } else if (event.key === increase) {
      next = percent + step;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = 100;
    } else if (event.key === 'Enter' && this.defaultPosition !== undefined) {
      next = this.defaultPosition;
    }

    if (next !== undefined) {
      event.preventDefault();
      next = this.normalizePosition(next, 'ratio', this.sizePolicy);
      this.setPosition(next, false);
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-split-panel': YatlSplitPanel;
  }
}
