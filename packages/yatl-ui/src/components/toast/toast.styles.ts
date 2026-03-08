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
    --toast-padding: var(--yatl-toast-padding, var(--yatl-spacing-l));

    position: relative;
    pointer-events: all;

    padding: var(--toast-padding);
    width: var(--toast-width);
    max-width: var(--toast-max-width);
    background-color: var(--toast-bg);
    border-radius: var(--toast-radius);
    border-width: var(--toast-border-width);
    border-style: var(--toast-border-style);
    border-color: var(--toast-border-color);

    will-change: transform;
    animation: slide-in 0.25s var(--ease-elastic-out-5);
    interpolate-size: allow-keywords;
  }

  :host(.closing) {
    animation: fade-and-collapse 0.4s ease-in forwards;
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
  }

  [part='label'] {
    flex-grow: 1;
  }

  [part='close'] {
    flex: 0 0 0%;
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
      height: auto;
    }
    50% {
      opacity: 0;
      height: auto;
    }

    100% {
      opacity: 0;
      height: 0;
      border: none;
    }
  }

  @keyframes toast-timer {
    from {
      width: 100%;
      opacity: 1;
    }
    80% {
      opacity: 1;
    }
    to {
      width: 1%;
      opacity: 0;
    }
  }
`;
