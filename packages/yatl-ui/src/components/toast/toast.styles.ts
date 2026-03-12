import { css } from 'lit';

export default css`
  :host {
    --toast-bg: var(--yatl-toast-bg, var(--yatl-surface-2));
    --toast-radius: var(--yatl-toast-radius, var(--yatl-radius-m));
    --toast-border-width: var(--yatl-toast-border-width, 1px);
    --toast-border-style: var(--yatl-toast-border-style, solid);
    --toast-border-color: var(
      --yatl-toast-border-color,
      var(--yatl-border-color)
    );
    --toast-width: var(--yatl-toast-width, 300px);
    --toast-max-width: var(--yatl-toast-max-width, 480px);
    --toast-timer-height: var(--yatl-toast-timer-height, 2px);
    --toast-padding: var(--yatl-toast-padding, var(--yatl-spacing-s));

    --toast-show-animation-duration: var(
      --yatl-toast-show-animation-duration,
      0.25s
    );
    --toast-hide-animation-duration: var(
      --yatl-toast-hide-animation-duration,
      0.5s
    );

    position: relative;
    pointer-events: all;

    padding: 0;
    width: var(--toast-width);
    max-width: var(--toast-max-width);
    max-height: 100vh;
    background-color: var(--toast-bg);
    border-radius: var(--toast-radius);
    border-width: var(--toast-border-width);
    border-style: var(--toast-border-style);
    border-color: var(--toast-border-color);

    will-change: transform;
    animation: slide-in;
    animation-duration: var(--toast-show-animation-duration);
    animation-timing-function: var(--ease-elastic-out-5);
  }

  :host(.closing) {
    animation: fade-and-collapse;
    animation-duration: var(--toast-hide-animation-duration);
    animation-timing-function: ease-in;
    animation-fill-mode: forwards;
  }

  :host(:hover) [part='timer'] {
    animation-play-state: paused;
  }

  [part='base'] {
    display: flex;
    flex-direction: column;
    gap: var(--yatl-spacing-xs);
  }

  [part='label-row'] {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--yatl-spacing-s);
    border-bottom: 1px solid var(--toast-border-color);
    padding: var(--toast-padding);
  }

  [part='base']:not(.has-label) {
    /* We put the message in the label-row when there is no label */
    [part='message'] {
      display: none;
    }

    [part='label-row'] {
      border-bottom: none;
    }
  }

  [part='label'] {
    flex-grow: 1;
  }

  [part='close'] {
    flex: 0 0 0%;
  }

  [part='message'] {
    padding: var(--toast-padding);
  }

  :host(:not([duration])) [part='timer'],
  :host([duration='0']) [part='timer'] {
    display: none;
  }

  [part='timer'] {
    width: 0;
    height: 100%;
    background-color: var(--yatl-color-brand);
    border-radius: var(--toast-radius);
  }

  [part='timer']:not(.running) {
    display: none;
  }

  [part='timer'].running {
    animation: toast-timer;
    animation-duration: var(--duration);
  }

  .timer-wrapper {
    width: 100%;
    height: var(--toast-timer-height);
  }

  [part='base']:not(.has-message) {
    yatl-divider {
      display: none;
    }
    [part='message'] {
      display: none;
    }
  }

  :host(:not([variant])) [part='status-icon'],
  :host([variant='neutral']) [part='status-icon'] {
    display: none;
  }

  :host([variant='success']) [part='status-icon'] {
    color: var(--yatl-color-success);
  }

  :host([variant='warning']) [part='status-icon'] {
    color: var(--yatl-color-warning);
  }

  :host([variant='danger']) [part='status-icon'] {
    color: var(--yatl-color-danger);
  }

  @keyframes slide-in {
    from {
      transform: translateX(calc(100%));
    }
  }

  @keyframes fade-and-collapse {
    0% {
      opacity: 1;
      max-height: 200px;
    }
    50% {
      opacity: 0.5;
      max-height: 200px;
    }
    100% {
      opacity: 0;
      max-height: 0;
    }
  }

  @keyframes toast-timer {
    from {
      width: 100%;
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    to {
      width: 1%;
      opacity: 0;
    }
  }
`;
