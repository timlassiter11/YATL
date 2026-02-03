import { css } from 'lit';

/**
 * we separate the CSS variable names between internal '--yatl' and external '--yatl-table'
 * so that way users can more easily customize the table. Instead of having to apply the
 * overrides to the element itself, they can apply them to the root. So DON'T think this
 * is overly complicated and should be cleaned up by combining the --yatl-* and --yatl-table-* variables.
 */
export default css`
  @layer base, striped, hover, selected;

  :host {
    --table-cell-padding: var(
      --yatl-table-cell-padding,
      var(--yatl-spacing-m) var(--yatl-spacing-m)
    );
    --table-header-padding: var(
      --yatl-table-header-padding,
      var(--yatl-spacing-m) var(--yatl-spacing-l)
    );

    --table-text: var(--yatl-table-text, var(--yatl-text-1));
    --table-bg: var(--yatl-table-bg, var(--yatl-surface-1));
    --table-radius: var(--yatl-table-radius, var(--yatl-radius-m));
    --table-border-width: var(--yatl-table-border-width, 1px);
    --table-border-color: var(
      --yatl-table-border-color,
      var(--yatl-border-color)
    );

    --table-header-text: var(--yatl-table-header-text, var(--yatl-text-1));
    --table-header-bg: var(--yatl-table-header-bg, var(--yatl-surface-3));
    --table-header-hover-bg: var(
      --yatl-table-header-hover-bg,
      color-mix(in srgb, var(--table-header-bg), var(--yatl-mix-color) 5%)
    );
    --table-header-drop-bg: var(
      --yatl-table-header-drop-bg,
      color-mix(in srgb, var(--table-header-bg), var(--yatl-mix-color) 5%)
    );

    --table-row-text: var(--yatl-table-row-text, var(--yatl-text-1));
    --table-row-bg: var(--yatl-table-row-bg, var(--yatl-surface-2));
    --table-row-hover-bg: var(
      --yatl-table-row-hover-bg,
      color-mix(in srgb, var(--table-row-bg), var(--yatl-mix-color) 5%)
    );
    --table-row-stripe-bg: var(
      --yatl-table-row-stripe-bg,
      var(--yatl-surface-1)
    );
    --table-row-selected-bg: var(
      --yatl-table-row-selected-bg,
      color-mix(in srgb, var(--yatl-color-brand) 10%, transparent)
    );
    --table-footer-text: var(--yatl-table-footer-text, var(--yatl-tex-3));
    --table-selector-color: var(
      --yatl-table-selector-color,
      color-mix(in srgb, var(--table-row-bg), var(--yatl-color-brand, black) 5%)
    );

    --table-row-number-column-width: var(
      --yatl-table-row-number-column-width,
      48px
    );
    --table-row-selector-column-width: var(
      --yatl-table-row-selector-column-width,
      48px
    );
    --table-column-visibility-transition: var(
      --yatl-table-column-visibility-transition,
      100ms
    );

    /* Resize grab handle width */
    --resizer-width: var(--yatl-table-column-resizer-width, 10px);
    /* z-index for the header */
    --header-z-index: 2;
  }

  @layer base {
    .wrapper {
      overflow: hidden;
      border-radius: var(--table-radius);
    }

    .scroller {
      border: var(--table-border-width) solid var(--table-border-color);
    }

    .table {
      background-color: var(--table-bg);
    }

    .row {
      position: relative;
      background-color: var(--table-row-bg);
      border-bottom: 1px solid var(--table-border-color);
      transition: background-color 50ms;
    }

    .row.header-row {
      background-color: var(--table-header-bg);
      border-bottom: 1px solid var(--table-border-color);
      font-weight: 600;
      color: var(--table-header-text);
    }

    .table:not(.resizing) .row {
      transition: grid-template-columns
        var(--table-column-visibility-transition);
    }

    .body .row {
      background-color: var(--table-row-bg);
    }

    .row:last-child {
      border-bottom: none;
    }

    .cell {
      align-items: center;
      padding: var(--table-cell-padding);
    }

    .table.resizing * {
      cursor: col-resize !important;
    }

    .header .cell {
      padding: var(--table-header-padding);
    }

    .footer {
      padding: 8px 12px;
      background-color: var(--table-header-bg);
      border-top: 1px solid var(--table-border-color);
      color: var(--table-footer-text);
      font-size: 0.8em;
    }

    .resizer::after {
      height: 60%;
      width: 1px;
      background-color: color-mix(in srgb, currentColor 30%, transparent);
      transition: background-color 0.2s;
    }

    .row-number-cell {
      background-color: var(--table-header-bg);
    }

    .row-checkbox {
      width: 1.125rem;
      height: 1.125rem;

      cursor: pointer;
      margin: 0;

      accent-color: var(--table-selector-color);
      transition: transform 0.1s ease-in-out;
    }

    .row-checkbox:active {
      transform: scale(0.9);
    }
    .message {
      font-size: large;
    }
  }

  @layer striped {
    :host([striped]) .body .row:nth-child(even) {
      background-color: var(--table-row-stripe-bg);
    }
  }

  @layer hover {
    .table:not(.resizing) .header .cell:hover {
      background-color: var(--table-header-hover-bg);
    }
    .body .row:hover {
      background-color: var(--table-row-hover-bg);
    }
    .resizer:hover::after {
      background-color: currentColor;
      width: 2px;
    }
    .drop-indicator {
      background: var(--table-header-drop-bg);
    }
  }

  @layer selected {
    /* Use after element to blend selection color */
    .body .row.selected::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      transition: background-color 50ms;
      z-index: 1;
      background-color: var(--table-row-selected-bg);
    }
  }

  /* Layout stuff
  * Most of this is functional and needed
  * for the table to work properly. 
  * Modify with caution!
  */
  :host {
    display: block;
    width: 100%;
    height: 100%;
  }

  .wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .scroller {
    box-sizing: border-box;
    overflow: auto;
    width: 100%;
    height: 100%;
  }

  .table {
    box-sizing: border-box;
  }

  .body {
    min-width: 100%;
    width: fit-content;
    min-height: 100%;
    height: fit-content;
  }

  .header {
    z-index: var(--header-z-index);
    flex-shrink: 0;
    position: sticky;
    top: 0;
  }

  .header-content {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: baseline;
    gap: 0.5rem;
  }

  .sort-icon {
    display: none;
    position: relative;
    width: 1ch;
    align-self: stretch;
    padding: 0;
    overflow: hidden;
    flex-shrink: 0;
  }

  .sort-icon.ascending,
  .sort-icon.descending {
    display: block;
  }

  .sort-icon::after {
    content: '';
    position: absolute;
  }

  .sort-icon.ascending::after {
    content: '\\2191';
  }

  .sort-icon.descending::after {
    content: '\\2193';
  }

  .resizer {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: var(--resizer-width);
    cursor: col-resize;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .resizer::after {
    content: '';
    display: block;
  }

  .drop-indicator {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: calc(var(--header-z-index) + 1);
  }

  .drop-indicator.active {
    display: block;
  }

  .sortable {
    cursor: pointer;
  }

  /* Footer */
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;

    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: var(--header-z-index);
  }

  /* Generic table parts */
  .row {
    display: grid;
    grid-template-columns: var(--grid-template);
    /* This is required! Don't remove it. */
    min-width: 100%;
    width: fit-content;
  }

  .cell-wrapper {
    padding: 0;
    overflow: hidden;
    min-width: 0;
  }

  .cell {
    white-space: nowrap;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    height: 100%;
    box-sizing: border-box;
    min-width: 0;
  }

  /* Add the padding to the child */
  .cell:has(.row-number-cell),
  .cell:has(.row-selector-cell),
  .row-selector-cell {
    padding: 0;
  }

  .row-number-cell,
  .row-selector-cell > label {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: var(--table-cell-padding);
    height: 100%;
    width: 100%;
    box-sizing: border-box;
  }

  .message {
    position: absolute;
    inset: 0;
    text-align: center;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .truncate {
    display: block;
    white-space: nowrap;
    overflow: hidden;
  }
`;
