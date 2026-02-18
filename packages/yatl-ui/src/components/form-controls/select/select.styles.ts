import { css } from 'lit';

export default css`
  :host {
    --select-arrow-color: var(--yatl-select-arrow-color, var(--yatl-text-3));
    --select-arrow-hover-color: var(
      --yatl-select-arrow-hover-color,
      var(--yatl-text-1)
    );
    --select-clear-color: var(--yatl-select-clear-color, var(--yatl-text-3));
    --select-clear-hover-color: var(
      --yatl-select-clear-hover-color,
      var(--yatl-text-1)
    );
  }

  .text-input {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    position: relative;
    padding: 0 var(--input-padding);
  }

  [part='input'] {
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
  }

  .input-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
  }

  [part='tags'] {
    display: flex;
    flex-direction: row;
    gap: var(--yatl-spacing-xs);
    flex-wrap: wrap;
    margin-left: calc(var(--yatl-spacing-s) * -1);
    flex-grow: 1;
    padding: var(--yatl-spacing-xs) 0;
  }

  :host(:not([multi])) [part='tags'] {
    display: none;
  }

  [part='clear-icon'],
  [part='arrow-icon'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.15rem;
    height: 1.15rem;
    background-color: inherit;
    margin-left: var(--yatl-spacing-xs);
    z-index: 1;
    flex-shrink: 0;
  }

  yatl-button[part='clear-icon'] {
    border: none;
  }

  yatl-button[part='clear-icon']::part(base) {
    appearance: none;
    background: none;
    border: none;
    margin: 0;
    padding: 0;
    color: var(--select-clear-color);
    margin-right: var(--yatl-spacing-xs);
  }

  [part='arrow-icon'] {
    transition: transform 0.2s ease-in-out;
    pointer-events: none;
    color: var(--select-arrow-color);
  }

  :host(:hover) [part='arrow-icon'] {
    color: var(--select-arrow-hover-color);
  }

  [part='clear-icon']:hover ~ [part='arrow-icon'] {
    color: var(--select-arrow-color, gray);
  }

  [part='clear-icon']:hover {
    color: var(--select-clear-hover-color);
  }

  :host(:state(open)) [part='arrow-icon'],
  :host([open]) [part='arrow-icon'] {
    transform: rotate(-180deg);
  }
`;
