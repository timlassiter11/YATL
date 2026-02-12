import { css } from 'lit';

export default css`
  :host {
    --button-border-style: var(--yatl-button-border-style, solid);
    --button-radius: var(--yatl-button-radius, var(--yatl-radius-s));
    --button-padding: var(--yatl-button-padding, var(--yatl-spacing-s));
    --button-hover-bg: var(
      --yatl-button-hover-bg,
      color-mix(in srgb, var(--yatl-color-mix) 10%, var(--button-bg))
    );

    display: inline-block;

    /* Appearance sets color, variant decides how to use it */
    --appearance-text: var(--yatl-text-inverse);
    --appearance-color: var(--yatl-color-neutral);

    --button-text: var(--yatl-button-text, var(--appearance-text));
    --button-bg: var(--yatl-button-bg, var(--appearance-color));
    --button-border-width: var(--yatl-button-border-width, 1px);
    --button-border-color: var(--yatl-button-border, var(--appearance-color));
  }

  [part='base'] {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: var(--button-padding);
    border-radius: var(--button-radius);
    color: var(--button-text);
    font-size: large;
    font-weight: 500;
    background-color: var(--button-bg);
    border: var(--button-border-width) solid var(--button-border-color);
  }

  :host([disabled]) [part='base'] {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(100%);
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
    --appearance-color: var(--yatl-surface-2);
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
`;
