import { css } from 'lit';

export default css`
  :host {
    --color: var(--yatl-divider-color, var(--yatl-border-color));
    --width: var(--yatl-divider-width, 1px);
    --spacing: var(--yatl-divider-spacing, var(--yatl-spacing-m));
  }

  :host(:not([orientation='vertical'])) {
    display: block;
    border-top: var(--width) solid var(--color);
    margin: var(--spacing) 0;
  }

  :host([orientation='vertical']) {
    display: inline-block;
    height: 100%;
    border-inline-start: var(--width) solid var(--color);
    margin: 0 var(--spacing);
    min-block-size: 1lh;
  }
`;
