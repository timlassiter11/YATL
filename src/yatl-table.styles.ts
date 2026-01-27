import { css } from 'lit';

export default css`
  /* Style declarations */
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

    /* Colors */
    --yatl-bg: var(--yatl-table-bg, #ffffff);
    --yatl-text: var(--yatl-table-text, #0f172a);
    --yatl-text-muted: var(--yatl-table-text-muted, #64748b);
    --yatl-border-color: var(--yatl-table-border-color, #e2e8f0);

    --yatl-header-bg: var(--yatl-table-header-bg, #f8fafc);
    --yatl-header-text: var(--yatl-table-header-text, #475569);

    --yatl-row-hover-bg: var(--yatl-table-row-hover-bg, #f1f5f9);
    --yatl-row-selected-bg: var(--yatl-table-row-selected-bg, #e0f2fe);

    /* Resize grab handle width */
    --yatl-resizer-width: 10px;
    /* z-index for the header */
    --header-z-index: 2;
    /* Drop target background color */
    --header-drop-color: rgba(255, 255, 255, 0.1);

    font-family: var(--yatl-font-family);
    font-size: var(--yatl-font-size);
    color: var(--yatl-text);
  }

  :host(.dark) {
    --yatl-table-bg: #1e293b;
    --yatl-table-text: #f1f5f9;
    --yatl-table-text-muted: #94a3b8;
    --yatl-table-border-color: #334155;

    --yatl-table-header-bg: #0f172a;
    --yatl-table-header-text: #cbd5e1;

    --yatl-table-row-hover-bg: #334155;
    --yatl-table-row-selected-bg: #1e3a8a;
  }

  @media (prefers-color-scheme: dark) {
    :host {
      --yatl-bg: var(--yatl-table-bg, #1e293b);
      --yatl-text: var(--yatl-table-text, #f1f5f9);
      --yatl-text-muted: var(--yatl-table-text-muted, #94a3b8);
      --yatl-border-color: var(--yatl-table-border-color, #334155);

      --yatl-header-bg: var(--yatl-table-header-bg, #0f172a);
      --yatl-header-text: var(--yatl-table-header-text, #cbd5e1);

      --yatl-row-hover-bg: var(--yatl-table-row-hover-bg, #334155);
      --yatl-row-selected-bg: var(--yatl-table-row-selected-bg, #1e3a8a);
    }
  }

  :host {
    font-family: system-ui, sans-serif;
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

  .header .cell::after,
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
    background-color: rgba(0, 0, 0, 0.2);
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
    background: rgba(0, 0, 0, 0.4);
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
`;
