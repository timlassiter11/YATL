import { css } from 'lit';

export default css`
  :host {
    --input-radius: var(--yatl-input-radius, var(--yatl-radius-m));
    --input-padding: var(--yatl-input-padding, var(--yatl-spacing-m));
    --input-bg: var(--yatl-input-bg, var(--yatl-surface-2));
    --input-text: var(--yatl-input-text, var(--yatl-text-1));
    --input-outline-color: var(
      --yatl-input-outline-color,
      var(--yatl-color-brand)
    );
    --input-outline-width: var(--yatl-input-outline-width, 3px);
    --input-label-text: var(--yatl-input-label-text, var(--yatl-text-1));
    --input-label-font-size: var(--yatl-input-label-font-size, large);
    --input-label-font-weight: var(--yatl-input-label-font-weight, 700);

    --input-hint-text: var(--yatl-input-hint-text, var(--yatl-text-3));
    --input-hint-font-size: var(--yatl-input-hint-font-size, small);
    --input-error-text: var(--yatl-input-error-text, var(--yatl-color-danger));
    --input-error-font-size: var(--yatl-input-error-font-size, small);

    display: flex;
    flex-direction: column;
  }

  :host([inline]) {
    flex-direction: row;
    align-items: flex-end
  }

  [part='label'] {
    color: var(--input-label-text);
    font-size: var(--input-label-font-size);
    font-weight: var(--input-label-font-weight);
  }

  :host(:not([inline])) [part='label'] {
    margin-block-end: var(--yatl-spacing-s);
  }

  [part='input'] {
    box-sizing: border-box;
    border-radius: var(--input-radius);
    color: var(--input-text);
    background-color: var(--input-bg);
    line-height: 1;
    border: none;
    font-size: large;
    padding: var(--input-padding);
    width: 100%;
  }

  [part='input']:focus,
  [part='input']:focus-visible {
    outline: var(--input-outline-width) solid var(--input-outline-color);
    outline-offset: calc(var(--input-outline-width) * -1);
  }

  [part='hint'] {
    color: var(--input-hint-text);
    font-size: var(--input-hint-font-size);
  }

  [part='error'] {
    color: var(--input-error-text);
    font-size: var(--input-error-font-size);
  }
`;
