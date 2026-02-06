import { css } from 'lit';

export default css`
  :host {
    --checkbox-accent-color: var(
      --yatl-checkbox-accent-color,
      var(--yatl-color-brand)
    );
    --checkbox-label-font-weight: var(--yatl-checkbox-font-weight, normal);
    --checkbox-label-font-szie: var(--yatl-checkbox-font-size, medium);
  }

  :host([inline]) {
    align-items: center;
  }

  [part='base'] {
    width: fit-content;
    display: flex;
    align-items: center;
  }

  [part='input'] {
    width: 1rem;
    height: 1rem;
    padding: 0;
    margin: 0;
    accent-color: var(--checkbox-accent-color);
  }

  [part='input']:focus,
  [part='input']:focus-visible {
    outline: none;
    outline-offset: 0;
  }

  [part='label'] {
    font-size: var(--checkbox-label-font-szie);
    font-weight: var(--checkbox-label-font-weight);
    user-select: none;
    width: 100%;
    cursor: pointer;
  }
`;
