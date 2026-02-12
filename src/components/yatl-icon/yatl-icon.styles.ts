import { css } from 'lit';

export default css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1em;
    height: 1em;
    color: inherit;
    flex-shrink: 0;
  }

  svg {
    width: 100%;
    height: 100%;

    fill: none;
    stroke: currentColor;
    stroke-width: var(--icon-stroke-width, 2px);
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;
