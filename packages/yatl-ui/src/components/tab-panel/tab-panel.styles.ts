import { css } from 'lit';

export default css`
  :host {
    --padding: var(--yatl-tab-panel-padding, var(--yatl-spacing-m));

    display: none;
  }

  :host([active]) {
    display: block;
  }

  [part='base'] {
    display: block;
    padding: var(--padding);
  }
`;
