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

    --yatl-table-radius: 0 0 var(--yatl-radius-l) var(--yatl-radius-l);
    --yatl-table-border-width: 0;
  }

  .base {
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  yatl-loading-overlay {
    --yatl-loading-overlay-bg: var(--table-bg);
    z-index: 1;
  }

  :host([hide-filters]) {
    yatl-split-panel {
      grid-template-columns: 0 0 1fr;
    }
  }

  :host([hide-filters-clear-button]) .filters-clear-button {
    display: none;
  }

  .panel {
    display: flex;
    flex-direction: column;
    background-color: var(--yatl-surface-2);
    border-radius: var(--yatl-radius-l);
  }

  .panel-header {
    padding: var(--yatl-spacing-m);
  }

  .filters-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--yatl-border-color);
    /* This makes the border line up with the table toolbar border */
    --y-padding: calc(var(--yatl-spacing-m) + 2px);
    padding: var(--y-padding) var(--yatl-spacing-m);
  }

  .filters-label {
    font-size: var(--filters-label-font-size);
    font-weight: var(--filters-label-font-weight);
  }

  .toolbar {
    border-bottom: 1px solid var(--yatl-border-color);
  }

  .sidebar {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    gap: var(--yatl-spacing-l);
  }

  /*
   * Slotted content (e.g. yatl-card) may default to height: 100%, which
   * here would mean 100% of the sidebar itself rather than "whatever's
   * left after its siblings" - forcing it to squeeze into less space than
   * its own content needs and scroll internally, on top of the sidebar's
   * own scrollbar. The sidebar already scrolls as a whole, so let slotted
   * content size to its natural content height instead.
   */
  .sidebar ::slotted(*) {
    height: auto;
  }

  /* It's dumb I have to do this... hidden should always win over CSS */
  [hidden] {
    display: none !important;
  }
`;
