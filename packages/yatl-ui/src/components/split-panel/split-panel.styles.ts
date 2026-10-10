import { css } from 'lit';

export default css`
  :host {
    display: grid;
    overflow: hidden;
    min-width: 0;
    min-height: 0;
    --divider-size: var(--yatl-split-panel-divider-size, 12px);
    --handle-length: var(--yatl-split-panel-handle-length, 24px);
    --handle-thickness: var(--yatl-split-panel-handle-thickness, 9px);
    --handle-grip: var(--yatl-split-panel-handle-color, var(--yatl-text-3));
    --hover-thickness: var(--yatl-split-panel-hover-thickness, 6px);
  }

  :host([orientation='horizontal']) {
    grid-template-columns: var(--split-position) var(--divider-size) 1fr;
    grid-template-rows: 100%;
  }

  :host([orientation='vertical']) {
    grid-template-rows: var(--split-position) var(--divider-size) 1fr;
    grid-template-columns: 100%;
  }

  /* min-width/height 0 lets a scrolling child actually shrink. */
  .panel {
    overflow: hidden;
    min-width: 0;
    min-height: 0;
    display: flex;
  }

  .panel ::slotted(*) {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
  }

  .divider {
    position: relative;
    display: grid;
    place-items: center;
    /* Required: without it the browser scrolls instead of dragging on touch. */
    touch-action: none;
    background: transparent;
    border: 0;
    padding: 0;
  }

  :host([orientation='horizontal']) .divider {
    cursor: col-resize;
  }

  :host([orientation='vertical']) .divider {
    cursor: row-resize;
  }

  :host([disabled]) .divider {
    cursor: default;
  }

  .divider::after {
    content: '';
    position: absolute;
    transition: 200ms background-color;
    border-radius: 999px;
  }

  :host([orientation='horizontal']) .divider::after {
    width: min(var(--hover-thickness), var(--divider-size));
    height: 100%;
  }

  :host([orientation='vertical']) .divider::after {
    height: min(var(--hover-thickness), var(--divider-size));
    width: 100%;
  }

  :host([dragging]) .divider::after,
  .divider:hover::after {
    background-color: var(--yatl-color-brand);
    background-color: color-mix(
      in srgb,
      var(--yatl-color-brand),
      transparent 60%
    );
  }

  .handle {
    position: relative;
    display: grid;
    place-items: center;
    border-radius: 999px;
    box-sizing: border-box;
    transition: border-color 120ms ease, background-color 120ms ease;
  }

  :host([orientation='horizontal']) .handle {
    grid-auto-flow: row;
    width: var(--handle-thickness);
    height: var(--handle-length);
  }

  :host([orientation='vertical']) .handle {
    grid-auto-flow: column;
    height: var(--handle-thickness);
    width: var(--handle-length);
  }

  .handle span {
    width: 2px;
    height: 2px;
    border-radius: 50%;
    background: var(--handle-grip);
  }

  .divider:focus-visible {
    outline: none;
  }

  :host([disabled]) .handle {
    display: none;
  }

  :host([dragging]) .panel {
    user-select: none;
    pointer-events: none;
  }
`;
