import { css } from 'lit';

export default css`
  :host {
    --option-height: var(--yatl-select-option-height, 45px);
    --options-gap: var(--yatl-select-options-gap, 0);
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
    height: calc(var(--option-height) * var(--size, 4));
    overflow: auto;
    justify-content: flex-start;
    padding: 0;
  }

  /* Need the specificity to override form control styles */
  .text-input > input[part='search'] {
    flex: 0 0 0%;
    padding: var(--input-padding);
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

  yatl-option {
    --yatl-option-hover-bg: var(--yatl-color-danger);
    height: var(--option-height);
  }

  yatl-option:hover [part='selected-trash-icon'] {
    opacity: 1;
  }
`;
