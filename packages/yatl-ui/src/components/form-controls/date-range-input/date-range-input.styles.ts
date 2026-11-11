import { css } from 'lit';

export default css`
  .footer {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-evenly;
    gap: var(--yatl-spacing-xs);
    padding-top: var(--yatl-spacing-m);
  }

  .footer > *:first-child {
    margin-right: auto;
  }

  /* The text a read-only range shows, e.g. "After Nov 1, 2026" */
  .formatted {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
