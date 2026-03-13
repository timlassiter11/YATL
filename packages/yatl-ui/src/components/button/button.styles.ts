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
    --button-state-animation-duration: var(
      --yatl-button-state-animation-duration,
      0.5s
    );
    --success-state-color: white;
    --success-state-bg: var(--yatl-color-success);
    --error-state-color: white;
    --error-state-bg: var(--yatl-color-danger);

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
  }

  .state-layer {
    position: absolute;
    inset: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    z-index: 1;
  }

  .state-layer::after {
    content: '';
    position: absolute;
    inset: 0;

    clip-path: circle(0% at center);
    transition: clip-path;
    transition-timing-function: linear;
    transition-duration: var(--button-state-animation-duration);
  }

  .state-icon {
    z-index: 2;
    --check-color: var(--success-state-color);
    --error-color: var(--error-state-color);
  }

  :host([state='loading']),
  :host([state='success']),
  :host([state='error']) {
    [part='contents'] {
      opacity: 0;
    }
  }

  :host([state='loading']) {
    pointer-events: none;
    cursor: wait;
    opacity: 0.8;
  }

  :host([state='success']) {
    .state-layer::after {
      background-color: var(--success-state-bg);
      clip-path: circle(150% at center);
    }
  }

  :host([state='error']) {
    .state-layer::after {
      background-color: var(--error-state-bg);
      clip-path: circle(150% at center);
    }
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

    --success-state-color: white;
    --success-state-bg: var(--yatl-color-success);
    --error-state-color: white;
    --error-state-bg: var(--yatl-color-danger);
  }

  :host([color='danger']) {
    --appearance-color: var(--yatl-color-danger);
    --appearance-text: white;

    --success-state-color: white;
    --success-state-bg: var(--yatl-color-success);
    --error-state-color: var(--yatl-color-danger);
    --error-state-bg: white;
  }

  :host([color='warning']) {
    --appearance-color: var(--yatl-color-warning);
    --appearance-text: white;

    --success-state-color: white;
    --success-state-bg: var(--yatl-color-success);
    --error-state-color: white;
    --error-state-bg: var(--yatl-color-danger);
  }

  :host([color='success']) {
    --appearance-color: var(--yatl-color-success);
    --appearance-text: white;

    --success-state-color: var(--yatl-color-success);
    --success-state-bg: white;
    --error-state-color: white;
    --error-state-bg: var(--yatl-color-danger);
  }

  :host([color='raised']) {
    --appearance-color: var(--yatl-surface-raised-1);
    --appearance-text: var(--yatl-text-1);

    --success-state-color: white;
    --success-state-bg: var(--yatl-color-success);
    --error-state-color: white;
    --error-state-bg: var(--yatl-color-danger);
  }

  :host([color='muted']) {
    --appearance-color: var(--yatl-text-3);
    --appearance-text: white;

    --success-state-color: white;
    --success-state-bg: var(--yatl-color-success);
    --error-state-color: white;
    --error-state-bg: var(--yatl-color-danger);
  }

  :host([variant='outline']) {
    --button-bg: transparent;
    --button-text: var(--appearance-color);
    --button-border-color: var(--appearance-color);

    --success-state-color: var(--yatl-color-success);
    --success-state-bg: transparent;
    --error-state-color: var(--yatl-color-danger);
    --error-state-bg: transparent;
  }

  :host([variant='plain']) {
    --button-text: var(--appearance-color);
    --button-bg: transparent;
    --button-border-width: 0;

    --success-state-color: var(--yatl-color-success);
    --success-state-bg: transparent;
    --error-state-color: var(--yatl-color-danger);
    --error-state-bg: transparent;
  }

  /* Neutral color is too dim to be used without BG */
  :host([variant='plain'][color='neutral']) {
    --appearance-color: var(--yatl-text-2);
  }
`;
