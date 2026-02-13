import { css } from 'lit';

export default css`
  :host {
    --input-count-text: var(--yatl-input-count-text, var(--yatl-text-3));
    --input-count-font-size: var(--yatl-input-count-font-size, small);
  }

  .label-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: baseline;
  }

  .label-spacer {
    flex-grow: 1;
  }

  [part='label-count'] {
    color: var(--input-count-text);
    font-size: var(--input-count-font-size);
  }
`;
