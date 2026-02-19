import { css } from 'lit';

export default css`
  :host {
    --filters-min-width: var(--yatl-table-view-filters-min-width, auto);
    --filters-max-width: var(--yatl-table-view-filters-max-width, 250px);
    --filters-width: var(
      --yatl-table-view-filters-width,
      minmax(var(--filters-min-width) var(--filters-max-width))
    );

    --filters-label-font-size: var(
      --yatl-table-view-filters-label-font-size,
      1.5em
    );
    --filters-label-font-weight: var(
      --yatl-table-view-filters-label-font-weight,
      bold
    );

    --row-gap: var(--yatl-table-view-row-gap, var(--yatl-spacing-l));
    --column-gap: var(--yatl-table-view-column-gap, var(--yatl-spacing-l));
  }

  .scroller {
    position: relative;
  }

  yatl-loading-overlay {
    --yatl-loading-overlay-bg: var(--table-bg);
    z-index: 1;
  }

  [part='view'] {
    display: grid;

    grid-template-rows: auto 1fr;
    grid-template-columns: var(--filters-width) 1fr;

    grid-row-gap: var(--row-gap);
    grid-column-gap: var(--column-gap);

    height: 100%;
    width: 100%;

    transition: grid-template-columns 200ms;
  }

  :host([hide-filters]) [part='view'] {
    grid-template-columns: 0 1fr;
    grid-column-gap: 0;
  }

  [part='filters-header'] {
    grid-row: 1;
    grid-column: 1;

    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    overflow: hidden;
  }

  [part='filters-label'] {
    font-size: var(--filters-label-font-size);
    font-weight: var(--filters-label-font-weight);
  }

  [part='sidebar'] {
    grid-row: 2;
    grid-column: 1;

    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    gap: var(--yatl-spacing-l);
  }

  [part='toolbar'] {
    grid-row: 1;
    grid-column: 2;
  }

  [part='table'] {
    grid-row: 2;
    grid-column: 2;
  }
`;
