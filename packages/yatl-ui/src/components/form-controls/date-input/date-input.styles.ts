import { css } from 'lit';

export default css`
  .footer {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    gap: var(--yatl-spacing-xs);
    padding-top: var(--yatl-spacing-m);
  }

  /* Clear on the left, away from Today */
  [part='clear-button'] {
    margin-inline-end: auto;
  }
`;
