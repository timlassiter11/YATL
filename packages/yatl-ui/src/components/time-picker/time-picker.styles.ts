import { css } from 'lit';

export default css`
  :host {
    display: block;
    --row-height: var(--yatl-time-picker-row-height, 2rem);
  }

  .columns {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--yatl-spacing-xs);
  }

  .column {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .separator {
    font-weight: bold;
    font-variant-numeric: tabular-nums;
  }

  /* Seven rows: the selected one in the middle, three either side */
  .viewport {
    position: relative;
    height: calc(var(--row-height) * 7);
    overflow: hidden;
    border-radius: var(--yatl-radius-m);
    outline: none;
    /* Touch drags spin the column rather than scrolling the page */
    touch-action: none;
    user-select: none;
  }

  .viewport:focus-visible {
    outline: 2px solid var(--yatl-color-brand);
    outline-offset: -2px;
  }

  /* Three spare rows above (and below) the visible ones */
  .track {
    margin-top: calc(var(--row-height) * -3);
  }

  .row {
    box-sizing: border-box;
    height: var(--row-height);
    min-width: 2.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
  }

  .option {
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }

  .option:hover:not(.selected):not(.disabled) {
    color: var(--yatl-color-brand);
  }

  .option.selected {
    background: var(--yatl-color-brand);
    background-clip: content-box;
    border-radius: var(--yatl-radius-m);
    color: var(--yatl-text-on-brand, white);
  }

  .option.disabled {
    opacity: 0.35;
    cursor: default;
  }

  .scroll-button {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 1.75rem;
    padding: 0;
    border: none;
    background: none;
    color: var(--yatl-text-3);
    font-size: 1.25rem;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .column:hover .scroll-button {
    opacity: 1;
  }

  .scroll-button:hover {
    color: var(--yatl-text-1);
  }

  /* Touch screens drag the columns instead */
  @media (hover: none) {
    .scroll-button {
      display: none;
    }
  }
`;
