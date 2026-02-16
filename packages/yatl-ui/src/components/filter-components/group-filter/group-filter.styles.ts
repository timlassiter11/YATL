import { css } from 'lit';

export default css`
  :host {
    --input-label-text: var(--yatl-input-label-text, var(--yatl-text-1));
    --input-label-font-size: var(--yatl-input-label-font-size, large);
    --input-label-font-weight: var(--yatl-input-label-font-weight, 700);
  }

  [part='label'] {
    display: block;
    margin-bottom: var(--yatl-spacing-s);

    color: var(--input-label-text);
    font-size: var(--input-label-font-size);
    font-weight: var(--input-label-font-weight);
  }

  [part='group'] {
    display: flex;
    flex-direction: column;
    gap: var(--yatl-radio-group-gap, var(--yatl-spacing-s));
  }
`;
