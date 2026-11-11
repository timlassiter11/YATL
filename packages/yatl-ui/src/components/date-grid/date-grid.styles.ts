import { css } from 'lit';

export default css`
  :host {
    display: block;
  }

  yatl-button {
    color: var(--yatl-text-1);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--yatl-spacing-xs);
  }

  .navigation {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    gap: var(--yatl-spacing-xs);
    /* Fill the calendar's width without setting it, so a longer title
       (a range of years) doesn't make the calendar wider */
    width: 0;
    min-width: 100%;
  }

  [part~='month-button'] {
    min-width: 0;
    white-space: nowrap;
  }

  .calendar {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }

  .week {
    display: contents;
  }

  .weekday {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--yatl-text-3);
  }

  .day-button {
    width: 100%;
    height: 100%;
    font-weight: 100;
    --button-font-size: 0.8rem;
  }

  /** Put this before is-start and is-end to make sure they win */
  :host([highlight-today]) .day-button.is-today {
    --button-bg: color-mix(in oklab, transparent 60%, var(--yatl-color-brand));
  }

  .day-button.is-start,
  .day-button.is-end {
    --button-bg: var(--yatl-color-brand);
  }

  .day-button.is-start:not(.is-end) {
    border-top-right-radius: 0px;
    border-bottom-right-radius: 0px;
  }

  .day-button.is-end:not(.is-start) {
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
  }

  .day-button.is-in-range {
    --button-radius: 0px;
    --button-bg: color-mix(in oklab, transparent 60%, var(--yatl-color-brand));
  }

  .day-button.is-outside-month {
    color: var(--yatl-text-2);
  }

  /* All the views share one cell, so it's as big as the biggest of them */
  .views {
    display: grid;
  }

  .view {
    grid-area: 1 / 1;
    display: flex;
    flex-direction: column;
  }

  .view.hidden {
    visibility: hidden;
  }

  /* The month and year views: a 3 x 4 grid filling the days' space */
  .picker {
    flex: 1 1 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: 1fr;
    gap: var(--yatl-spacing-xs);
  }

  .picker-button {
    width: 100%;
    height: 100%;
    --button-font-size: 0.85rem;
  }

  .picker-button.is-selected {
    --button-bg: var(--yatl-color-brand);
  }
`;
