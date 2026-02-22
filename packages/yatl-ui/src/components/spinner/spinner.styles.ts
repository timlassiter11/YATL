import { css } from 'lit';

export default css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    --spinner-size: var(--yatl-spinner-size, 1em);
    --spinner-track-color: var(--yatl-spinner-track-color, currentColor);
    --spinner-indicator-color: var(
      --yatl-spinner-indicator-color,
      currentColor
    );
    --spinner-track-width: var(--yatl-spinner-track-width, 3px);
    --spinner-indicator-width: var(--yatl-spinner-indicator-width, 3px);
    /* Firefox requires a unit so use px */
    --spinner-indicator-length: var(--yatl--spinner-indicator-length, 25px);
    --spinner-transition-time: var(--yatl-spinner-transition-time, 0.3s);

    --check-width: var(--yatl-spinner-check-width, 2px);
    --check-color: var(--yatl-spinner-check-color, var(--yatl-color-success));

    --error-width: var(--yatl-spinner-error-width, 2px);
    --error-color: var(--yatl-spinner-error-color, var(--yatl-color-danger));

    width: var(--spinner-size);
    height: var(--spinner-size);
  }

  [part='base'] {
    width: 100%;
    height: 100%;
  }

  svg {
    width: 100%;
    height: 100%;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .icon {
    opacity: 0;
    transform-origin: center;
  }

  .spinner {
    scale: 0;
    transition: opacity var(--spinner-transition-time) linear,
      scale var(--spinner-transition-time) var(--ease-1);
  }

  .spinner.track {
    stroke: var(--spinner-track-color);
    stroke-width: var(--spinner-track-width);
  }

  .spinner.indicator {
    animation: spin 1s linear infinite;
    stroke: var(--spinner-indicator-color);
    stroke-width: var(--spinner-indicator-width);
    stroke-linecap: round;
    /* 
    * Because pathLength="100" is set on the SVG element, 
    * these numbers act as exact percentages! 
    * 25% colored stroke, 75% empty gap.
    */
    stroke-dasharray: var(--spinner-indicator-length)
      calc(100px - var(--spinner-indicator-length));
  }

  .check {
    stroke: var(--check-color);
    stroke-width: var(--check-width);
    stroke-dasharray: 100px;
    stroke-dashoffset: 100px;
    transition: opacity var(--spinner-transition-time) linear,
      scale var(--spinner-transition-time) var(--ease-1),
      stroke-dashoffset var(--spinner-transition-time) var(--ease-1);
  }

  .close {
    scale: 0;
    stroke: var(--error-color);
    stroke-width: var(--error-width);
    stroke-dasharray: 100px;
    stroke-dashoffset: 100px;
    transition: opacity var(--spinner-transition-time) linear,
      scale var(--spinner-transition-time) var(--ease-1),
      stroke-dashoffset var(--spinner-transition-time) var(--ease-1);
  }

  :host([state='loading']) {
    .track {
      opacity: 0.25;
      scale: 1;
    }

    .indicator {
      opacity: 1;
      scale: 1;
    }
  }

  :host([state='success']) {
    .check {
      opacity: 1;
      scale: 1;
      stroke-dashoffset: 0px;
      transition-delay: var(--spinner-transition-time);
    }
  }

  :host([state='error']) {
    .close {
      opacity: 1;
      scale: 1;
      stroke-dashoffset: 0px;
      animation: shake-x 1s linear;
      animation-delay: var(--spinner-transition-time);
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes shake-x {
    0%,
    100% {
      transform: translateX(0%);
    }
    20% {
      transform: translateX(min(-2%, -2px));
    }
    40% {
      transform: translateX(min(2%, 2px));
    }
    60% {
      transform: translateX(min(-2%, -2px));
    }
    80% {
      transform: translateX(min(2%, 2px));
    }
  }
`;
