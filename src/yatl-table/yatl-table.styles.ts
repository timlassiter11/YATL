import { css } from 'lit';

/**
 * we separate the CSS variable names between internal '--yatl' and external '--yatl-table'
 * so that way users can more easily customize the table. Instead of having to apply the
 * overrides to the element itself, they can apply them to the root. So DON'T think this
 * is overly complicated and should be cleaned up by combining the --yatl-* and --yatl-table-* variables.
 */
export default css`
  :host {
    /* Resize grab handle width */
    --yatl-resizer-width: var(--yatl-table-resizer-width, 10px);
    /* z-index for the header */
    --header-z-index: 2;

    overflow: hidden;
    border-radius: 6px;
  }

  .scroller {
    border: 1px solid var(--yatl-border-color);
    background-color: var(--yatl-header-bg);
  }

  .row {
    background-color: var(--yatl-bg);
    border-bottom: 1px solid var(--yatl-border-color);
    transition: background-color 50ms;
    position: relative;
  }

  .row.header-row {
    background-color: var(--yatl-header-bg);
    border-bottom: 1px solid var(--yatl-border-color);
    font-weight: 600;
    color: var(--yatl-header-text);
  }

  .table:not(.resizing) .row {
    transition: grid-template-columns var(--yatl-column-visibility-transition);
  }

  .row:last-child {
    border-bottom: none;
  }

  /* Use after element for row and header hover */
  .header.reorderable .cell::after,
  .header .cell.sortable::after,
  .row:not(.header)::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-color: transparent;
    transition: background-color 50ms;
    z-index: 1;
  }

  .table:not(.resizing) .header .cell:hover::after,
  .row:not(.header):hover::after {
    background-color: var(--yatl-row-hover-bg);
  }

  .row:not(.header).selected::after {
    background-color: var(--yatl-row-selected-bg);
  }

  .cell {
    align-items: center;
    padding: var(--yatl-cell-padding);
  }

  .table.resizing * {
    cursor: col-resize !important;
  }

  .header .cell {
    padding: var(--yatl-header-padding);
  }

  .footer {
    padding: 8px 12px;
    background-color: var(--yatl-header-bg);
    border-top: 1px solid var(--yatl-border-color);
    color: var(--yatl-text-muted);
    font-size: 0.8em;
  }

  .resizer::after {
    height: 60%;
    width: 1px;
    background-color: color-mix(in srgb, currentColor 30%, transparent);
    transition: background-color 0.2s;
  }

  .resizer:hover::after {
    background-color: currentColor;
    width: 2px;
  }

  .row-number-cell {
    background-color: var(--yatl-header-bg);
  }

  .row-checkbox {
    width: 1.125rem;
    height: 1.125rem;

    cursor: pointer;
    margin: 0;

    accent-color: var(--yatl-brand-color, var(--yatl-text));

    transition: transform 0.1s ease-in-out;
  }

  .row-checkbox:active {
    transform: scale(0.9);
  }

  .drop-indicator {
    background: var(--yatl-header-drop-bg);
  }

  .message {
    font-size: large;
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
    width: var(--yatl-resizer-width);
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
    padding: var(--yatl-cell-padding);
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
