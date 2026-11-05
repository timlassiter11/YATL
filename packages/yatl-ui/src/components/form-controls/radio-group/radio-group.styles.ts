import { css } from 'lit';

export default css`
  .group {
    display: flex;
    flex-direction: column;
    gap: var(--yatl-radio-group-gap, var(--yatl-spacing-s));
  }
`;
