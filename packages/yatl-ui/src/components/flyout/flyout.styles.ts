import { css } from 'lit';

export default css`
  :host {
    --flyout-bg: var(--yatl-flyout-bg, var(--yatl-surface-3));
    --flyout-text: var(--yatl-flyout-text, var(--yatl-text-1));
    --flyout-radius: var(--yatl-flyout-radius, 0);
    --flyout-border-width: var(--yatl-flyout-border-width, 1px);
    --flyout-border-style: var(--yatl-flyout-border-style, solid);
    --flyout-border-color: var(
      --yatl-flyout-border-color,
      var(--yatl-border-color-strong)
    );
    --flyout-padding: var(--yatl-flyout-padding, var(--yatl-spacing-s));
    --flyout-size: var(--yatl-flyout-size, 320px);
    --flyout-header-font-size: var(--yatl-flyout-header-font-size, medium);
    --flyout-header-font-weight: var(--yatl-flyout-header-font-weight, 700);
    --flyout-header-padding: var(
      --yatl-flyout-header-padding,
      var(--yatl-spacing-m)
    );
    --flyout-body-padding: var(
      --yatl-flyout-body-padding,
      var(--yatl-spacing-l)
    );

    --flyout-footer-actions-gap: var(
      --yatl-flyout-footer-actions-gap,
      var(--yatl-spacing-s)
    );

    --flyout-show-duration: var(--yatl-flyout-show-duration, 250ms);
    --flyout-hide-duration: var(--yatl-flyout-hide-duration, 250ms);
    --flyout-pulse-duration: var(--yatl-flyout-pulse-duration, 250ms);

    display: contents;
  }

  :host([placement='end']) {
    --flyout-offset-x: 100%;
    --flyout-offset-y: 0;
  }

  :host([placement='start']) {
    --flyout-offset-x: -100%;
    --flyout-offset-y: 0;
  }

  :host([placement='top']) {
    --flyout-offset-x: 0;
    --flyout-offset-y: -100%;
  }

  :host([placement='bottom']) {
    --flyout-offset-x: 0;
    --flyout-offset-y: 100%;
  }

  dialog {
    position: fixed;
    margin: 0;
    border: none;
    background: none;
    padding: 0;
    display: none;

    /*
     * Unlike yatl-dialog, this box isn't centered/fit-content, so it's sized
     * and positioned per-placement below rather than relying on the native
     * dialog defaults. It's deliberately sized to match the card exactly
     * (not the full viewport) so it doesn't swallow clicks meant for other
     * popovers/dialogs opened on top of it — the .backdrop div below is
     * what catches clicks anywhere else, same as yatl-dialog.
     */

    &.show {
      display: flex;
      animation: show-flyout var(--flyout-show-duration) ease;
      animation-fill-mode: both;
    }

    &.hide {
      animation: show-flyout var(--flyout-hide-duration) ease reverse;
      animation-fill-mode: both;
    }

    &.pulse {
      animation: pulse var(--flyout-pulse-duration) ease;
    }
  }

  /*
   * The browser's default popover styling sets inset: 0 on all four sides.
   * We only want to pin the sides relevant to the placement, so the
   * opposite side of each axis has to be explicitly cleared back to auto
   * or the box ends up over-constrained (and browsers resolve that by
   * favoring the UA's left/top over the inline-end/block-end we set here).
   */
  :host([placement='start']) dialog,
  :host([placement='end']) dialog {
    inset-block: 0;
    inline-size: var(--flyout-size);
    block-size: auto;
  }

  :host([placement='start']) dialog {
    inset-inline-start: 0;
    inset-inline-end: auto;
  }

  :host([placement='end']) dialog {
    inset-inline-start: auto;
    inset-inline-end: 0;
  }

  :host([placement='top']) dialog,
  :host([placement='bottom']) dialog {
    inset-inline: 0;
    block-size: var(--flyout-size);
    inline-size: auto;
  }

  :host([placement='top']) dialog {
    inset-block-start: 0;
    inset-block-end: auto;
  }

  :host([placement='bottom']) dialog {
    inset-block-start: auto;
    inset-block-end: 0;
  }

  :host([fullscreen]) dialog {
    inline-size: 100dvw !important;
    block-size: 100dvh !important;
  }

  :host([fullscreen]) yatl-card {
    --card-border-radius: 0;
  }

  dialog::backdrop {
    display: none !important;
  }

  dialog[popover]:popover-open {
    display: flex;
  }

  dialog:focus-visible {
    outline: none;
  }

  .backdrop {
    opacity: 0;
    pointer-events: none;
    display: block;
    position: fixed;
    inset: 0;
    z-index: 999;
    background-color: color-mix(in oklab, black 60%, transparent);
  }

  :host([open]) .backdrop {
    opacity: 1;
    animation: show-backdrop var(--flyout-show-duration) ease;
    animation-fill-mode: both;
    pointer-events: auto;
  }

  yatl-card {
    --card-bg: var(--flyout-bg);
    --card-text: var(--flyout-text);
    --card-border-radius: var(--flyout-radius);
    --card-border-width: var(--flyout-border-width);
    --card-border-style: var(--flyout-border-style);
    --card-border-color: var(--flyout-border-color);
    --card-header-font-size: var(--flyout-header-font-size);
    --card-header-font-weight: var(--flyout-header-font-weight);
    --card-header-padding: var(--flyout-header-padding);

    z-index: 2;
    overflow: hidden;
    padding: var(--flyout-padding);
    width: 100%;
    height: 100%;
  }

  [part='header'] {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  [part='label'] {
    margin: 0;
  }

  [part='header-actions'],
  [part='footer-actions'] {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
  }

  [part='footer-actions'] {
    gap: var(--flyout-footer-actions-gap);
  }

  [part='body'] {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    padding: var(--flyout-body-padding);
  }

  @keyframes pulse {
    0% {
      scale: 1;
    }
    50% {
      scale: 1.02;
    }
    100% {
      scale: 1;
    }
  }

  @keyframes show-flyout {
    from {
      opacity: 0;
      transform: translate(
        var(--flyout-offset-x, 0),
        var(--flyout-offset-y, 0)
      );
    }
    to {
      opacity: 1;
      transform: translate(0, 0);
    }
  }

  @keyframes show-backdrop {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;
