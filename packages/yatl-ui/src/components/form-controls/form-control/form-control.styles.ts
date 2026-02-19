import { css } from 'lit';

export default css`
  :host {
    --input-radius: var(--yatl-input-radius, var(--yatl-radius-m));
    --input-padding: var(--yatl-input-padding, var(--yatl-spacing-m));
    --input-bg: var(--yatl-input-bg, var(--yatl-surface-2));
    --input-text: var(--yatl-input-text, var(--yatl-text-1));
    --input-line-height: var(--yatl-input-line-height, 1.2);
    --input-min-height: var(
      --yatl-input-min-height,
      round(
        calc(2 * var(--input-padding) + 1em * var(--input-line-height)),
        1px
      )
    );
    --input-outline-color: var(
      --yatl-input-outline-color,
      var(--yatl-color-brand)
    );
    --input-outline-width: var(--yatl-input-outline-width, 3px);
    --input-label-text: var(--yatl-input-label-text, var(--yatl-text-1));
    --input-label-font-size: var(--yatl-input-label-font-size, large);
    --input-label-font-weight: var(--yatl-input-label-font-weight, 700);

    --input-hint-text: var(--yatl-input-hint-text, var(--yatl-text-3));
    --input-hint-font-size: var(--yatl-input-hint-font-size, small);
    --input-error-text: var(--yatl-input-error-text, var(--yatl-color-danger));
    --input-error-font-size: var(--yatl-input-error-font-size, small);
    --input-placeholder-color: var(
      --yatl-input-placeholder-color,
      var(--yatl-text-2)
    );

    display: flex;
    flex-direction: column;
  }

  :host([inline]) {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--yatl-spacing-s);
  }

  /** 
  * Concrete classes should apply this to the input element
  * or the element that is meant to look like the input.
  */
  .text-input {
    display: flex;
    flex-direction: row;
    gap: 0;

    box-sizing: border-box;
    border-radius: var(--input-radius);
    color: var(--input-text);
    background-color: var(--input-bg);
    line-height: var(--input-line-height);
    border: none;
    font-size: large;
    padding: var(--input-padding);
    width: 100%;
    min-height: var(--input-min-height);
    justify-content: center;
  }

  .text-input:focus,
  .text:focus-visible,
  .text-input:has(input:focus),
  .text-input:has(input:focus-visible) {
    outline: var(--input-outline-width) solid var(--input-outline-color);
    outline-offset: calc(var(--input-outline-width) * -1);
  }

  [part='label'] {
    color: var(--input-label-text);
    font-size: var(--input-label-font-size);
    font-weight: var(--input-label-font-weight);
  }

  [part='label']:not(.has-label) {
    display: none;
  }

  :host(:not([inline])) [part='label'] {
    margin-block-end: var(--yatl-spacing-s);
  }

  :host(:state(disabled)) .text-input {
    cursor: not-allowed;
    opacity: 0.6;
  }

  :host(:state(readonly)) .text-input {
    opacity: 0.8;
  }

  :host(:state(disabled)) .text-input:focus,
  :host(:state(readonly)) .text-input:focus,
  :host(:state(disabled)) .text-input:focus-visible,
  :host(:state(readonly)) .text-input:focus-visible {
    outline: none;
  }

  textarea,
  input {
    height: 100%;
    min-width: 0px;
    flex: 1 1 auto;

    margin: 0px;
    padding: 0px;
    padding-block: 0px;

    border: none;
    outline: none;
    box-shadow: none;

    color: inherit;
    background-color: transparent;
    appearance: none;

    cursor: inherit;
    font: inherit;
    transition: inherit;
  }

  [part='hint'] {
    color: var(--input-hint-text);
    font-size: var(--input-hint-font-size);
  }

  [part='hint']:not(.has-hint) {
    display: none;
  }

  [part='error'] {
    color: var(--input-error-text);
    font-size: var(--input-error-font-size);
  }

  [part='error']:not(.has-error) {
    display: none;
  }

  [part='start'],
  [part='end'] {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    cursor: default;
  }

  input::placeholder {
    color: var(--input-placeholder-color);
  }
`;
