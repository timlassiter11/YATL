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

  [part='options'] {
    display: flex;
    flex-direction: column;
    gap: var(--options-gap);
    overflow-y: auto;
  }

  .text-input {
    display: flex;
    flex-direction: column;
    height: calc(
      var(--option-height) * var(--size, 4) + var(--input-padding-top) +
        var(--input-padding-bottom)
    );
    overflow: auto;
    justify-content: flex-start;
    padding: 0;
  }

  /* Need the specificity to override form control styles */
  .text-input > input[part='search'] {
    flex: 0 0 0%;
    padding-left: var(--input-padding-left);
    padding-right: var(--input-padding-right);
    padding-top: var(--input-padding-top);
    padding-bottom: var(--input-padding-bottom);
    border-bottom-width: var(--input-separator-width);
    border-bottom-style: solid;
    border-bottom-color: var(--input-separator-color);
  }

  [part='selected-trash-icon'] {
    opacity: 0;
    transition: opacity 0.1s ease;
  }

  [part='empty-options'] {
    padding: var(--yatl-spacing-m);
  }

  /* Make all options the same size */
  yatl-option,
  ::slotted(yatl-option) {
    flex-shrink: 0;
    height: var(--option-height);
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
