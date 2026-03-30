import { css } from 'lit';

export default css`
  :host {
    --select-arrow-color: var(
      --yatl-select-arrow-color,
      var(--input-placeholder-color)
    );
    --select-arrow-hover-color: var(
      --yatl-select-arrow-hover-color,
      var(--yatl-text-1)
    );
    --select-clear-color: var(
      --yatl-select-clear-color,
      var(--input-placeholder-color)
    );
    --select-clear-hover-color: var(
      --yatl-select-clear-hover-color,
      var(--yatl-text-1)
    );
  }

  :host([multi]) .text-input {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    height: fit-content;
    min-height: var(--input-height);
    padding: 0;
  }

  .input {
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
  }

  .input-row {
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    padding-left: 2px;
    padding-right: var(--yatl-spacing-s);
    gap: var(--yatl-spacing-xs);
  }

  .tags {
    display: flex;
    flex-direction: row;
    gap: var(--yatl-spacing-xs);
    flex-wrap: wrap;
    flex-grow: 1;
    padding: 2px;
    --yatl-tag-padding: var(--yatl-spacing-xs) var(--yatl-spacing-s);
  }

  :host(:not([multi])) .tags {
    display: none;
  }

  .clear-button,
  .icon {
    width: 1em;
    height: 1em;
    flex-shrink: 0;
    --yatl-button-hover-bg: none;
  }

  .clear-button::part(base) {
    appearance: none;

    border: none;
    margin: 0;
    padding: 0;
    color: var(--select-clear-color);
  }

  .arrow-icon {
    transform: rotate(-90deg);
    transition: transform 0.2s ease-in-out;
    pointer-events: none;
    color: var(--select-arrow-color);
  }

  :host(:hover) .arrow-icon {
    color: var(--select-arrow-hover-color);
  }

  .clear-button:hover ~ .arrow-icon {
    color: var(--select-arrow-color, gray);
  }

  .clear-button:hover > yatl-icon {
    color: var(--select-clear-hover-color);
  }

  :host([open]) .arrow-icon {
    transform: rotate(0deg);
  }
`;
