import { css } from 'lit';

export default css`
  :host {
    box-sizing: border-box;
    --toolbar-search-radius: var(
      --yatl-toolbar-search-radius,
      var(--yatl-radius-m)
    );
    --toolbar-search-padding: var(
      --yatl-toolbar-search-padding,
      var(--yatl-spacing-m)
    );
    --toolbar-search-bg: var(--yatl-toolbar-search-bg, var(--yatl-surface-2));
    --toolbar-search-outline-color: var(
      --yatl-toolbar-search-outline-color,
      var(--yatl-color-brand)
    );
    --toolbar-search-outline-width: var(
      --yatl-toolbar-search-outline-width,
      3px
    );
  }

  [part='base'] {
    display: flex;
    flex-direction: row;
    gap: 10px;
  }

  [part='search'] {
    flex-grow: 1;
    line-height: 1;
    font-size: large;
  }

  yatl-button-group yatl-button {
    height: 100%;
  }
`;
