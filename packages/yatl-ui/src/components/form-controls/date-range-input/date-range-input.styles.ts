import { css } from 'lit';

export default css`
  yatl-input[part='input']::part(start) {
    flex-grow: 1;
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: var(--yatl-spacing-xs);
  }

  .footer {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-evenly;
    gap: var(--yatl-spacing-xs);
    padding-top: var(--yatl-spacing-m);
  }

  .footer > *:first-child {
    margin-right: auto;
  }
`;
