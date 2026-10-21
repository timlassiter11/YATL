import { css } from 'lit';

export default css`
  #input {
    flex-grow: 1;
    text-align: start;
  }

  .has-placeholder {
    color: var(--input-placeholder-color);
  }

  .value {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

  :host(:state(readonly)) {
    .text-input {
      opacity: 1;
    }

    button {
      opacity: 0.8;
      pointer-events: none;
    }
  }
`;
