import { css } from 'lit';

export default css`
  :host {
    --button-border-style: var(--yatl-button-border-style, solid);
    --button-radius: var(--yatl-button-radius, var(--yatl-radius-s));
    --button-padding: var(--yatl-button-padding, var(--yatl-size-padding));
    --button-font-size: var(
      --yatl-button-font-size,
      var(--yatl-size-font-size)
    );
    --button-hover-bg: var(
      --yatl-button-hover-bg,
      color-mix(in srgb, var(--yatl-color-mix) 10%, var(--button-bg))
    );

    /* The color prop sets these and the variant prop decides how to use it */
    --appearance-text: var(--yatl-text-1);
    --appearance-color: var(--yatl-color-neutral);

    --button-text: var(--yatl-button-text, var(--appearance-text));
    --button-bg: var(--yatl-button-bg, var(--appearance-color));
    --button-border-width: var(--yatl-button-border-width, 2px);
    --button-border-color: var(--yatl-button-border, transparent);

    display: inline-block;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: var(--button-radius);
    position: relative;
  }

  [part='base'] {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    cursor: pointer;
    padding: var(--button-padding);
    color: var(--button-text);
    font-size: var(--button-font-size);
    font-weight: 500;
    background-color: var(--button-bg);
    border: var(--button-border-width) solid var(--button-border-color);
  }

  [part='contents'] {
    box-sizing: border-box;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
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
    padding: var(--button-padding);
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

  :host(:not([disabled])) [part='base']:hover {
    background-color: var(--button-hover-bg);
  }

  :host([color='brand']) {
    --appearance-color: var(--yatl-color-brand);
    --appearance-text: var(--yatl-text-brand);
  }

  :host([color='danger']) {
    --appearance-color: var(--yatl-color-danger);
    --appearance-text: white;
  }

  :host([color='warning']) {
    --appearance-color: var(--yatl-color-warning);
    --appearance-text: white;
  }

  :host([color='success']) {
    --appearance-color: var(--yatl-color-success);
    --appearance-text: white;
  }

  :host([color='raised']) {
    --appearance-color: var(--yatl-surface-raised-1);
    --appearance-text: var(--yatl-text-1);
  }

  :host([color='muted']) {
    --appearance-color: var(--yatl-text-3);
    --appearance-text: white;
  }

  :host([variant='outline']) {
    --button-bg: transparent;
    --button-text: var(--appearance-color);
    --button-border-color: var(--appearance-color);
  }

  :host([variant='plain']) {
    --button-text: var(--appearance-color);
    --button-bg: transparent;
    --button-border-width: 0;
  }

  /* Neutral color is too dim to be used without BG */
  :host([variant='plain'][color='neutral']) {
    --appearance-color: var(--yatl-text-2);
  }
`;
