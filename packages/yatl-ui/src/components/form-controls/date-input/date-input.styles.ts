import { css } from 'lit';

export default css`
  /*
   * These have to be #input to beat the shared #input rule. That rule
   * stretches the element to the full height of the box, which pins a single
   * line of text to the top of it, so size it to its text instead and let the
   * box's align-items: center do the centering.
   */
  #input {
    height: auto;
    text-align: start;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  #input.has-placeholder {
    color: var(--input-placeholder-color);
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
    .input {
      opacity: 1;
    }

    button {
      opacity: 0.8;
      pointer-events: none;
    }
  }
`;
