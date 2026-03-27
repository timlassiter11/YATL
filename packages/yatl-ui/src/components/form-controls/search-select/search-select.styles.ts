import { css } from 'lit';

export default css`
  :host {
    --option-height: var(--yatl-select-option-height, 35px);
    --options-gap: var(--yatl-select-options-gap, 0);
    /* We need individual padding variables to calculate text-input height */
    --input-padding-left: var(
      --yatl-select-input-padding-left,
      var(--yatl-spacing-m)
    );
    --input-padding-right: var(
      --yatl-select-input-padding-right,
      var(--yatl-spacing-m)
    );
    --input-padding-top: var(
      --yatl-select-input-padding-top,
      var(--yatl-spacing-m)
    );
    --input-padding-bottom: var(
      --yatl-select-input-padding-bottom,
      var(--yatl-spacing-m)
    );

    --input-separator-width: var(--yatl-select-input-separator-width, 1px);
    --input-separator-color: var(
      --yatl-select-input-separator-color,
      var(--yatl-border-color)
    );
  }

  .column {
    display: flex;
    flex-direction: column;
  }

  .text-input {
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
  }

  .options {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: var(--options-gap);
    overflow-y: auto;
    flex-grow: 1;
    width: 100%;
    height: calc(var(--option-height) * var(--size, 4));
    padding: 0;
    border-width: var(--input-border-width);
    border-style: var(--input-border-style);
    border-color: var(--input-border-color);
    border-radius: var(--input-radius);
    border-top-width: 0px;
    border-top-left-radius: 0px;
    border-top-right-radius: 0px;
    color: var(--input-text);
    background-color: var(--input-bg);
    line-height: var(--input-line-height);
    font-size: large;
  }

  .trash-icon {
    opacity: 0;
    transition: opacity 0.1s ease;
  }

  .message {
    padding: var(--yatl-spacing-m);
  }

  /* Make all options the same size */
  yatl-option,
  ::slotted(yatl-option) {
    flex-shrink: 0;
    height: var(--option-height);
    --yatl-option-radius: 0px;
    --yatl-option-mark-color: var(--yatl-text-1);
    --yatl-option-mark-bg: transparent;
    --yatl-option-mark-font-weight: 700;
  }

  .has-query ::slotted(yatl-option) {
    /* Dim text when searching so marks standout. */
    --yatl-option-color: var(--yatl-text-2);
  }

  yatl-option::part(check) {
    opacity: 0;
  }

  yatl-option {
    --yatl-option-hover-bg: var(--yatl-color-danger);
  }

  yatl-option:hover [part='selected-trash-icon'] {
    opacity: 1;
  }
`;
