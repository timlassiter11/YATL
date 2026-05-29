import { css } from 'lit';

export default css`
  :host {
    display: block;
    box-sizing: border-box;

    color: var(--yatl-input-label-text, var(--yatl-text-1));
    font-size: var(--yatl-input-label-font-size, large);
    font-weight: var(--yatl-input-label-font-weight, 700);
  }
`;
