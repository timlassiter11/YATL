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
    justify-content: space-around;
    cursor: pointer;
    padding: var(--button-padding);
    border-radius: var(--button-radius);
    color: var(--button-text);
    font-size: large;
    font-weight: 500;
    background-color: var(--button-bg);
    border: var(--button-border-width) solid var(--button-border-color);
  }

  .state-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: grid;
  }

  .icon {
    grid-area: 1 / 1; /* Forces both icons into the exact same spot */
    width: 1.2em;
    height: 1.2em;
    opacity: 0;
    transform: scale(0.5); /* Start them shrunken */
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  /* Set up the hidden stroke (24px is roughly the length of the checkmark path) */
  .checkmark polyline {
    stroke-dasharray: 24px;
    stroke-dashoffset: 24px;
  }

  :host([state='idle']) {
    .state-icon {
      display: none;
    }
  }

  :host([state='loading']) {
    pointer-events: none;

    [part='base'] {
      cursor: wait;
      position: relative;
      opacity: 0.8;
    }

    slot {
      visibility: hidden;
    }

    .spinner {
      opacity: 1;
      transform: scale(1);
    }
  }

  :host([state='success']) {
    slot {
      visibility: hidden;
    }

    .checkmark {
      opacity: 1;
      transform: scale(1);
      color: var(--yatl-color-success);
    }
    .checkmark polyline {
      animation: draw-check 0.4s ease-out forwards;
      /* Add a slight delay so the spinner fades out before the check draws */
      animation-delay: 0.1s;
    }
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

  @keyframes draw-check {
    to {
      stroke-dashoffset: 0;
    }
  }
`;
