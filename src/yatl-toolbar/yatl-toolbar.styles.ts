import { css } from 'lit';

export default css`
  :host {
    box-sizing: border-box;
  }

  .toolbar {
    display: flex;
    flex-direction: row;
    gap: 10px;
  }

  .search {
    flex-grow: 1;
    border-radius: var(--yatl-input-radius);
    background-color: var(--bg-subtle);
    line-height: 1;
    border: none;
    font-size: large;
    padding: var(--yatl-input-padding);
  }

  .search:focus,
  .search:focus-visible {
    outline: 3px solid var(--yatl-brand-color);
    outline-offset: -3px;
  }

  yatl-button-group yatl-button {
    height: 100%;
  }
`;
