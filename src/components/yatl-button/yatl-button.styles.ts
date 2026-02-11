import { css } from 'lit';

export default css`
  :host {
    --button-radius: var(--yatl-button-radius, var(--yatl-radius-s));
    --button-padding: var(--yatl-button-padding, var(--yatl-spacing-s));
    --button-border-color: var(--yatl-button-border, var(--yatl-border-color));
    --button-border-width: var(--yatl-button-border-width, 1px);
    --button-text: var(--yatl-button-text, var(--yatl-text-1));
    --button-bg: var(--yatl-button-bg, var(--yatl-surface-3));
    --button-hover-bg: var(
      --yatl-button-hover-bg,
      color-mix(in srgb, var(--yatl-mix-color) 10%, var(--button-bg))
    );

    display: inline-block;
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

  :host([variant='outline']) {
    --button-bg: transparent;
  }

  :host([variant='brand']) {
    --button-text: var(--yatl-text-brand);
    --button-bg: var(--yatl-color-brand);
    --button-border-color: var(--yatl-color-brand);
  }

  :host([variant='icon']) {
    --button-border-width: 0;
    --button-text: var(--yatl-text-3);
    --button-bg: transparent;
  }
`;
