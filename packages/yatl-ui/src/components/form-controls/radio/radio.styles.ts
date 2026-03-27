import { css } from 'lit';

export default css`
  :host {
    --radio-color: var(--yatl-radio-color, var(--yatl-text-1));
    --radio-bg: var(--yatl-radio-bg, var(--yatl-surface-1));
    --radio-accent-color: var(
      --yatl-checkbox-accent-color,
      var(--yatl-color-brand)
    );
    --radio-size: var(--yatl-radio-size, 1.25rem);
    --radio-scale: var(--yatl-radio-scale, 0.7);
    --radio-border-width: var(--yatl-radio-border-width, 1px);
    --radio-border-style: var(--yatl-radio-border-style, solid);
    --radio-border-color: var(
      --yatl-radio-border-color,
      var(--yatl-border-color)
    );
    --radio-focus-color: var(--yatl-radio-focus-color, var(--yatl-color-brand));
    --radio-transition: var(--yatl-radio-transition, 0.2s ease-in-out);
  }

  :host([inline]) {
    /* 
     * remove the default gap to prevent 
     * click deadzone between control and label.
     */
    gap: 0;
    align-items: center;
  }

  .base {
    flex: 0 0 auto;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--radio-size);
    height: var(--radio-size);
    border-width: var(--radio-border-width);
    border-style: var(--radio-border-style);
    border-color: var(--radio-border-color);
    border-radius: 50%;
    background-color: var(--radio-bg);
    color: transparent;
    transition: background-color 250ms, border-color 250ms, box-shadow 250ms,
      color 250ms;
    transition-timing-function: ease;
  }

  .input {
    position: absolute;
    opacity: 0;
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  .radio {
    display: flex;
    fill: currentColor;
    width: var(--radio-size);
    height: var(--radio-size);
    scale: var(--radio-scale);
    pointer-events: none;
  }

  label {
    display: inline-flex;
  }

  .label {
    position: relative;
    display: inline-block;
    vertical-align: baseline;
    font: inherit;
    color: inherit;
    cursor: pointer;
    padding-left: var(--yatl-spacing-m);
    line-height: 1;
    user-select: none;
    -webkit-user-select: none;
  }

  :host(:not(:state(checked))) svg circle {
    opacity: 0;
  }

  :host(:state(checked)) .base {
    color: var(--radio-accent-color);
    border-color: var(--radio-accent-color);
  }

  :host(:focus-visible) .base {
    outline: var(--radio-focus-color);
    outline-offset: 3px;
  }

  :host(:not([readonly])) {
    .input,
    .label {
      cursor: pointer;
    }
  }
`;
