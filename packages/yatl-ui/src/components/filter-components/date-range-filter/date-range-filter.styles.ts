import { css } from 'lit';

export default css`
  :host {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    overflow: hidden;
    width: fit-content;
  }

  yatl-button {
    color: var(--yatl-text-1);
  }

  yatl-input[part='input']::part(start) {
    flex-grow: 1;
  }

  .calendar {
    display: flex;
    flex-direction: column;
    gap: var(--yatl-spacing-xs);
  }

  .calendar-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    gap: var(--yatl-spacing-xs);
  }

  .calendar-footer {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-evenly;
    gap: var(--yatl-spacing-xs);
    padding-top: var(--yatl-spacing-m);
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }

  .grid-row {
    display: contents;
  }

  .header-cell {
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
  .day-button.is-today {
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

  .spacer {
    flex-grow: 1;
  }
`;
