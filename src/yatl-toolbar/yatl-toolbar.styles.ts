import { css } from 'lit';

export default css`
  :host {
    box-sizing: border-box;
    --toolbar-search-radius: var(--yatl-toolbar-search-radius, var(--yatl-radius-m));
    --toolbar-search-padding: var(--yatl-toolbar-search-padding,  var(--yatl-spacing-m));
    --toolbar-search-bg: var(--yatl-toolbar-search-bg, var(--yatl-surface-2));
    --toolbar-search-outline-color: var(--yatl-toolbar-search-outline-color, var(--yatl-color-brand));
    --toolbar-search-outline-width: var(--yatl-toolbar-search-outline-width, 3px);
  }

  .toolbar {
    display: flex;
    flex-direction: row;
    gap: 10px;
  }

  .search {
    flex-grow: 1;
    border-radius: var(--toolbar-search-radius);
    background-color: var(--toolbar-search-bg);
    line-height: 1;
    border: none;
    font-size: large;
    padding: var(--toolbar-search-padding);
  }

  .search:focus,
  .search:focus-visible {
    outline: var(--toolbar-search-outline-width) solid var(--toolbar-search-outline-color);
    outline-offset: calc(var(--toolbar-search-outline-width) * -1);
  }

  yatl-button-group yatl-button {
    height: 100%;
  }
`;
