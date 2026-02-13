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
    --spinner-indicator-length: var(--yatl--spinner-indicator-length, 25);

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
    animation: spin 1s linear infinite;
  }

  [part='track'] {
    stroke: var(--spinner-track-color);
    stroke-width: var(--spinner-track-width);
    opacity: 0.25;
  }

  [part='indicator'] {
    stroke: var(--spinner-indicator-color);
    stroke-width: var(--spinner-indicator-width);
    stroke-linecap: round;

    /* Because pathLength="100" is set on the SVG element, 
        these numbers act as exact percentages! 
        25% colored stroke, 75% empty gap.
      */
    stroke-dasharray: var(--spinner-indicator-length)
      calc(100 - var(--spinner-indicator-length));
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
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
`;
