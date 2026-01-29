import { css } from 'lit';

/**
 * we separate the CSS variable names between internal '--yatl' and external '--yatl-table'
 * so that way users can more easily customize the table. Instead of having to apply the 
 * overrides to the element itself, they can apply them to the root. So DON'T think this
 * is overly complicated and should be cleaned up by combining the --yatl-* and --yatl-table-* variables. 
 */
export default css`
  /* Theme declarations */
  :host {
    /* Typography */
    --yatl-font-family: var(
      --yatl-table-font,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      Helvetica,
      Arial,
      sans-serif,
      'Apple Color Emoji',
      'Segoe UI Emoji'
    );
    --yatl-font-size: var(--yatl-table-font-size, 0.875rem);
    --yatl-line-height: var(--yatl-table-line-height, 1.25rem);

    /* Spacing */
    --yatl-cell-padding: var(--yatl-table-cell-padding, 10px 16px);
    --yatl-header-padding: var(--yatl-table-header-padding, 12px 16px);

    /* Light colors */
    --yatl-bg-light: var(--yatl-table-bg-light, #ffffff);
    --yatl-text-light: var(--yatl-table-text-light, #0f172a);
    --yatl-text-muted-light: var(--yatl-table-text-muted-light, #64748b);
    --yatl-border-color-light: var(--yatl-table-border-color-light, #e2e8f0);
    --yatl-header-bg-light: var(
      --yatl-table-header-bg-light,
      color-mix(in srgb, black 5%, var(--yatl-bg))
    );
    --yatl-header-text-light: var(--yatl-table-header-text-light, #475569);
    --yatl-header-drop-bg-light: var(
      --yatl-table-drop-bg-light,
      color-mix(in srgb, black 5%, transparent)
    );
    --yatl-row-hover-bg-light: var(
      --yatl-table-row-hover-bg-light,
      color-mix(in srgb, black 5%, transparent)
    );
    --yatl-row-selected-bg-light: var(
      --yatl-table-row-selected-bg-light,
      color-mix(in srgb, black 20%, transparent)
    );

    /* Dark colors */
    --yatl-bg-dark: var(--yatl-table-bg-dark, #101219);
    --yatl-text-dark: var(--yatl-table-text-dark, #f1f5f9);
    --yatl-text-muted-dark: var(--yatl-table-text-muted-dark, #94a3b8);
    --yatl-border-color-dark: var(--yatl-table-border-color-dark, #1a1b1e);
    --yatl-header-bg-dark: var(
      --yatl-table-header-bg-dark,
      color-mix(in srgb, white 5%, var(--yatl-bg))
    );
    --yatl-header-text-dark: var(--yatl-table-header-text-dark, #cbd5e1);
    --yatl-header-drop-bg-dark: var(
      --yatl-table-drop-bg-dark,
      color-mix(in srgb, white 5%, transparent)
    );
    --yatl-row-hover-bg-dark: var(
      --yatl-table-row-hover-bg-dark,
      color-mix(in srgb, white 5%, transparent)
    );
    --yatl-row-selected-bg-dark: var(
      --yatl-table-row-selected-bg-dark,
      color-mix(in srgb, white 20%, transparent)
    );

    /* Applied colors */
    --yatl-bg: var(
      --yatl-table-bg,
      light-dark(var(--yatl-bg-light), var(--yatl-bg-dark))
    );
    --yatl-text: var(
      --yatl-table-text,
      light-dark(var(--yatl-text-light), var(--yatl-text-dark))
    );
    --yatl-text-muted: var(
      --yatl-table-text-muted,
      light-dark(var(--yatl-text-muted-light), var(--yatl-text-muted-dark))
    );
    --yatl-border-color: var(
      --yatl-table-border-color,
      light-dark(var(--yatl-border-color-light), var(--yatl-border-color-dark))
    );
    --yatl-header-bg: var(
      --yatl-table-header-bg,
      light-dark(var(--yatl-header-bg-light), var(--yatl-header-bg-dark))
    );
    --yatl-header-text: var(
      --yatl-table-header-text,
      light-dark(var(--yatl-header-text-light), var(--yatl-header-text-dark))
    );
    --yatl-header-drop-bg: var(
      --yatl-table-header-drop-bg,
      light-dark(
        var(--yatl-header-drop-bg-light),
        var(--yatl-header-drop-bg-dark)
      )
    );
    --yatl-row-hover-bg: var(
      --yatl-table-row-hover-bg,
      light-dark(var(--yatl-row-hover-bg-light), var(--yatl-row-hover-bg-dark))
    );
    --yatl-row-selected-bg: var(
      --yatl-table-row-selected-bg,
      light-dark(
        var(--yatl-row-selected-bg-light),
        var(--yatl-row-selected-bg-dark)
      )
    );

    /* Resize grab handle width */
    --yatl-resizer-width: var(--yatl-table-resizer-width, 10px);
    /* z-index for the header */
    --header-z-index: 2;

    font-family: var(--yatl-font-family);
    font-size: var(--yatl-font-size);
    color: var(--yatl-text);
  }

  .table {
    background-color: var(--yatl-bg);
    border: 1px solid var(--yatl-border-color);
    border-radius: 6px;
  }

  .header.row {
    background-color: var(--yatl-header-bg);
    border-bottom: 1px solid var(--yatl-border-color);
    font-weight: 600;
    color: var(--yatl-header-text);
  }

  .row {
    background-color: var(--yatl-bg);
    border-bottom: 1px solid var(--yatl-border-color);
    transition: background-color 50ms;
    position: relative;
  }

  .row:last-child {
    border-bottom: none;
  }

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

  .header .cell:hover::after,
  .row:not(.header):hover::after {
    background-color: var(--yatl-row-hover-bg);
  }

  .cell {
    align-items: center;
    padding: var(--yatl-cell-padding);
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
    height: 100%;
    width: fit-content;
    overflow: auto;
  }

  .table {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    min-height: 0;
    overflow: auto;
    box-sizing: border-box;
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
    position: relative;
    width: 1ch;
    align-self: stretch;
    padding: 0;
    overflow: hidden;
    flex-shrink: 0;
  }

  .sort-icon::after {
    content: '';
    position: absolute;
  }

  .sort-icon.descending::after {
    content: '\\2191';
  }

  .sort-icon.ascending::after {
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
    inset: 0;
    z-index: var(--header-z-index);
  }

  /* Generic table parts */
  .row {
    display: grid;
    grid-template-columns: var(--grid-template);
    min-width: 100%;
    width: fit-content;
  }

  .cell {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    position: relative;
    display: flex;
    align-items: center;
  }

  .message {
    width: 100%;
    height: 100%;
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
    text-overflow: ellipsis;
  }

  .body {
    height: 100%;
  }
`;
