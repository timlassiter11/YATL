import { css } from 'lit';

export default css`
  :host {
    border-radius: var(--yatl-radius-s);
    border: 1px solid var(--yatl-border-color);
    display: flex;
    align-items: center;
    padding: var(--yatl-spacing-xs);
    font-size: 0.85rem;
    color: var(--yatl-text-3);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  [part='dismiss-button'] {
    appearance: none;
    background: none;
    border: none;
    margin: 0;
    padding: 0;
    flex-shrink: 0;
  }

  yatl-button {
    border: none;
  }

  yatl-button[part='dismiss-button']::part(button) {
    padding: 0;
    margin: 0;
  }

  yatl-button[part='dismiss-button']::part(button):hover {
    color: var(--yatl-text-1);
    background: none;
  }
`;
