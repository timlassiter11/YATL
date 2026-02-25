import { css } from 'lit';

export default css`
  :host([size='small']) {
    --yatl-size-padding: var(--yatl-spacing-s);
    --yatl-size-font-size: var(--yatl-font-size-s);
  }

  :host(:not([size])),
  :host([size='medium']) {
    --yatl-size-padding: var(--yatl-spacing-m);
    --yatl-size-font-size: var(--yatl-font-size);
  }

  :host([size='large']) {
    --yatl-size-padding: var(--yatl-spacing-l);
    --yatl-size-font-size: var(--yatl-font-size-l);
  }
`;
