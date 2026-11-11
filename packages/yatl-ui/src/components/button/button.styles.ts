import { css } from 'lit';

export default css`
  :host {
    --button-border-style: var(--yatl-button-border-style, solid);
    --button-radius: var(--yatl-button-radius, var(--yatl-radius-s));
    /* Text needs more room at the sides than above and below. An icon on
       its own gets the block padding all round, so it stays square. */
    --button-padding: var(--yatl-button-padding, var(--yatl-size-padding));
    --button-icon-padding: var(
      --yatl-button-padding,
      var(--yatl-size-padding-block)
    );
    --button-font-size: var(
      --yatl-button-font-size,
      var(--yatl-size-font-size)
    );
    --button-hover-bg: var(
      --yatl-button-hover-bg,
      color-mix(in srgb, var(--yatl-color-mix) 10%, var(--button-bg))
    );

    /* The color prop sets these and the variant prop decides how to use it */
    --appearance-text: currentColor;
    --appearance-color: var(--yatl-color-neutral);

    --button-text: var(--yatl-button-text, var(--appearance-text));
    --button-bg: var(--yatl-button-bg, var(--appearance-color));
    /* Every button has a border, transparent unless it's an outline, so
       all variants are the same height as an input of the same size */
    --button-border-width: var(
      --yatl-button-border-width,
      var(--yatl-size-border-width)
    );
    --button-border-color: var(--yatl-button-border, transparent);

    color: var(--yatl-text-1);
    font-weight: 500;
    font-size: var(--button-font-size);
    line-height: var(--yatl-size-line-height);
    display: inline-block;
    box-sizing: border-box;
    overflow: hidden;
    /* The background is on the host so it shows under a clear border */
    background-color: var(--button-bg);
    border: var(--button-border-width) solid var(--button-border-color);
    border-radius: var(--button-radius);
    position: relative;
  }

  :host(:state(icon-only)) {
    --button-padding: var(--button-icon-padding);
  }

  [part='base'] {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    cursor: pointer;
    padding: var(--button-padding);
    color: var(--button-text);
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
    background: none;
    border: none;
  }

  [part='contents'] {
    box-sizing: border-box;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    /* Between a start or end icon and the text */
    gap: 0.375em;
    /* At least a line of text tall, so an icon-only button is as tall as
       one with text */
    min-height: calc(1em * var(--yatl-size-line-height));
    /** TODO: This needs to match the spinner animation */
    transition: opacity 0.5s linear;
    transition-delay: 0.5s;
  }

  .state-wrapper {
    box-sizing: border-box;
    position: absolute;
    inset: 0;
    height: 100%;
    width: 100%;
    padding: var(--button-icon-padding);
  }

  .state-icon {
    height: 100%;
    width: 100%;
  }

  :host([state='loading']),
  :host([state='success']),
  :host([state='error']) {
    [part='contents'] {
      opacity: 0;
      transition-delay: 0s;
    }
  }

  :host([state='loading']) {
    pointer-events: none;
    cursor: wait;
    opacity: 0.8;
  }

  :host([disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  :host([disabled]) [part='base'] {
    cursor: not-allowed;
  }

  :host(:not([disabled]):hover) {
    background-color: var(--button-hover-bg);
  }

  :host([variant='outline']) {
    --button-bg: transparent;
    --button-text: var(--appearance-color);
    --button-border-color: var(--appearance-color);
  }

  :host([variant='plain']) {
    --button-text: var(--appearance-color);
    --button-bg: transparent;
  }

  /* Neutral color is too dim to be used without BG */
  :host([variant='plain'][color='neutral']) {
    --appearance-color: currentColor;
  }

  /* ...and as outline text, so only the border uses it */
  :host([variant='outline'][color='neutral']) {
    --button-text: currentColor;
  }
`;
