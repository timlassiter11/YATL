import { css } from 'lit';

export default css`
  /*
   * #input to beat the shared #input rule, which stretches it to the full
   * height of the box. Size it to its text and let the box center it.
   */
  #input {
    height: auto;
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow: hidden;
    font-variant-numeric: tabular-nums;
  }

  #input.has-placeholder {
    color: var(--input-placeholder-color);
    outline: none;
  }

  .segment {
    padding: 0 1px;
    border-radius: var(--yatl-radius-s, 3px);
    caret-color: transparent;
    outline: none;
  }

  .segment.empty {
    color: var(--input-placeholder-color);
  }

  .segment:focus {
    background-color: var(--input-outline-color);
    color: var(--input-text);
  }

  .literal {
    color: var(--input-placeholder-color);
    padding: 0 1px;
  }

  /* The box shows focus while any part has it */
  .input:has(.segments:focus-within) {
    outline: var(--input-outline-width) solid var(--input-outline-color);
    outline-offset: calc(var(--input-outline-width) * -1);
  }

  :host(:state(disabled)) .input:has(.segments:focus-within),
  :host(:state(readonly)) .input:has(.segments:focus-within) {
    outline: none;
  }

  /* The icon button at the end that opens a picker, e.g. a calendar */
  .trigger-button {
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

  .trigger-button:disabled {
    cursor: default;
    opacity: 0.8;
  }

  .trigger-button:focus-visible {
    outline: var(--input-outline-width) solid var(--input-outline-color);
    border-radius: var(--yatl-radius-s, 3px);
  }
`;
