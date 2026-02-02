import { css } from 'lit';

export default css`
  :host {
    border-radius: 0;
  }

  .ui-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--yatl-spacing-m);
    height: 100%;
    width: 100%;
  }

  .wrapper {
    border-radius: var(--yatl-table-radius);
  }
`;
