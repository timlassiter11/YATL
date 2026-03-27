import { css } from 'lit';

export default css`
  :host {
    --checkbox-accent-color: var(
      --yatl-checkbox-accent-color,
      var(--yatl-color-brand)
    );
    --checkbox-size: var(--yatl-checkbox-size, 1.25rem);
    --checkbox-bg: var(--yatl-checkbox-bg, var(--yatl-surface-1));
    --checkbox-border: var(--yatl-checkbox-border, var(--yatl-border-color));

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
    align-items: center;
  }

  .base {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--checkbox-size);
    height: var(--checkbox-size);
    flex-shrink: 0;
  }

  .input {
    appearance: none;
    -webkit-appearance: none;
    margin: 0;

    width: 100%;
    height: 100%;

    border: 1px solid var(--checkbox-border);
    border-radius: 4px;
    background-color: var(--checkbox-bg);
    cursor: pointer;
    position: relative;
    transition: all 0.1s ease-in-out;
  }

  .input:checked {
    background-color: var(--checkbox-accent-color);
    border-color: var(--checkbox-accent-color);
  }

  .input::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 45%;
    width: 25%;
    height: 55%;

    border: solid white;
    border-width: 0 2px 2px 0;

    transform: translate(-50%, -50%) rotate(45deg) scale(0);
    transition: transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .input:checked::after {
    transform: translate(-50%, -50%) rotate(45deg) scale(1);
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

  .input:focus-visible {
    outline: 2px solid var(--checkbox-accent-color);
    outline-offset: 2px;
  }
`;
