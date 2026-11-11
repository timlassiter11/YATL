import { css } from 'lit';

export default css`
  .list-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin-inline-start: var(--yatl-spacing-xs);
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;
    font: inherit;
  }

  .list-button:disabled {
    cursor: default;
    opacity: 0.8;
  }

  .list-button:focus-visible {
    outline: var(--input-outline-width) solid var(--input-outline-color);
    border-radius: var(--yatl-radius-s, 3px);
  }

  yatl-dropdown::part(menu) {
    max-height: 18rem;
    overflow-y: auto;
  }
`;
