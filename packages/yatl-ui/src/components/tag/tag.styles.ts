import { css } from 'lit';

export default css`
  :host {
    --tag-radius: var(--yatl-tag-border-radius, var(--yatl-radius-s));
    --tag-border-color: var(--yatl-tag-border-color, var(--yatl-border-color));
    --tag-padding: var(--yatl-tag-padding, var(--yatl-spacing-s));
    --tag-color: var(--yatl-tag-color, var(--yatl-text-3));

    border-radius: var(--tag-radius);
    border: 1px solid var(--tag-border-color);
    display: flex;
    align-items: center;
    padding: var(--tag-padding);
    font-size: 0.85rem;
    color: var(--tag-color);
    white-space: nowrap;
    text-overflow: ellipsis;
    user-select: none;
  }

  .text {
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
  }

  .dismiss-button {
    appearance: none;
    background: none;
    border: none;
    margin: 0;
    padding: 0;
    flex-shrink: 0;
    margin-left: var(--yatl-spacing-xs);
    height: 100%;
  }

  yatl-button {
    border: none;
  }

  .dismiss-button::part(base) {
    padding: 0;
    margin: 0;
  }

  .dismiss-button::part(base):hover {
    color: var(--yatl-text-1);
    background: none;
  }

  yatl-icon {
    width: 0.85em;
    height: 0.85em;
  }
`;
