import { css } from 'lit';

export default css`
  :host {
    --button-radius: var(--yatl-button-radius, var(--yatl-radius-s));
    --button-border-color: var(--yatl-button-border, var(--yatl-border-color));
    --button-border-width: var(--yatl-button-border-width, 1px);
    --button-text: var(--yatl-button-text, var(--yatl-text-3));
    --button-bg: var(--yatl-button-bg, var(--yatl-surface-3));
    --button-hover-text: var(
      --yatl-button-hover-text,
      var(--yatl-text-inverse)
    );
    --button-hover-bg: var(--yatl-button-hover-bg, var(--yatl-color-brand));

    display: block;
    box-sizing: border-box;
    overflow: hidden;
    padding: 0;

    color: var(--button-text);
    font-size: large;
    font-weight: 500;
    background: var(--button-bg);
    border-radius: var(--button-radius);
    border: var(--button-border-width) solid var(--button-border-color);
  }

  [part='button'] {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 8px;
    border: none;
    cursor: pointer;
    background-color: transparent;
    /* Helps center the icons */
    display: flex;
    align-items: center;
  }

  :host(:not([disabled])) [part='button']:hover {
    color: var(--button-hover-text);
    background: var(--button-hover-bg);
  }

  :host([disabled]) [part='button'] {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(100%);
    pointer-events: none;
  }
`;
