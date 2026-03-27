import { css } from 'lit';

export default css`
  :host {
    --switch-color: var(--yatl-switch-color, var(--yatl-text-1));
    --switch-bg: var(--yatl-switch-bg, var(--yatl-surface-1));
    --switch-accent: var(--yatl-switch-accent, var(--yatl-color-brand));
    --switch-border-color: var(--yatl-switch-border-color, var(--yatl-text-3));

    --height: var(--yatl-switch-size, 1rem);
    --width: calc(var(--height) * 1.75);
    --thumb-size: 0.75em;

    display: inline-flex;
    align-items: center;
    vertical-align: middle;
  }

  :host([inline]) {
    /* 
     * remove the default gap to prevent 
     * click deadzone between control and label.
     */
    gap: 0;
  }

  .base {
    position: relative;
    width: fit-content;
  }

  .input {
    position: absolute;
    opacity: 0;
    padding: 0;
    margin: 0;
    cursor: pointer;
  }

  .switch {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--width);
    height: var(--height);
    background-color: var(--switch-bg);
    border: 1px solid var(--switch-border-color);
    border-radius: var(--height);
    transition-property: translate, background-color, border-color, box-shadow;
    transition-duration: 150ms;
    transition-timing-function: ease;
    /* Let the clicks fall through to the native input */
    pointer-events: none;
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

  label {
    display: inline-flex;
  }

  .label {
    position: relative;
    display: inline-block;
    vertical-align: baseline;
    font: inherit;
    color: var(--switch-color);
    cursor: pointer;
    padding-left: var(--yatl-spacing-m);
    line-height: var(--height);
    user-select: none;
    -webkit-user-select: none;
  }

  :host(:state(checked)) .switch {
    background-color: var(--switch-accent);
    border-color: var(--switch-accent);
  }

  :host(:state(checked)) .switch .thumb {
    background-color: var(--switch-bg);
    translate: calc((var(--width) - var(--height)) / 2);
  }

  :host(:not([readonly])) {
    .input,
    .label {
      cursor: pointer;
    }
  }
`;
