import { css } from 'lit';

export default css`
  :host {
    --checkbox-accent-color: var(
      --yatl-checkbox-accent-color,
      var(--yatl-color-brand)
    );
    --checkbox-label-font-weight: var(--yatl-checkbox-font-weight, 600);
    --checkbox-label-font-szie: var(--yatl-checkbox-font-size, 1rem);
    --checkbox-size: var(--yatl-checkbox-size, 1.25rem);
    --checkbox-bg: var(--yatl-checkbox-bg, var(--yatl-surface-1));
    --checkbox-border: var(--yatl-checkbox-border, var(--yatl-border-color));

    display: inline-flex;
    align-items: center;
    gap: var(--yatl-spacing-xs);
    vertical-align: middle;
    cursor: pointer;
  }

  [part='base'] {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--checkbox-size);
    height: var(--checkbox-size);
    flex-shrink: 0;
  }

  [part='input'] {
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

  [part='input']:checked {
    background-color: var(--checkbox-accent-color);
    border-color: var(--checkbox-accent-color);
  }

  [part='input']::after {
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

  [part='input']:checked::after {
    transform: translate(-50%, -50%) rotate(45deg) scale(1);
  }

  [part='label'] {
    font-size: var(--checkbox-label-font-size);
    font-weight: var(--checkbox-label-font-weight);
    color: var(--checkbox-label-color);
    line-height: 1.4;
    cursor: pointer;
    user-select: none;
  }

  [part='input']:focus-visible {
    outline: 2px solid var(--checkbox-accent-color);
    outline-offset: 2px;
  }

  :host(:hover) [part='input'] {
    border-color: var(--checkbox-accent-color);
  }

  :host([disabled]) {
    opacity: 0.6;
    pointer-events: none;
    cursor: not-allowed;
  }
`;
