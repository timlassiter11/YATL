import { css } from 'lit';

export default css`
  :host {
    --radio-color: var(--yatl-radio-color, var(--yatl-text-1));
    --radio-bg: var(--yatl-radio-bg, var(--yatl-surface-1));
    --radio-accent-color: var(
      --yatl-checkbox-accent-color,
      var(--yatl-color-brand)
    );
    --radio-label-font-weight: var(--yatl-radio-font-weight, 600);
    --radio-label-font-szie: var(--yatl-radio-font-size, 1rem);
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

    display: inline-flex;
    align-items: center;
    gap: var(--yatl-spacing-xs);
    vertical-align: middle;
    cursor: pointer;
  }

  [part='base'] {
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
    transition:
      background 250ms,
      border-color 250ms,
      box-shadow 250ms,
      color 250ms;
    transition-timing-function: ease;
    margin-inline-end: 0.5em;
  }

  [part='input'] {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
    margin: 0;
  }

  [part='radio'] {
    display: flex;
    fill: currentColor;
    width: var(--radio-size);
    height: var(--radio-size);
    scale: var(--radio-scale);
  }

  :host(:not(:state(checked))) svg circle {
    opacity: 0;
  }

  :host(:state(checked)) [part='base'] {
    color: var(--radio-accent-color);
    border-color: var(--radio-accent-color);
  }

  :host(:focus-visible) [part='base'] {
    outline: var(--radio-focus-color);
    outline-offset: 3px;
  }

  :host(:hover) [part='base'] {
    border-color: var(--radio-accent-color);
  }

  :host([disabled]) {
    opacity: 0.6;
    cursor: not-allowed;
  }

  :host([disabled]) [part='radio'] {
    pointer-events: none;
  }

  [part='label'] {
    font-size: var(--checkbox-label-font-size);
    font-weight: var(--checkbox-label-font-weight);
    color: var(--checkbox-label-color);
    line-height: 1;
    cursor: pointer;
    user-select: none;
  }
`;
