import { css } from 'lit';

export default css`
  :host {
    --switch-color: var(--yatl-switch-color, var(--yatl-text-1));
    --switch-bg: var(--yatl-switch-bg, var(--yatl-surface-1));
    --switch-accent: var(--yatl-switch-accent, var(--yatl-color-brand));
    --switch-border-color: var(--yatl-switch-border-color, var(--yatl-border-color));



    --height: var(--yatl-switch-size, 1rem);
    --width: calc(var(--height) * 1.75);
    --thumb-size: 0.75em;

    display: inline-flex;
    line-height: var(--yatl-switch-line-height, 1);
    cursor: pointer;
  }

  [part='base'] {
    position: relative;
    width: fit-content;
  }

  [part='label'] {
    position: relative;
    display: flex;
    align-items: center;
    font: inherit;
    color: var(--wa-form-control-value-color);
    vertical-align: middle;
    cursor: pointer;
  }

  .switch {
    flex: 0 0 auto;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--width);
    height: var(--height);
    background-color: var(--switch-bg);
    border: 1px solid var(--switch-border-color);
    border-radius: var(--height);
    transition-property: translate, background, border-color, box-shadow;
    transition-duration: 150ms;
    transition-timing-function: ease;
  }

  .switch .thumb {
    aspect-ratio: 1 / 1;
    width: var(--thumb-size);
    height: var(--thumb-size);
    background-color: var(--switch-border-color);
    border-radius: 50%;
    translate: calc((var(--width) - var(--height)) / -2);
    transition: inherit;
  }

  .input {
    position: absolute;
    opacity: 0;
    padding: 0;
    margin: 0;
    pointer-events: none;
  }

  label:not(.disabled) .input:focus-visible ~ .switch .thumb {
    outline: var(--wa-focus-ring);
    outline-offset: var(--wa-focus-ring-offset);
  }

  :host(:hover) .switch {
    border-color: var(--switch-accent);
  }

  :host(:state(checked)) .switch {
    background-color: var(--switch-accent);
    border-color: var(--switch-border-color);
  }

  :host(:state(checked)) .switch .thumb {
    background-color: var(--switch-bg);
    translate: calc((var(--width) - var(--height)) / 2);
  }

  [part~='label'] {
    display: inline-block;
    line-height: var(--height);
    margin-inline-start: 0.5em;
    user-select: none;
    -webkit-user-select: none;
  }
`;
