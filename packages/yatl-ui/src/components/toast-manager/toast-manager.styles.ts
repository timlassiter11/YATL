import { css } from 'lit';

export default css`
  :host {
    --offset-x: var(--yatl-toast-manager-offset-x, 24px);
    --offset-y: var(--yatl-toast-manager-offset-y, 24px);
    --gap: var(--yatl-toast-manager-gap, var(--yatl-spacing-l));

    display: flex;
    flex-direction: column;
    gap: var(--gap);

    border: none;
    background: none;
    overflow: visible;
  }
  }
`;
