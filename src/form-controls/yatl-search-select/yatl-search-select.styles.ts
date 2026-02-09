import { css } from "lit";

export default css`
  :host {
    --option-height: 50px
  }

  [part='base'] {
    display: flex;
    flex-direction: column;
    gap: var(--yatl-spacing-m);
  }

  .text-input {
    display: flex;
    flex-direction: column;
    height: calc(var(--option-height) * var(--size, 4));
    overflow: auto;
    justify-content: flex-start;
    padding: 0;
  }

  .text-input > yatl-option {
    --yatl-option-hover-bg: var(--yatl-color-danger);
    height: var(--option-height);
  }

  .text-input > yatl-option::part(button) {
    padding: 0;
    margin: 0;
  }
`;