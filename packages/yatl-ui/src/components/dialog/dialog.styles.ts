import { css } from 'lit';

export default css`
  :host {
    --dialog-bg: var(--yatl-dialog-bg, var(--yatl-surface-3));
    --dialog-text: var(--yatl-dialog-text, var(--yatl-text-1));
    --dialog-radius: var(--yatl-dialog-radius, var(--yatl-radius-l));
    --dialog-border-width: var(--yatl-dialog-border-width, 1px);
    --dialog-border-style: var(--yatl-dialog-border-style, solid);
    --dialog-border-color: var(
      --yatl-dialog-border-color,
      var(--yatl-border-color-strong)
    );
    --dialog-padding: var(--yatl-dialog-padding, var(--yatl-spacing-s));
    --dialog-margin: var(--yatl-dialog-margin, var(--yatl-spacing-l));
    --dialog-header-font-size: var(--yatl-dialog-header-font-size, medium);
    --dialog-header-font-weight: var(--yatl-dialog-header-font-weight, 700);
    --dialog-header-padding: var(
      --yatl-dialog-header-padding,
      var(--yatl-spacing-m)
    );
    --dialog-body-padding: var(
      --yatl-dialog-body-padding,
      var(--yatl-spacing-l)
    );

    --dialog-footer-actions-gap: var(
      --yatl-dialog-footer-actions-gap,
      var(--yatl-spacing-s)
    );

    --dialog-show-duration: var(--yatl-dialog-show-duration, 250ms);
    --dialog-hide-duration: var(--yatl-dialog-hide-duration, 250ms);
    --dialog-pulse-duration: var(--yatl-dialog-pulse-duration, 250ms);

    display: contents;
  }

  dialog {
    border: none;
    background: none;
    flex-direction: column;

    padding: var(--dialog-margin);

    &.show {
      display: flex;
      animation: show-dialog var(--dialog-show-duration) ease;

      &::backdrop {
        animation: show-backdrop var(--dialog-show-duration) ease;
      }
    }

    &.hide {
      animation: show-dialog var(--dialog-hide-duration) ease reverse;

      &::backdrop {
        animation: show-backdrop var(--dialog-hide-duration) ease reverse;
      }
    }

    &.pulse {
      animation: pulse var(--dialog-pulse-duration) ease;
    }
  }

  dialog[open] {
    display: flex;
  }

  dialog:focus-visible {
    outline: none;
  }

  dialog::backdrop {
    background-color: color-mix(in oklab, black 60%, transparent);
  }

  :host([fullscreen]) dialog {
    width: 100vw !important;
    max-width: 100vw;
    height: 100vh !important;
    max-height: 100vh;
    padding: 0;
    margin: 0;
  }

  yatl-card {
    --card-bg: var(--dialog-bg);
    --card-text: var(--dialog-text);
    --card-border-radius: var(--dialog-radius);
    --card-border-width: var(--dialog-border-width);
    --card-border-style: var(--dialog-border-style);
    --card-border-color: var(--dialog-border-color);
    --card-header-font-size: var(--dialog-header-font-size);
    --card-header-font-weight: var(--dialog-header-font-weight);
    --card-header-padding: var(--dialog-header-padding);

    flex: 1;
    overflow: hidden;
    padding: var(--dialog-padding);
  }

  :host([fullscreen]) yatl-card {
    --card-border-radius: 0;
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
    gap: var(--dialog-footer-actions-gap);
  }

  [part='body'] {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    padding: var(--dialog-body-padding);
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

  @keyframes show-dialog {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
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
