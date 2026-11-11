import { css } from 'lit';

export default css`
  :host {
    --input-border-width: var(--yatl-input-border-width, 1px);
    --input-border-style: var(--yatl-input-border-style, solid);
    --input-border-color: var(
      --yatl-input-border-color,
      var(--yatl-border-color)
    );
    --input-radius: var(--yatl-input-radius, var(--yatl-radius-m));
    --input-padding: var(--yatl-input-padding, var(--yatl-size-padding));
    --input-font-size: var(--yatl-input-font-size, var(--yatl-size-font-size));
    --input-bg: var(--yatl-input-bg, var(--yatl-surface-lowered));
    --input-text: var(--yatl-input-text, var(--yatl-text-1));
    --input-line-height: var(
      --yatl-input-line-height,
      var(--yatl-size-line-height)
    );
    /* The same height as a button of the same size (see size.styles) */
    --input-height: var(
      --yatl-input-height,
      calc(
        var(--input-font-size) * var(--input-line-height) +
          var(--yatl-size-padding-block) * 2 + var(--input-border-width) * 2
      )
    );
    --input-outline-color: var(
      --yatl-input-outline-color,
      var(--yatl-color-brand)
    );
    --input-outline-width: var(--yatl-input-outline-width, 3px);
    --input-hint-text: var(--yatl-input-hint-text, var(--yatl-text-3));
    --input-hint-font-size: var(--yatl-input-hint-font-size, small);
    --input-error-text: var(--yatl-input-error-text, var(--yatl-color-danger));
    --input-error-font-size: var(--yatl-input-error-font-size, small);
    --input-placeholder-color: var(
      --yatl-input-placeholder-color,
      var(--yatl-text-2)
    );
    --input-count-text: var(--yatl-input-count-text, var(--yatl-text-3));
    --input-count-font-size: var(--yatl-input-count-font-size, small);

    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .base {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  /*
   * Inline puts the label beside the input instead of above it. The host
   * becomes a two column grid (label | input) so the hint and error line
   * up under the input - not under the label - whatever width the label is.
   * The label column is capped so a long label wraps rather than squeezing
   * the input out of the control.
   *
   * Checkable controls (checkbox, switch, radio) lay themselves out, with
   * the control before its label.
   */
  :host([inline]:not(:state(checkable))) {
    display: grid;
    grid-template-columns: fit-content(50%) minmax(0, 1fr);
    align-items: start;

    .base {
      display: grid;
      grid-column: 1 / -1;
      grid-template-columns: subgrid;
      align-items: start;
    }

    .base > :not(yatl-label) {
      grid-column: 2;
    }

    /* The label may be hidden, so the margin has to go with it. */
    yatl-label {
      margin-inline-end: var(--yatl-spacing-s);
    }

    [part='hint'],
    [part='error'],
    slot[name='hint']::slotted(*),
    slot[name='error']::slotted(*) {
      grid-column: 2;
    }
  }

  /** 
  * Concrete classes should apply this to the input element
  * or the element that is meant to look like the input.
  */
  .input {
    display: flex;
    flex-direction: row;
    gap: 0;

    box-sizing: border-box;
    border-width: var(--input-border-width);
    border-style: var(--input-border-style);
    border-color: var(--input-border-color);
    border-radius: var(--input-radius);
    color: var(--input-text);
    background-color: var(--input-bg);
    line-height: var(--input-line-height);
    font-size: var(--input-font-size);
    padding: var(--input-padding);
    width: 100%;
    height: var(--input-height);
    justify-content: center;
    align-items: center;
  }

  .input:focus,
  .input:focus-visible,
  .input:has(input:focus),
  .input:has(input:focus-visible) {
    outline: var(--input-outline-width) solid var(--input-outline-color);
    outline-offset: calc(var(--input-outline-width) * -1);
  }

  yatl-label:not(.has-label) {
    display: none;
  }

  :host(:not([inline])) yatl-label {
    margin-block-end: var(--yatl-spacing-s);
  }

  [part='label-count'] {
    color: var(--input-count-text);
    font-size: var(--input-count-font-size);
  }

  :host(:state(disabled)) {
    /* 
     * Without this, if a user drags a file from their computer 
     * and it starts on a disabled input, Firefox will just 
     * swallow the event and no drag operations will happen.
     */
    pointer-events: none;
    opacity: 0.6;
    cursor: not-allowed;
  }

  :host(:state(readonly)) {
    opacity: 0.8;
  }

  :host(:state(disabled)) .input:focus,
  :host(:state(readonly)) .input:focus,
  :host(:state(disabled)) .input:focus-visible,
  :host(:state(readonly)) .input:focus-visible {
    outline: none;
  }

  textarea,
  input,
  #input {
    height: 100%;

    width: 100%;
    min-width: 0;

    flex: 1 1 0%;

    box-sizing: border-box;

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

  /*
   * Text inputs never wrap, so an overflowing value is silently clipped
   * with no indication there's more to see. Truncate with an ellipsis
   * instead so overflow is visible, and consumers can rely on a title
   * attribute (set per-component) to reveal the full value on hover
   * without ever changing the control's size.
   */
  input {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  [part='hint'] {
    color: var(--input-hint-text);
    font-size: var(--input-hint-font-size);
    padding-top: var(--yatl-spacing-s);
  }

  slot[name='hint']:not(.has-hint) {
    display: none;
  }

  [part='error'] {
    color: var(--input-error-text);
    font-size: var(--input-error-font-size);
  }

  [part='error']:not(.has-error) {
    display: none;
  }

  .input-start,
  .input-end {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    cursor: default;
  }

  input::placeholder {
    color: var(--input-placeholder-color);
  }
`;
